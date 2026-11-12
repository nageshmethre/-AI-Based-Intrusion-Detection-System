from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Incident(Base):
    """Represents a grouped security incident consisting of multiple correlated alerts and events."""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    severity = Column(String(20), default="HIGH", nullable=False, index=True)
    status = Column(String(30), default="OPEN", nullable=False, index=True) # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    attack_type = Column(String(50), nullable=False, index=True)
    
    primary_ip = Column(String(50), nullable=True, index=True)
    primary_user = Column(String(100), nullable=True, index=True)
    
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime, nullable=True)
    
    summary = Column(Text, nullable=False)
    analyst_notes = Column(Text, nullable=True)
    remediation_steps = Column(Text, nullable=True)
    
    risk_score = Column(Float, default=70.0, nullable=False)
    alert_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    alerts = relationship("Alert", back_populates="incident")
