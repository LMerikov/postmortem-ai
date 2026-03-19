import json
from flask import Blueprint, request, jsonify, Response, stream_with_context
from services.llm_service import analyze_logs, analyze_logs_stream
from models.postmortem import save_postmortem

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json(force=True)
    content = data.get("content", "").strip()
    stream = data.get("stream", False)

    if not content:
        return jsonify({"error": "content is required"}), 400

    if stream:
        def generate():
            postmortem_data = None
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
        return jsonify({"id": postmortem_id, "status": "complete", "postmortem": postmortem})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
