import html
from io import BytesIO
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
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


def _add_error_classification_section(story, error_classification, context, body_style, heading_style, cell_style, cell_lbl):
    """Agrega clasificación del error y contexto del evento."""
    has_classification = error_classification and (error_classification.get("type") or error_classification.get("name"))
    has_context = context and any(v and v != "No identificado" for v in context.values())
    if not has_classification and not has_context:
        return

    story.append(Paragraph("Clasificación del Error", heading_style))
    rows = []
    if has_classification:
        rows.append([_cell("Tipo", cell_lbl), _cell(html.escape(str(error_classification.get("type", ""))), cell_style)])
        rows.append([_cell("Error", cell_lbl), _cell(html.escape(str(error_classification.get("name", ""))), cell_style)])
    if has_context:
        for label, key in [("Endpoint", "endpoint"), ("Parámetros", "parameters"), ("Origen", "origin")]:
            val = context.get(key, "")
            if val and val != "No identificado":
                rows.append([_cell(label, cell_lbl), _cell(html.escape(str(val)), cell_style)])

    if rows:
        t = Table(rows, colWidths=[4.5 * cm, 12.5 * cm])
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


def _add_evidence_section(story, evidence_lines, body_style, heading_style):
    """Agrega la sección de Evidencia Clave del log."""
    if not evidence_lines:
        return
    story.append(Paragraph("Evidencia Clave", heading_style))
    for line in evidence_lines:
        story.append(Paragraph(
            f"• <font name='Courier' size='8'>{html.escape(str(line))}</font>",
            body_style
        ))
    story.append(Spacer(1, 4))


def _add_security_and_confidence(story, security_assessment, confidence_level, attack_analysis, body_style, heading_style, cell_style, cell_lbl):
    """Agrega evaluación de seguridad, nivel de confianza y análisis de ataque en una sola tabla."""
    if not security_assessment and not confidence_level:
        return

    story.append(Paragraph("Evaluación de Seguridad", heading_style))
    rows = []
    detected = "no"
    if security_assessment:
        detected = security_assessment.get("detected", "no")
        color_map = {"yes": "D63031", "suspicious": "F39C12", "no": "27AE60"}
        label_map = {"yes": "ATAQUE DETECTADO", "suspicious": "SOSPECHOSO", "no": "Sin amenaza"}
        color_hex = color_map.get(detected, "555555")
        label = label_map.get(detected, detected.upper())
        rows.append([
            _cell("Estado", cell_lbl),
            Paragraph(f"<font color='#{color_hex}'><b>{label}</b></font>", cell_style)
        ])
        if security_assessment.get("details"):
            rows.append([_cell("Detalle", cell_lbl), _cell(html.escape(str(security_assessment["details"])), cell_style)])

    # Integrar Análisis de Ataque en la misma tabla cuando hay ataque
    if attack_analysis and detected in ("yes", "suspicious"):
        attempt_count = str(attack_analysis.get("attempt_count", ""))
        time_window   = str(attack_analysis.get("time_window", ""))
        pattern       = str(attack_analysis.get("pattern", ""))
        if attempt_count:
            rows.append([_cell("Intentos", cell_lbl),       _cell(html.escape(attempt_count), cell_style)])
        if time_window:
            rows.append([_cell("Ventana de tiempo", cell_lbl), _cell(html.escape(time_window), cell_style)])
        if pattern:
            rows.append([_cell("Patrón", cell_lbl),         _cell(html.escape(pattern), cell_style)])

    if confidence_level:
        rows.append([_cell("Confianza", cell_lbl), _cell(html.escape(str(confidence_level)), cell_style)])

    if rows:
        # Fondo de la columna de etiquetas cambia según nivel de amenaza
        lbl_bg = {"yes": colors.HexColor("#FDECEA"), "suspicious": colors.HexColor("#FFF8E1")}.get(detected, CARD_BG)
        t = Table(rows, colWidths=[4.5 * cm, 12.5 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (0, -1), lbl_bg),
            ("BACKGROUND",   (1, 0), (1, -1), BG),
            ("GRID",         (0, 0), (-1, -1), 0.4, BORDER),
            ("FONTNAME",     (0, 0), (0, -1), "Helvetica-Bold"),
            ("VALIGN",       (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING",   (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))


def _add_technical_fix_section(story, technical_fix, body_style, heading_style):
    """Agrega la sección de Solución Técnica."""
    if not technical_fix:
        return
    immediate = technical_fix.get("immediate", "")
    definitive = technical_fix.get("definitive", "")
    if not immediate and not definitive:
        return
    story.append(Paragraph("Solución Técnica", heading_style))
    if immediate:
        story.append(Paragraph(f"<b>Quick Fix:</b> {html.escape(str(immediate))}", body_style))
    if definitive:
        story.append(Paragraph(f"<b>Solución Definitiva:</b> {html.escape(str(definitive))}", body_style))
    story.append(Spacer(1, 4))


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


def _add_design_issues_section(story, design_issues, body_style, heading_style):
    """Agrega problemas de diseño detectados con fondo de alerta naranja — [!] centrado verticalmente."""
    if not design_issues or len(design_issues) == 0:
        return
    story.append(Paragraph("Problemas de Diseño Detectados", heading_style))

    # Estilo para el ícono [!] — más grande y centrado
    icon_style = ParagraphStyle("alert_icon", parent=body_style,
                                fontName="Helvetica-Bold", fontSize=14,
                                textColor=colors.HexColor("#E17055"),
                                alignment=TA_CENTER)

    rows = []
    for issue in design_issues:
        if issue and issue.strip():
            rows.append([
                Paragraph("[!]", icon_style),
                Paragraph(html.escape(str(issue)), body_style),
            ])
    if rows:
        t = Table(rows, colWidths=[0.8 * cm, PAGE_WIDTH - 0.8 * cm])
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#FFF3E0")),
            ("BOX",           (0, 0), (-1, -1), 1.2, colors.HexColor("#E17055")),
            ("LINEBEFORE",    (0, 0), (0, -1),  3,   colors.HexColor("#E17055")),
            ("VALIGN",        (0, 0), (-1, -1), "CENTER"),  # CENTER en lugar de TOP
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS",(0, 0), (-1, -1), [colors.HexColor("#FFF3E0")]),
        ]))
        story.append(t)
    story.append(Spacer(1, 8))


def _add_sre_metrics_section(story, sre_metrics, body_style, heading_style, cell_style, cell_lbl):
    """Agrega métricas SRE específicas — tabla con cabecera violeta y labels en bold."""
    if not sre_metrics or not any(sre_metrics.values()):
        return
    story.append(Paragraph("Métricas SRE Recomendadas", heading_style))
    # Cabecera con color blanco sobre fondo ACCENT
    hdr_style = ParagraphStyle("sre_hdr", parent=cell_style,
                               fontName="Helvetica-Bold", textColor=colors.white)
    rows = [[_cell("Métrica", hdr_style), _cell("Objetivo", hdr_style)]]
    for key, label in [
        ("latency_percentiles", "Latency (p95, p99)"),
        ("error_rates",         "Error Rates"),
        ("external_dependencies","External APIs"),
        ("resource_utilization","Resources"),
    ]:
        val = sre_metrics.get(key, "")
        if isinstance(val, str):
            val = val.strip()
        if val and val != "No aplica":
            rows.append([_cell(label, cell_lbl), _cell(html.escape(str(val)), cell_style)])
    if len(rows) > 1:
        t = Table(rows, colWidths=[5 * cm, 12 * cm], repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0),  ACCENT),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [CARD_BG, BG]),
            ("GRID",          (0, 0), (-1, -1), 0.4, BORDER),
            ("FONTNAME",      (0, 1), (0, -1),  "Helvetica-Bold"),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))


def _format_created_at(created_at: str | None, timezone_name: str = "UTC") -> str:
    """
    Formatea el timestamp de BD a la hora local del usuario.
    created_at viene como ISO 8601 en UTC (ej: '2026-03-28T20:22:00+00:00').
    timezone_name es la zona horaria del browser (ej: 'America/Santiago').
    Devuelve: '2026-03-28 17:22 (UTC-03:00)' para un usuario en Chile.
    """
    # Parsear el created_at desde la BD
    dt_utc = None
    if created_at:
        try:
            dt_utc = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            if dt_utc.tzinfo is None:
                dt_utc = dt_utc.replace(tzinfo=timezone.utc)
            else:
                dt_utc = dt_utc.astimezone(timezone.utc)
        except (ValueError, AttributeError):
            pass

    # Usar hora actual si no hay created_at válido
    if dt_utc is None:
        dt_utc = datetime.now(timezone.utc)

    # Convertir a la zona horaria local del usuario
    try:
        user_tz = ZoneInfo(timezone_name)
        dt_local = dt_utc.astimezone(user_tz)
        # Formatear offset como UTC-03:00 o UTC+02:00
        offset_str = dt_local.strftime("%z")          # ej: "-0300"
        offset_fmt = f"UTC{offset_str[:3]}:{offset_str[3:]}"  # ej: "UTC-03:00"
        return dt_local.strftime("%Y-%m-%d %H:%M") + f" ({offset_fmt})"
    except (ZoneInfoNotFoundError, TypeError, ValueError):
        # Fallback a UTC si el timezone no es reconocido o es invÃ¡lido
        return dt_utc.strftime("%Y-%m-%d %H:%M") + " UTC"


def generate_pdf(postmortem: dict, created_at: str | None = None, timezone_name: str = "UTC") -> bytes:
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

    # Fecha de creación en la hora local del usuario
    story.append(Paragraph(
        f"Generado {_format_created_at(created_at, timezone_name)}",
        small_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=sev_color, spaceAfter=10))

    # ── Resumen Ejecutivo ────────────────────────────────────────────
    story.append(Paragraph("Resumen Ejecutivo", heading_style))
    story.append(Paragraph(html.escape(postmortem.get("summary", "")), body_style))

    # ── Clasificación del Error y Contexto ───────────────────────────
    _add_error_classification_section(
        story,
        postmortem.get("error_classification"),
        postmortem.get("context"),
        body_style, heading_style, cell_style, cell_lbl,
    )

    # ── Timeline ────────────────────────────────────────────────────
    timeline = postmortem.get("timeline", [])
    _add_timeline_section(story, timeline, cell_hdr, cell_style, heading_style)

    # ── Análisis de Causa Raíz ───────────────────────────────────────
    story.append(Paragraph("Análisis de Causa Raíz", heading_style))
    story.append(Paragraph(html.escape(postmortem.get("root_cause", "")), body_style))

    # ── Evidencia (líneas clave del log) ─────────────────────────────
    _add_evidence_section(
        story,
        postmortem.get("evidence_lines", []),
        body_style, heading_style,
    )

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

    # ── Evaluación de Seguridad y Confianza (incluye Análisis de Ataque) ─
    _add_security_and_confidence(
        story,
        postmortem.get("security_assessment"),
        postmortem.get("confidence_level"),
        postmortem.get("attack_analysis"),
        body_style, heading_style, cell_style, cell_lbl,
    )

    # ── Corrección Técnica ───────────────────────────────────────────
    _add_technical_fix_section(
        story,
        postmortem.get("technical_fix"),
        body_style, heading_style,
    )

    # ── Problemas de Diseño ──────────────────────────────────────────
    _add_design_issues_section(
        story,
        postmortem.get("design_issues", []),
        body_style, heading_style,
    )

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

    # ── Métricas SRE ─────────────────────────────────────────────────
    _add_sre_metrics_section(
        story,
        postmortem.get("sre_metrics", {}),
        body_style, heading_style, cell_style, cell_lbl,
    )

    # ── Footer ───────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=14))
    story.append(Paragraph(
        "Generado por <b>Postmortem.ai</b> — De logs caóticos a postmortems profesionales en segundos.",
        small_style))

    doc.build(story)
    return buffer.getvalue()
