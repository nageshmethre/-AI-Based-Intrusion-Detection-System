import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.alert import Alert
from backend.app.models.incident import Incident
from backend.app.models.audit import AuditLog
from backend.app.api.websocket import ws_manager
from backend.app.services.incident_service import incident_service

class AlertService:
    """Handles alert creation, incident grouping, status progression, and WebSocket notifications."""

    def create_alert(
        self,
        db: Session,
        attack_type: str,
        severity: str,
        risk_score: float,
        confidence: float,
        description: str,
        source_ip: Optional[str] = None,
        username: Optional[str] = None,
        evidence: Optional[Dict[str, Any]] = None,
        recommended_action: Optional[str] = None
    ) -> Alert:
        now = datetime.now(timezone.utc)
        unique_alert_id = f"ALT-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

        alert = Alert(
            alert_id=unique_alert_id,
            timestamp=now,
            severity=severity,
            attack_type=attack_type,
            source_ip=source_ip,
            username=username,
            risk_score=risk_score,
            confidence=confidence,
            status="NEW",
            description=description,
            evidence=json.dumps(evidence or {}, default=str),
            recommended_action=recommended_action or "Review evidence in SOC investigation drawer and isolate offending source."
        )

        # Correlate into incident
        incident = incident_service.correlate_alert(db, alert)
        alert.incident_id = incident.id

        db.add(alert)
        db.commit()
        db.refresh(alert)

        # Broadcast via WebSocket to connected SOC dashboards
        self._broadcast_new_alert(alert)

        return alert

    def _broadcast_new_alert(self, alert: Alert):
        """Send asynchronous WebSocket notification safely."""
        payload = {
            "type": "NEW_ALERT",
            "alert": {
                "id": alert.id,
                "alert_id": alert.alert_id,
                "timestamp": alert.timestamp.isoformat(),
                "severity": alert.severity,
                "attack_type": alert.attack_type,
                "source_ip": alert.source_ip,
                "username": alert.username,
                "risk_score": alert.risk_score,
                "confidence": alert.confidence,
                "status": alert.status,
                "description": alert.description
            }
        }
        try:
            # Check if an event loop is running
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(ws_manager.broadcast(payload))
            else:
                loop.run_until_complete(ws_manager.broadcast(payload))
        except Exception:
            pass

    def update_alert_status(
        self,
        db: Session,
        alert_id: int,
        status: str,
        user_name: str,
        resolution_notes: Optional[str] = None
    ) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None

        old_status = alert.status
        alert.status = status
        alert.resolution_notes = resolution_notes
        alert.resolved_by = user_name
        alert.resolved_at = datetime.now(timezone.utc)

        # Audit log entry
        audit = AuditLog(
            username=user_name,
            action=f"UPDATE_ALERT_STATUS ({old_status} -> {status})",
            target_type="ALERT",
            target_id=alert.alert_id,
            timestamp=datetime.now(timezone.utc),
            details=f"Status changed to {status}. Notes: {resolution_notes or 'None'}"
        )
        db.add(audit)
        db.commit()
        db.refresh(alert)

        return alert

alert_service = AlertService()
