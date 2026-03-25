"""
Route /api/analyze — Phase 1+3 integrados:
- Phase 1: Filtrado local (ruido → respuesta <200ms, sin LLM)
- Phase 3: Multi-provider via llm_service (Kimi → Anthropic fallback)
"""
import json
import logging
from flask import Blueprint, request, jsonify, Response, stream_with_context
from services.llm_service import analyze_logs, analyze_logs_stream
from services.local_filtering import process_with_local_filter
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

    # ─── PHASE 1: Filtrado local ──────────────────────────────────────────
    _phase1_error = None
    try:
        postmortem_local, should_call_llm, severity_local, cleaned_content = \
            process_with_local_filter(content)
        logger.info(f"Phase1: should_call_llm={should_call_llm} severity={severity_local} "
                    f"content_len={len(content)} filtered_len={len(cleaned_content)}")
    except Exception as e:
        import traceback as _tb
        _phase1_error = f"{type(e).__name__}: {e}\n{_tb.format_exc()}"
        logger.error(f"Phase1 EXCEPTION: {_phase1_error}")
        should_call_llm = True  # fallback: enviar al LLM si Phase 1 falla

    if not should_call_llm:
        # Respuesta local <200ms — sin LLM, sin DB (ruido no requiere persistencia)
        import uuid as _uuid
        postmortem_id = str(_uuid.uuid4())
        return jsonify({
            "id": postmortem_id,
            "status": "complete",
            "postmortem": postmortem_local,
            "_source": "local_filter"
        })
    # ─────────────────────────────────────────────────────────────────────

    if stream:
        def generate():
            for chunk in analyze_logs_stream(content):
                parsed = json.loads(chunk)
                if parsed.get("status") == "complete":
                    postmortem_data = parsed["postmortem"]
                    postmortem_id = save_postmortem(postmortem_data, source="analyze")
                    parsed["id"] = postmortem_id
                yield f"data: {json.dumps(parsed)}\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        postmortem = analyze_logs(content)
        postmortem_id = save_postmortem(postmortem, source="analyze")
        resp = {"id": postmortem_id, "status": "complete", "postmortem": postmortem}
        if _phase1_error:
            resp["_phase1_error"] = _phase1_error  # Debug temporal
        return jsonify(resp)
    except Exception as e:
        return jsonify({"error": str(e), "_phase1_error": _phase1_error}), 500
