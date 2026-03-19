from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER


SEVERITY_COLORS = {
    "P0": colors.HexColor("#FF6B6B"),
    "P1": colors.HexColor("#FFA502"),
    "P2": colors.HexColor("#FECA57"),
    "P3": colors.HexColor("#48DBFB"),
    "P4": colors.HexColor("#A4B0BD"),
}

SEVERITY_HEX = {
    "P0": "FF6B6B",
    "P1": "FFA502",
    "P2": "FECA57",
    "P3": "48DBFB",
    "P4": "A4B0BD",
}

PRIORITY_COLORS = {
    "HIGH": colors.HexColor("#FF6B6B"),
    "MEDIUM": colors.HexColor("#FECA57"),
    "LOW": colors.HexColor("#00E676"),
}

PRIORITY_HEX = {
    "HIGH": "FF6B6B",
    "MEDIUM": "FECA57",
    "LOW": "00E676",
}

BG = colors.HexColor("#0F1117")
CARD_BG = colors.HexColor("#1A1D27")
ACCENT = colors.HexColor("#6C5CE7")
TEXT = colors.HexColor("#E4E6EB")
TEXT_SEC = colors.HexColor("#8B95A5")
BORDER = colors.HexColor("#2D3142")


def generate_pdf(postmortem: dict) -> bytes:
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
    title_style = ParagraphStyle("Title", parent=styles["Normal"], fontSize=20, textColor=TEXT, spaceAfter=6, fontName="Helvetica-Bold")
    heading_style = ParagraphStyle("Heading", parent=styles["Normal"], fontSize=13, textColor=ACCENT, spaceAfter=4, spaceBefore=12, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, textColor=TEXT, spaceAfter=4, leading=14)
    small_style = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8, textColor=TEXT_SEC)
    code_style = ParagraphStyle("Code", parent=styles["Normal"], fontSize=9, textColor=colors.HexColor("#00D2D3"), fontName="Courier", backColor=colors.HexColor("#0D0F15"), spaceAfter=2)

    severity = postmortem.get("severity", "P3")
    sev_color = SEVERITY_COLORS.get(severity, TEXT_SEC)

    story = []

    # Header
    story.append(Paragraph("🔥 POSTMORTEM.AI", ParagraphStyle("Brand", parent=styles["Normal"], fontSize=9, textColor=ACCENT, fontName="Helvetica-Bold")))
    story.append(Paragraph(postmortem.get("title", "Incidente sin título"), title_style))
    sev_hex = SEVERITY_HEX.get(severity, "8B95A5")
    story.append(Paragraph(f"<font color='#{sev_hex}'>{severity}</font>  •  Generado {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", small_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=12))

    # Summary
    story.append(Paragraph("Resumen Ejecutivo", heading_style))
    story.append(Paragraph(postmortem.get("summary", ""), body_style))

    # Timeline
    story.append(Paragraph("Timeline", heading_style))
    timeline_data = [["Hora", "Evento", "Tipo"]]
    for entry in postmortem.get("timeline", []):
        timeline_data.append([
            entry.get("time", ""),
            entry.get("event", ""),
            entry.get("type", "").title(),
        ])
    if len(timeline_data) > 1:
        t = Table(timeline_data, colWidths=[3 * cm, 11 * cm, 3 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [CARD_BG, BG]),
            ("TEXTCOLOR", (0, 1), (-1, -1), TEXT),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

    # Root Cause
    story.append(Paragraph("Análisis de Causa Raíz", heading_style))
    story.append(Paragraph(postmortem.get("root_cause", ""), body_style))

    # Impact
    story.append(Paragraph("Impacto", heading_style))
    impact = postmortem.get("impact", {})
    impact_data = [
        ["Usuarios Afectados", impact.get("users_affected", "Desconocido")],
        ["Duración", impact.get("duration", "Desconocido")],
        ["Servicios", ", ".join(impact.get("services_affected", []))],
        ["Impacto Económico", impact.get("revenue_impact", "Desconocido")],
    ]
    t = Table(impact_data, colWidths=[5 * cm, 12 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), CARD_BG),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), ACCENT),
        ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("BACKGROUND", (1, 0), (1, -1), BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))

    # Actions Taken
    story.append(Paragraph("Acciones Tomadas Durante el Incidente", heading_style))
    for action in postmortem.get("actions_taken", []):
        story.append(Paragraph(f"• {action}", body_style))

    # Action Items
    story.append(Paragraph("Tareas de Seguimiento", heading_style))
    for item in postmortem.get("action_items", []):
        prio = item.get("priority", "MEDIUM")
        prio_hex = PRIORITY_HEX.get(prio, "8B95A5")
        story.append(Paragraph(
            f"<font color='#{prio_hex}'>[{prio}]</font> {item.get('description', '')} — <i>{item.get('owner', 'TBD')}</i>",
            body_style,
        ))

    # Lessons Learned
    story.append(Paragraph("Lecciones Aprendidas", heading_style))
    for i, lesson in enumerate(postmortem.get("lessons_learned", []), 1):
        story.append(Paragraph(f"{i}. {lesson}", body_style))

    # Monitoring Recommendations
    story.append(Paragraph("Recomendaciones de Monitoreo", heading_style))
    for rec in postmortem.get("monitoring_recommendations", []):
        story.append(Paragraph(f"• {rec}", body_style))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=16))
    story.append(Paragraph("Generado por Postmortem.ai — De logs caóticos a postmortems profesionales en segundos.", small_style))

    doc.build(story)
    return buffer.getvalue()
