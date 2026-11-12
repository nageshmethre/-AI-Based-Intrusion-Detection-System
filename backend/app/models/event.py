from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class NormalizedEvent(Base):
    """Normalized security log event schema across all source log types."""
    __tablename__ = "normalized_events"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("logs.id", ondelete="CASCADE"), nullable=True, index=True)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    source_ip = Column(String(50), nullable=True, index=True)
    destination_ip = Column(String(50), nullable=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True, index=True)
    username = Column(String(100), nullable=True, index=True)
    
    event_type = Column(String(50), nullable=False, default="AUTH", index=True)  # AUTH, WEB, NETWORK, SYSTEM, UNKNOWN_EVENT
    action = Column(String(50), nullable=True)        # LOGIN, LOGOUT, HTTP_GET, HTTP_POST, PORT_CONNECT, SUDO, CMD
    status = Column(String(50), nullable=True)        # SUCCESS, FAILURE, ERROR, BLOCKED
    protocol = Column(String(20), nullable=True)      # TCP, UDP, HTTP, HTTPS, SSH
    resource = Column(String(500), nullable=True)     # URI, file path, command executed
    user_agent = Column(String(500), nullable=True)
    
    bytes_sent = Column(BigInteger, default=0)
    bytes_received = Column(BigInteger, default=0)
    message = Column(Text, nullable=True)
    raw_log = Column(Text, nullable=False)
    
    severity = Column(String(20), default="INFO", index=True)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Float, default=0.0, index=True)        # Calculated composite score (0-100)
    
    # ML and Rule detection tags
    anomaly_score = Column(Float, default=0.0)                 # ML Isolation Forest score (0-100)
    attack_type = Column(String(50), default="NORMAL", index=True) # Classification: NORMAL, BRUTE_FORCE, PORT_SCAN, etc.
    rule_triggers = Column(Text, nullable=True)                # JSON list of triggered rule codes

    # Relationships
    raw_log_record = relationship("Log", back_populates="events")

    __table_args__ = (
        Index("idx_events_ip_timestamp", "source_ip", "timestamp"),
        Index("idx_events_user_timestamp", "username", "timestamp"),
    )
