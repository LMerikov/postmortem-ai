"""
Route /api/analyze — Phase 1+2+3 integrados:
- Phase 1: Filtrado local (ruido → <0.5s, sin LLM)
- Phase 2: Cache por similitud (incidente conocido → <0.3s, sin LLM)
- Phase 3: Multi-provider LLM (Groq → Claude fallback, ~3-5s)
"""
import json
import logging
from flask import Blueprint, request, jsonify, Response, stream_with_context
from services.llm_service import analyze_logs, analyze_logs_stream
from services.local_filtering import process_with_local_filter
from services.cache_service import normalize_for_cache, find_in_cache, save_to_cache
from models.postmortem import save_postmortem

logger = logging.getLogger(__name__)

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json(force=True)
    content = data.get("content", "").strip()
    stream = data.get("stream", False)

    if not content:
        return jsonify({"error": "content is required"}), 400

    # ─── PHASE 1: Filtrado local ──────────────────────────────────────────────
    _phase1_error = None
    try:
        postmortem_local, should_call_llm, severity_local, cleaned_content = \
            process_with_local_filter(content)
        logger.info(f"Phase1: should_call_llm={should_call_llm} severity={severity_local} "
                    f"content_len={len(content)} filtered_len={len(cleaned_content)}")
    except Exception as e:
        import traceback as _tb
        _phase1_error = f"{type(e).__name__}: {e}"
        logger.error(f"Phase1 EXCEPTION: {_phase1_error}\n{_tb.format_exc()}")
        should_call_llm = True
        cleaned_content = content

    if not should_call_llm:
        # Ruido puro — respuesta inmediata sin LLM ni cache
        import uuid as _uuid
        return jsonify({
            "id": str(_uuid.uuid4()),
            "status": "complete",
            "postmortem": postmortem_local,
            "_source": "local_filter"
        })

    # ─── PHASE 2: Cache por similitud ────────────────────────────────────────
    normalized = normalize_for_cache(cleaned_content)
    try:
        cached = find_in_cache(normalized, threshold=0.70)
        if cached:
            postmortem_id = save_postmortem(cached, source="cache")
            return jsonify({
                "id": postmortem_id,
                "status": "complete",
                "postmortem": cached,
                "_source": "cache",
                "_similarity": cached.get("_meta", {}).get("similarity_score", 1.0)
            })
    except Exception as e:
        logger.warning(f"Phase2 cache lookup error: {e}")

    # ─── PHASE 3: LLM (Groq → Claude fallback) ───────────────────────────────
    if stream:
        def generate():
            for chunk in analyze_logs_stream(content):
                parsed = json.loads(chunk)
                if parsed.get("status") == "complete":
                    postmortem_data = parsed["postmortem"]
                    postmortem_id = save_postmortem(postmortem_data, source="analyze")
                    parsed["id"] = postmortem_id
                    # Guardar en cache para reutilización futura
                    try:
                        save_to_cache(normalized, postmortem_data)
                    except Exception:
                        pass
                yield f"data: {json.dumps(parsed)}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        postmortem = analyze_logs(content)
        postmortem_id = save_postmortem(postmortem, source="analyze")

        # Guardar en cache para reutilización futura
        try:
            save_to_cache(normalized, postmortem)
        except Exception as e:
            logger.warning(f"Cache save error (non-blocking): {e}")

        resp = {"id": postmortem_id, "status": "complete", "postmortem": postmortem, "_source": "llm"}
        if _phase1_error:
            resp["_phase1_error"] = _phase1_error
        return jsonify(resp)
    except Exception as e:
        return jsonify({"error": str(e), "_phase1_error": _phase1_error}), 500
