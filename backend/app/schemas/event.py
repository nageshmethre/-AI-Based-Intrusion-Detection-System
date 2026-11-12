from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class EventBase(BaseModel):
    timestamp: datetime
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    username: Optional[str] = None
    event_type: str = "AUTH"
    action: Optional[str] = None
    status: Optional[str] = None
    protocol: Optional[str] = None
    resource: Optional[str] = None
    user_agent: Optional[str] = None
    bytes_sent: Optional[int] = 0
    bytes_received: Optional[int] = 0
    message: Optional[str] = None
    raw_log: str
    severity: str = "INFO"
    risk_score: float = 0.0
    anomaly_score: float = 0.0
    attack_type: str = "NORMAL"
    rule_triggers: Optional[str] = None

class EventCreate(EventBase):
    log_id: Optional[int] = None

class EventOut(EventBase):
    id: int
    log_id: Optional[int] = None

    class Config:
        from_attributes = True

class PaginatedEvents(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[EventOut]
