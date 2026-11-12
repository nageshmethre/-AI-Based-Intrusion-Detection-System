import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.incident import Incident
from backend.app.models.alert import Alert

class IncidentService:
    """Manages automatic correlation and grouping of alerts into incident campaigns."""

    def correlate_alert(self, db: Session, alert: Alert) -> Incident:
        """Find an active open incident matching this IP/User within the last 60 minutes, or create a new one."""
        now = datetime.now(timezone.utc)
        one_hour_ago = now - timedelta(minutes=60)

        # Look for open incident with same IP or user
        incident = None
        if alert.source_ip:
            incident = db.query(Incident).filter(
                Incident.primary_ip == alert.source_ip,
                Incident.status.in_(["OPEN", "IN_PROGRESS"]),
                Incident.start_time >= one_hour_ago
            ).order_by(desc(Incident.id)).first()

        if not incident and alert.username:
            incident = db.query(Incident).filter(
                Incident.primary_user == alert.username,
                Incident.status.in_(["OPEN", "IN_PROGRESS"]),
                Incident.start_time >= one_hour_ago
            ).order_by(desc(Incident.id)).first()

        if incident:
            # Update existing incident
            incident.alert_count += 1
            incident.end_time = alert.timestamp
            incident.risk_score = max(incident.risk_score, alert.risk_score)
            if alert.severity == "CRITICAL":
                incident.severity = "CRITICAL"
            elif alert.severity == "HIGH" and incident.severity != "CRITICAL":
                incident.severity = "HIGH"
            db.commit()
            db.refresh(incident)
            return incident

        # Create new incident
        inc_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        title = f"{alert.attack_type.replace('_', ' ').title()} Campaign from {alert.source_ip or 'Internal'}"
        summary = f"Automated correlation identified suspicious {alert.attack_type} activity originating from {alert.source_ip or 'unknown IP'} targeting {alert.username or 'system resources'}."
        
        remediation = alert.recommended_action or "Review host logs, verify firewall rules, and validate credential integrity."

        incident = Incident(
            incident_id=inc_id,
            title=title,
            severity=alert.severity,
            status="OPEN",
            attack_type=alert.attack_type,
            primary_ip=alert.source_ip,
            primary_user=alert.username,
            start_time=alert.timestamp,
            end_time=alert.timestamp,
            summary=summary,
            remediation_steps=remediation,
            risk_score=alert.risk_score,
            alert_count=1,
            created_at=now
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident

incident_service = IncidentService()
