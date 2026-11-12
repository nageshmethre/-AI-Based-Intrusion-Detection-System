from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.rule import DetectionRule
from backend.app.models.audit import AuditLog
from backend.app.schemas.rule import RuleOut, RuleUpdate
from backend.app.api.deps import require_admin, require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/rules", tags=["Detection Rules Engine"])

@router.get("", response_model=List[RuleOut])
def list_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """List all configured detection rules and thresholds."""
    return db.query(DetectionRule).order_by(DetectionRule.id).all()

@router.patch("/{rule_id}", response_model=RuleOut)
def update_rule(
    rule_id: int,
    rule_update: RuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update detection rule parameters (thresholds, window, severity, toggle enabled). Admin only."""
    rule = db.query(DetectionRule).filter(DetectionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Detection rule not found")

    if rule_update.name is not None:
        rule.name = rule_update.name
    if rule_update.description is not None:
        rule.description = rule_update.description
    if rule_update.severity is not None:
        rule.severity = rule_update.severity.upper()
    if rule_update.threshold_value is not None:
        rule.threshold_value = rule_update.threshold_value
    if rule_update.time_window_minutes is not None:
        rule.time_window_minutes = rule_update.time_window_minutes
    if rule_update.is_enabled is not None:
        rule.is_enabled = rule_update.is_enabled
    if rule_update.config_json is not None:
        rule.config_json = rule_update.config_json

    rule.updated_at = datetime.now(timezone.utc)

    # Invalidate rules engine cache
    from backend.app.detection.rules_engine import rules_engine
    rules_engine._rules_cache = {}

    # Audit log
    audit = AuditLog(
        username=current_user.username,
        action="UPDATE_DETECTION_RULE",
        target_type="RULE",
        target_id=rule.rule_code,
        timestamp=datetime.now(timezone.utc),
        details=f"Updated rule {rule.rule_code}: threshold={rule.threshold_value}, window={rule.time_window_minutes}m, enabled={rule.is_enabled}"
    )
    db.add(audit)
    db.commit()
    db.refresh(rule)
    return rule
