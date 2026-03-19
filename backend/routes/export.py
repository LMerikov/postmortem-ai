from flask import Blueprint, request, jsonify, Response
from services.markdown_generator import generate_markdown
from services.pdf_generator import generate_pdf

export_bp = Blueprint("export", __name__)


@export_bp.route("/api/export/markdown", methods=["POST"])
def export_markdown():
    data = request.get_json(force=True)
    postmortem = data.get("postmortem")
    if not postmortem:
        return jsonify({"error": "postmortem data required"}), 400
    try:
        md = generate_markdown(postmortem)
        filename = postmortem.get("title", "postmortem").replace(" ", "_").lower()[:50]
        return Response(
            md,
            mimetype="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{filename}.md"'},
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@export_bp.route("/api/export/pdf", methods=["POST"])
def export_pdf():
    data = request.get_json(force=True)
    postmortem = data.get("postmortem")
    if not postmortem:
        return jsonify({"error": "postmortem data required"}), 400
    try:
        pdf_bytes = generate_pdf(postmortem)
        filename = postmortem.get("title", "postmortem").replace(" ", "_").lower()[:50]
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
