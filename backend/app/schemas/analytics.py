from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from backend.app.schemas.alert import AlertOut
from backend.app.schemas.event import EventOut

class KPICards(BaseModel):
    total_events: int
    suspicious_events: int
    critical_alerts: int
    high_alerts: int
    active_incidents: int
    unique_source_ips: int

class TimeSeriesPoint(BaseModel):
    timestamp: str
    count: int

class DistributionItem(BaseModel):
    name: str
    value: int
    color: Optional[str] = None

class DashboardSummary(BaseModel):
    kpis: KPICards
    events_over_time: List[TimeSeriesPoint]
    alerts_over_time: List[TimeSeriesPoint]
    attack_type_distribution: List[DistributionItem]
    severity_distribution: List[DistributionItem]
    top_suspicious_ips: List[DistributionItem]
    top_targeted_users: List[DistributionItem]
    anomaly_score_distribution: List[DistributionItem]
    recent_alerts: List[AlertOut]

class IPInvestigationOut(BaseModel):
    ip: str
    total_events: int
    failed_logins: int
    successful_logins: int
    targeted_users: List[str]
    targeted_ports: List[int]
    total_requests: int
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    risk_score: float
    threat_level: str
    related_alerts: List[AlertOut]
    timeline_events: List[EventOut]

class UserInvestigationOut(BaseModel):
    username: str
    login_count: int
    failed_login_count: int
    successful_login_count: int
    source_ips: List[str]
    login_hours: Dict[int, int]
    off_hours_logins: int
    risk_score: float
    threat_level: str
    related_alerts: List[AlertOut]
    timeline_events: List[EventOut]

class AIExplanationOut(BaseModel):
    alert_id: str
    what_happened: str
    why_suspicious: str
    supporting_evidence: List[str]
    rules_triggered: List[str]
    ml_detection_summary: str
    recommended_investigation_steps: List[str]
