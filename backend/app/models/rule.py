from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime
from backend.app.database.session import Base

class DetectionRule(Base):
    """Configurable rule definitions for the rule-based detection engine."""
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. BRUTE_FORCE, PORT_SCAN
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    attack_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="HIGH", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    
    threshold_value = Column(Float, default=5.0, nullable=False) # e.g., 5 attempts, 60 requests
    time_window_minutes = Column(Integer, default=5, nullable=False) # in minutes
    is_enabled = Column(Boolean, default=True, nullable=False)
    config_json = Column(Text, nullable=True) # JSON with secondary params
    
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
