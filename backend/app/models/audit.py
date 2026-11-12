from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database.session import Base

class AuditLog(Base):
    """Tracks analyst actions, rule modifications, and critical events for non-repudiation."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), nullable=False, index=True)
    action = Column(String(100), nullable=False) # e.g. RESOLVE_ALERT, UPDATE_RULE, RETRAIN_MODEL, EXPORT_REPORT
    target_type = Column(String(50), nullable=True) # ALERT, RULE, INCIDENT, LOG
    target_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    details = Column(Text, nullable=True)
