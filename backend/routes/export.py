import logging
from flask import Blueprint, request, jsonify, Response
from services.markdown_generator import generate_markdown
from services.pdf_generator import generate_pdf
from models.postmortem import get_postmortem_by_id

export_bp = Blueprint("export", __name__)
logger = logging.getLogger(__name__)


def _get_created_at(postmortem: dict) -> str | None:
    """Obtiene la hora real de creación desde la BD usando el ID del postmortem."""
    postmortem_id = postmortem.get("id")
    if not postmortem_id:
        return None
    try:
        db_record = get_postmortem_by_id(postmortem_id)
        if db_record:
            return db_record.get("created_at")
    except Exception:
        pass
    return None


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
        logger.error("Markdown export failed: %s", e, exc_info=True)
        return jsonify({"error": "Markdown export failed"}), 500


@export_bp.route("/api/export/pdf", methods=["POST"])
def export_pdf():
    data = request.get_json(force=True)
    postmortem = data.get("postmortem")
    if not postmortem:
        return jsonify({"error": "postmortem data required"}), 400
    try:
        created_at = _get_created_at(postmortem)
        # Zona horaria del navegador del usuario (ej: "America/Santiago")
        timezone_name = data.get("timezone", "UTC")
        pdf_bytes = generate_pdf(postmortem, created_at=created_at, timezone_name=timezone_name)
        filename = postmortem.get("title", "postmortem").replace(" ", "_").lower()[:50]
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
        )
    except Exception as e:
        logger.error("PDF export failed: %s", e, exc_info=True)
        return jsonify({"error": "PDF export failed"}), 500
