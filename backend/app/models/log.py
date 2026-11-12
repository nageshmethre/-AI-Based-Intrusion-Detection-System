from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Log(Base):
    """Stores the original, immutable raw log entry."""
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(Text, nullable=False)
    source_format = Column(String(50), default="unknown", nullable=False)  # linux_auth, web_access, windows_event, csv, json, unknown
    file_name = Column(String(255), nullable=True)
    line_number = Column(Integer, nullable=True)
    ingested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship to normalized events
    events = relationship("NormalizedEvent", back_populates="raw_log_record", cascade="all, delete-orphan")
