from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Index
from backend.app.database.session import Base

class IOC(Base):
    """Stores extracted Indicators of Compromise from parsed logs."""
    __tablename__ = "iocs"

    id = Column(Integer, primary_key=True, index=True)
    value = Column(String(255), unique=True, index=True, nullable=False)
    ioc_type = Column(String(50), nullable=False, index=True)  # IPV4, DOMAIN, URL, EMAIL, MD5, SHA256
    first_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    event_count = Column(Integer, default=1, nullable=False)
    risk_level = Column(String(20), default="SUSPICIOUS", nullable=False)  # SAFE, SUSPICIOUS, MALICIOUS
    status = Column(String(30), default="ACTIVE", nullable=False)          # ACTIVE, BLOCKED, WHITELISTED
    notes = Column(String(500), nullable=True)

    __table_args__ = (
        Index("idx_iocs_type_risk", "ioc_type", "risk_level"),
    )
