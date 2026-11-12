from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

class AlertBase(BaseModel):
    timestamp: datetime
    severity: str
    attack_type: str
    source_ip: Optional[str] = None
    username: Optional[str] = None
    risk_score: float
    confidence: float = 0.85
    status: str = "NEW"
    description: str
    evidence: Optional[str] = None
    recommended_action: Optional[str] = None
    incident_id: Optional[int] = None

class AlertCreate(AlertBase):
    alert_id: str

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None

class AlertOut(AlertBase):
    id: int
    alert_id: str
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedAlerts(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[AlertOut]
