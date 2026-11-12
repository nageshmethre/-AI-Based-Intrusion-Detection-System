import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.alert import Alert
from backend.app.models.event import NormalizedEvent
from backend.app.schemas.alert import AlertOut, AlertUpdate, PaginatedAlerts
from backend.app.schemas.analytics import AIExplanationOut
from backend.app.services.alert_service import alert_service
from backend.app.api.deps import require_analyst, require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/alerts", tags=["Alerts & Investigations"])

@router.get("", response_model=PaginatedAlerts)
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    attack_type: Optional[str] = Query(None),
    source_ip: Optional[str] = Query(None)
):
    """Retrieve filtered, paginated security alerts."""
    query = db.query(Alert)

    if status:
        query = query.filter(Alert.status == status.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if attack_type:
        query = query.filter(Alert.attack_type == attack_type.upper())
    if source_ip:
        query = query.filter(Alert.source_ip.ilike(f"%{source_ip}%"))

    total = query.count()
    items = query.order_by(desc(Alert.timestamp)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/{alert_id}", response_model=AlertOut)
def get_alert_detail(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Retrieve comprehensive details of a single security alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert(
    alert_id: int,
    update_data: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Update alert lifecycle status (INVESTIGATING, RESOLVED, FALSE_POSITIVE)."""
    valid_statuses = ["NEW", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"]
    if update_data.status and update_data.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    alert = alert_service.update_alert_status(
        db=db,
        alert_id=alert_id,
        status=update_data.status.upper() if update_data.status else "INVESTIGATING",
        user_name=current_user.username,
        resolution_notes=update_data.resolution_notes
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.get("/{alert_id}/explanation", response_model=AIExplanationOut)
def get_alert_ai_explanation(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """
    Structured AI Explanation Layer (Section 32):
    Provides analysts with grounded, deterministic evidence explanations 
    ('What happened?', 'Why suspicious?', 'Evidence', 'Rules', 'ML findings', 'Next steps').
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    evidence = {}
    if alert.evidence:
        try:
            evidence = json.loads(alert.evidence)
        except Exception:
            evidence = {}

    reasons = evidence.get("reasons", [alert.description])
    rule_triggers = evidence.get("rule_triggers", [])
    ml_anomaly = evidence.get("ml_anomaly_score", alert.risk_score)
    ml_attack = evidence.get("ml_predicted_attack", alert.attack_type)
    ml_conf = evidence.get("ml_confidence", alert.confidence)

    # Construct expert structured explanation
    what_happened = (
        f"At {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}, security monitoring detected an elevated risk "
        f"event classified as '{alert.attack_type}' originating from source IP '{alert.source_ip or 'Internal Host'}' "
        f"targeting entity '{alert.username or 'Network Service'}'. Risk score computed: {alert.risk_score:.1f}/100."
    )

    why_suspicious = (
        f"The pattern departed from established baseline behavioral distributions. "
        f"Multiple indicators converged: severity is rated {alert.severity}, "
        f"Isolation Forest calculated an anomaly score of {ml_anomaly:.1f}/100, "
        f"and supervised classifier registered a {ml_conf*100:.1f}% confidence for {ml_attack}."
    )

    supporting_evidence = reasons

    ml_summary = (
        f"Unsupervised Isolation Forest flagged this sequence with an anomaly score of {ml_anomaly:.1f}/100. "
        f"The supervised Random Forest model categorized the feature vector as '{ml_attack}' with {ml_conf*100:.1f}% confidence."
    )

    recommended_steps = [
        f"1. Query firewall logs to check recent inbound packet frequency from {alert.source_ip or 'the source IP'}.",
        f"2. Inspect authentication history for account '{alert.username or 'the targeted user'}' to verify if subsequent legitimate logins occurred.",
        "3. Review endpoint execution trees (Event ID 4688 / auditd) for secondary post-exploitation attempts.",
        f"4. If malicious intent is validated, assign status to RESOLVED and apply firewall block on {alert.source_ip or 'source'}."
    ]

    return {
        "alert_id": alert.alert_id,
        "what_happened": what_happened,
        "why_suspicious": why_suspicious,
        "supporting_evidence": supporting_evidence,
        "rules_triggered": rule_triggers if rule_triggers else ["HEURISTIC_RISK_THRESHOLD"],
        "ml_detection_summary": ml_summary,
        "recommended_investigation_steps": recommended_steps
    }
