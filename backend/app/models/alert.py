from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Alert(Base):
    """Represents a high-risk security alert triggered by rules or ML models."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    
    severity = Column(String(20), default="MEDIUM", nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    attack_type = Column(String(50), nullable=False, index=True)                 # BRUTE_FORCE, PORT_SCAN, DOS, etc.
    source_ip = Column(String(50), nullable=True, index=True)
    username = Column(String(100), nullable=True, index=True)
    
    risk_score = Column(Float, default=0.0, nullable=False, index=True)          # 0 - 100
    confidence = Column(Float, default=0.85, nullable=False)                     # 0.0 - 1.0 (ML / Rule certainty)
    status = Column(String(30), default="NEW", nullable=False, index=True)       # NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)             # JSON formatted evidence list and key metrics
    recommended_action = Column(Text, nullable=True)   # Guided SOC response recommendations
    
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    incident = relationship("Incident", back_populates="alerts")

    __table_args__ = (
        Index("idx_alerts_status_severity", "status", "severity"),
    )
