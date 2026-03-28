import html
from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER


SEVERITY_COLORS = {
    "P0": colors.HexColor("#D63031"),
    "P1": colors.HexColor("#E17055"),
    "P2": colors.HexColor("#F39C12"),
    "P3": colors.HexColor("#0984E3"),
    "P4": colors.HexColor("#636E72"),
}

SEVERITY_HEX = {
    "P0": "D63031",
    "P1": "E17055",
    "P2": "F39C12",
    "P3": "0984E3",
    "P4": "636E72",
}

PRIORITY_HEX = {
    "HIGH": "D63031",
    "MEDIUM": "E67E22",
    "LOW": "27AE60",
}

# Colores para PDF (fondo blanco, legible)
BG       = colors.HexColor("#FFFFFF")
CARD_BG  = colors.HexColor("#F8F8F8")
ACCENT   = colors.HexColor("#5B3FB0")
TEXT     = colors.HexColor("#1A1A1A")
TEXT_SEC = colors.HexColor("#555555")
BORDER   = colors.HexColor("#DDDDDD")

# Ancho útil de A4 con márgenes de 2cm a cada lado
PAGE_WIDTH = A4[0] - 4 * cm  # ~17cm


def _cell(text, style):
    """Convierte texto en Paragraph para word-wrap correcto en tablas."""
    return Paragraph(str(text), style)


def _add_timeline_section(story, timeline, cell_hdr, cell_style, heading_style):
    """Agrega la sección de Timeline al PDF."""
    if not timeline:
        return
    story.append(Paragraph("Timeline", heading_style))
    col_w = [2.5 * cm, 11 * cm, 3.5 * cm]
    rows = [[
        _cell("Hora",   cell_hdr),
        _cell("Evento", cell_hdr),
        _cell("Tipo",   cell_hdr),
    ]]
    for entry in timeline:
        rows.append([
            _cell(html.escape(entry.get("time", "")),                       cell_style),
            _cell(html.escape(entry.get("event", "")),                      cell_style),
            _cell(html.escape(str(entry.get("type") or "").title()),        cell_style),
        ])
    t = Table(rows, colWidths=col_w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  ACCENT),
        ("ROWBACKGROUNDS",(0, 1),(-1, -1), [CARD_BG, BG]),
        ("GRID",         (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))


def _add_actions_section(story, actions, body_style, heading_style):
    """Agrega la sección de Acciones Tomadas al PDF."""
    if not actions:
        return
    story.append(Paragraph("Acciones Tomadas Durante el Incidente", heading_style))
    for action in actions:
        story.append(Paragraph(f"• {html.escape(str(action))}", body_style))


def _add_action_items_section(story, action_items, body_style, heading_style):
    """Agrega la sección de Tareas de Seguimiento al PDF."""
    if not action_items:
        return
    story.append(Paragraph("Tareas de Seguimiento", heading_style))
    for item in action_items:
        prio     = item.get("priority", "MEDIUM")
        prio_hex = PRIORITY_HEX.get(prio, "555555")
        desc     = html.escape(str(item.get("description", "")))
        owner    = html.escape(str(item.get("owner", "TBD")))
        story.append(Paragraph(
            f"<font color='#{prio_hex}'><b>[{prio}]</b></font> {desc} — <i>{owner}</i>",
            body_style,
        ))


def _add_lessons_section(story, lessons, body_style, heading_style):
    """Agrega la sección de Lecciones Aprendidas al PDF."""
    if not lessons:
        return
    story.append(Paragraph("Lecciones Aprendidas", heading_style))
    for i, lesson in enumerate(lessons, 1):
        story.append(Paragraph(f"{i}. {html.escape(str(lesson))}", body_style))


def _add_monitoring_section(story, recs, body_style, heading_style):
    """Agrega la sección de Recomendaciones de Monitoreo al PDF."""
    if not recs:
        return
    story.append(Paragraph("Recomendaciones de Monitoreo", heading_style))
    for rec in recs:
        story.append(Paragraph(f"• {html.escape(str(rec))}", body_style))


def _format_created_at(created_at: str | None) -> str:
    """
    Formatea el timestamp de BD a formato legible.
    created_at viene como ISO 8601: '2026-03-28T14:23:00+00:00' o '2026-03-28T14:23:00'
    Devuelve: '2026-03-28 14:23 UTC'
    Si no hay fecha, devuelve la hora actual como fallback.
    """
    if created_at:
        try:
            # Parsear ISO 8601 con o sin zona horaria
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            # Convertir a UTC si tiene zona horaria
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc)
            return dt.strftime("%Y-%m-%d %H:%M") + " UTC"
        except (ValueError, AttributeError):
            pass
    # Fallback: hora actual del servidor en UTC
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M") + " UTC"


def generate_pdf(postmortem: dict, created_at: str | None = None) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    title_style   = ParagraphStyle("Title",   parent=styles["Normal"], fontSize=15, textColor=TEXT,     spaceAfter=4,  fontName="Helvetica-Bold", leading=19, wordWrap='CJK')
    heading_style = ParagraphStyle("Heading", parent=styles["Normal"], fontSize=11, textColor=ACCENT,   spaceAfter=4,  spaceBefore=14, fontName="Helvetica-Bold")
    body_style    = ParagraphStyle("Body",    parent=styles["Normal"], fontSize=9,  textColor=TEXT,     spaceAfter=4,  leading=13)
    small_style   = ParagraphStyle("Small",   parent=styles["Normal"], fontSize=8,  textColor=TEXT_SEC, spaceAfter=2)
    cell_style    = ParagraphStyle("Cell",    parent=styles["Normal"], fontSize=8,  textColor=TEXT,     leading=11,    wordWrap='CJK')
    cell_hdr      = ParagraphStyle("CellHdr", parent=styles["Normal"], fontSize=8,  textColor=colors.white, fontName="Helvetica-Bold", leading=11)
    cell_lbl      = ParagraphStyle("CellLbl", parent=styles["Normal"], fontSize=8,  textColor=ACCENT,   fontName="Helvetica-Bold", leading=11)
    brand_style   = ParagraphStyle("Brand",   parent=styles["Normal"], fontSize=8,  textColor=ACCENT,   fontName="Helvetica-Bold")
    sev_badge     = ParagraphStyle("SevBadge",parent=styles["Normal"], fontSize=9,  textColor=colors.white, fontName="Helvetica-Bold", alignment=TA_CENTER)

    severity  = postmortem.get("severity", "P3")
    sev_color = SEVERITY_COLORS.get(severity, colors.HexColor("#636E72"))

    story = []

    # ── Header ──────────────────────────────────────────────────────
    # Fila superior: marca izquierda, severidad derecha
    header_top = Table(
        [[Paragraph("POSTMORTEM.AI", brand_style),
          Paragraph(f"<b>{severity}</b>", sev_badge)]],
        colWidths=[PAGE_WIDTH - 1.5 * cm, 1.5 * cm]
    )
    header_top.setStyle(TableStyle([
        ("BACKGROUND",   (1, 0), (1, 0), sev_color),
        ("ROUNDEDCORNERS", [4]),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (1, 0), (1, 0), 4),
        ("RIGHTPADDING", (1, 0), (1, 0), 4),
    ]))
    story.append(header_top)
    story.append(Spacer(1, 4))

    # Título del incidente
    story.append(Paragraph(html.escape(postmortem.get("title", "Incidente sin título")), title_style))

    # Fecha de creación real desde BD (no hora de exportación)
    story.append(Paragraph(
        f"Generado {_format_created_at(created_at)}",
        small_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=sev_color, spaceAfter=10))

    # ── Resumen Ejecutivo ────────────────────────────────────────────
    story.append(Paragraph("Resumen Ejecutivo", heading_style))
    story.append(Paragraph(html.escape(postmortem.get("summary", "")), body_style))

    # ── Timeline ────────────────────────────────────────────────────
    timeline = postmortem.get("timeline", [])
    _add_timeline_section(story, timeline, cell_hdr, cell_style, heading_style)

    # ── Análisis de Causa Raíz ───────────────────────────────────────
    story.append(Paragraph("Análisis de Causa Raíz", heading_style))
    story.append(Paragraph(html.escape(postmortem.get("root_cause", "")), body_style))

    # ── Impacto ──────────────────────────────────────────────────────
    story.append(Paragraph("Impacto", heading_style))
    impact = postmortem.get("impact", {})
    services = ", ".join(impact.get("services_affected", [])) or "Desconocido"
    impact_rows = [
        [_cell("Usuarios Afectados", cell_lbl), _cell(impact.get("users_affected", "Desconocido"), cell_style)],
        [_cell("Duración",           cell_lbl), _cell(impact.get("duration", "Desconocido"),       cell_style)],
        [_cell("Servicios",          cell_lbl), _cell(services,                                     cell_style)],
        [_cell("Impacto Económico",  cell_lbl), _cell(impact.get("revenue_impact", "Desconocido"), cell_style)],
    ]
    t = Table(impact_rows, colWidths=[4.5 * cm, 12.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (0, -1), CARD_BG),
        ("BACKGROUND",   (1, 0), (1, -1), BG),
        ("GRID",         (0, 0), (-1, -1), 0.4, BORDER),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

    # ── Acciones Tomadas ─────────────────────────────────────────────
    actions = postmortem.get("actions_taken", [])
    _add_actions_section(story, actions, body_style, heading_style)

    # ── Tareas de Seguimiento ────────────────────────────────────────
    action_items = postmortem.get("action_items", [])
    _add_action_items_section(story, action_items, body_style, heading_style)

    # ── Lecciones Aprendidas ─────────────────────────────────────────
    lessons = postmortem.get("lessons_learned", [])
    _add_lessons_section(story, lessons, body_style, heading_style)

    # ── Recomendaciones de Monitoreo ─────────────────────────────────
    recs = postmortem.get("monitoring_recommendations", [])
    _add_monitoring_section(story, recs, body_style, heading_style)

    # ── Footer ───────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=14))
    story.append(Paragraph(
        "Generado por <b>Postmortem.ai</b> — De logs caóticos a postmortems profesionales en segundos.",
        small_style))

    doc.build(story)
    return buffer.getvalue()
