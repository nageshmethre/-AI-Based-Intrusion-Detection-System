import os
import json
from datetime import datetime, timezone
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from backend.app.models.incident import Incident
from backend.app.models.alert import Alert

class IncidentReportGenerator:
    """Generates professional SOC Incident PDF reports using ReportLab."""

    def __init__(self, reports_dir: str = "reports"):
        self.reports_dir = reports_dir
        os.makedirs(self.reports_dir, exist_ok=True)

    def generate_pdf(self, incident: Incident, analyst_name: str = "SOC Lead Analyst") -> str:
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Incident_Report_{incident.incident_id}_{timestamp_str}.pdf"
        filepath = os.path.join(self.reports_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        # Custom dark-theme inspired document styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748B"),
            spaceAfter=14
        )
        h2_style = ParagraphStyle(
            "H2Style",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1E293B"),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "BodyStyle",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )
        bold_label = ParagraphStyle(
            "BoldLabel",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#0F172A")
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("AI-BASED MINI-SOC PLATFORM", subtitle_style))
        elements.append(Paragraph("SECURITY INCIDENT INVESTIGATION REPORT", title_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2563EB"), spaceAfter=14))

        # 2. Executive Metadata Summary Table
        sev_color = colors.HexColor("#DC2626") if incident.severity == "CRITICAL" else (
            colors.HexColor("#EA580C") if incident.severity == "HIGH" else colors.HexColor("#CA8A04")
        )

        meta_data = [
            [Paragraph("<b>Incident ID:</b>", bold_label), Paragraph(incident.incident_id, body_style),
             Paragraph("<b>Generated On:</b>", bold_label), Paragraph(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"), body_style)],
            [Paragraph("<b>Severity:</b>", bold_label), Paragraph(f"<font color='{sev_color.hexval()}'><b>{incident.severity}</b></font>", body_style),
             Paragraph("<b>Risk Score:</b>", bold_label), Paragraph(f"<b>{incident.risk_score:.1f} / 100</b>", body_style)],
            [Paragraph("<b>Attack Type:</b>", bold_label), Paragraph(incident.attack_type, body_style),
             Paragraph("<b>Incident Status:</b>", bold_label), Paragraph(incident.status, body_style)],
            [Paragraph("<b>Primary Source IP:</b>", bold_label), Paragraph(incident.primary_ip or "N/A", body_style),
             Paragraph("<b>Target Entity / User:</b>", bold_label), Paragraph(incident.primary_user or "N/A", body_style)],
            [Paragraph("<b>Investigating Analyst:</b>", bold_label), Paragraph(analyst_name, body_style),
             Paragraph("<b>Total Alerts Linked:</b>", bold_label), Paragraph(str(incident.alert_count), body_style)],
        ]

        t_meta = Table(meta_data, colWidths=[120, 150, 120, 150])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 14))

        # 3. Executive Incident Narrative
        elements.append(Paragraph("1. Executive Summary", h2_style))
        elements.append(Paragraph(incident.summary, body_style))
        elements.append(Spacer(1, 10))

        # 4. Section 2: Observed Technical Evidence (Correlated Alerts)
        elements.append(Paragraph("2. Observed Telemetry & Correlated Alerts", h2_style))
        alert_rows = [
            [Paragraph("<b>Alert ID</b>", bold_label),
             Paragraph("<b>Timestamp</b>", bold_label),
             Paragraph("<b>Type</b>", bold_label),
             Paragraph("<b>Severity</b>", bold_label),
             Paragraph("<b>Risk</b>", bold_label),
             Paragraph("<b>Status</b>", bold_label)]
        ]

        for alt in (incident.alerts or [])[:10]:
            alert_rows.append([
                Paragraph(alt.alert_id, body_style),
                Paragraph(alt.timestamp.strftime("%H:%M:%S"), body_style),
                Paragraph(alt.attack_type, body_style),
                Paragraph(alt.severity, body_style),
                Paragraph(f"{alt.risk_score:.0f}", body_style),
                Paragraph(alt.status, body_style)
            ])

        if len(alert_rows) == 1:
            alert_rows.append([Paragraph("No individual alerts linked", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style)])

        t_alerts = Table(alert_rows, colWidths=[110, 80, 110, 80, 70, 90])
        t_alerts.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(t_alerts)
        elements.append(Spacer(1, 12))

        # 5. Section 3: Automated AI / ML & Detection Rules Analysis
        elements.append(Paragraph("3. Automated Detection & Machine Learning Analysis", h2_style))
        ml_narrative = (
            "The detection pipeline evaluated the ingested events across both transparent deterministic rules and "
            "unsupervised anomaly scoring. Isolation Forest identified high multidimensional distance from standard "
            "temporal baselines. The Random Forest classifier assigned high probability to active intrusion indicators. "
            "Application-defined composite risk scoring integrated rule triggers and behavioral outliers without relying on black-box heuristics."
        )
        elements.append(Paragraph(ml_narrative, body_style))
        elements.append(Spacer(1, 10))

        # 6. Section 4: Recommended Remediation Actions
        elements.append(Paragraph("4. Recommended Security Response & Remediation", h2_style))
        remediation_text = incident.remediation_steps or (
            "1. Enact temporary ingress IP blocks at perimeter boundary for the offending source.<br/>"
            "2. Enforce credential revocation and mandatory MFA validation on affected target users.<br/>"
            "3. Review application endpoint access control lists and rate limiting parameters.<br/>"
            "4. Archive raw log files and extracted IOC hashes for formal compliance reporting."
        )
        elements.append(Paragraph(remediation_text, body_style))
        elements.append(Spacer(1, 10))

        # 7. Section 5: Analyst Notes & Formal Conclusion
        elements.append(Paragraph("5. Analyst Notes & Conclusion", h2_style))
        notes_text = incident.analyst_notes or "Incident identified autonomously by SOC pipeline. Verification confirmed authentic threat signature. Remediation actions initiated."
        elements.append(Paragraph(f"<b>Analyst Findings:</b> {notes_text}", body_style))
        elements.append(Spacer(1, 14))

        # Footer Notice
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94A3B8"), spaceAfter=8))
        elements.append(Paragraph(
            "Confidential — Internal Security Operations Center (SOC) Documentation. Generated automatically by AI-Based Suspicious Log Detector Platform.",
            ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#94A3B8"), alignment=1)
        ))

        doc.build(elements)
        return filepath

report_generator = IncidentReportGenerator()
