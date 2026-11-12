from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from backend.app.schemas.alert import AlertOut

class IncidentBase(BaseModel):
    title: str
    severity: str = "HIGH"
    status: str = "OPEN"
    attack_type: str
    primary_ip: Optional[str] = None
    primary_user: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    summary: str
    analyst_notes: Optional[str] = None
    remediation_steps: Optional[str] = None
    risk_score: float = 70.0
    alert_count: int = 1

class IncidentCreate(IncidentBase):
    incident_id: str

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    analyst_notes: Optional[str] = None
    remediation_steps: Optional[str] = None

class IncidentOut(IncidentBase):
    id: int
    incident_id: str
    created_at: datetime
    alerts: Optional[List[AlertOut]] = []

    class Config:
        from_attributes = True

class PaginatedIncidents(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[IncidentOut]
