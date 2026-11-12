from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.app.database.session import get_db
from backend.app.models.event import NormalizedEvent
from backend.app.models.alert import Alert
from backend.app.models.incident import Incident
from backend.app.schemas.analytics import DashboardSummary, KPICards, TimeSeriesPoint, DistributionItem, IPInvestigationOut, UserInvestigationOut
from backend.app.schemas.alert import AlertOut
from backend.app.schemas.event import EventOut
from backend.app.api.deps import require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/analytics", tags=["SOC Analytics & Dashboards"])

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Aggregates all real-time security telemetry for the SOC overview dashboard."""
    # 1. KPI Cards
    total_events = db.query(NormalizedEvent).count()
    suspicious_events = db.query(NormalizedEvent).filter(
        (NormalizedEvent.risk_score >= 50.0) | (NormalizedEvent.severity.in_(["HIGH", "CRITICAL"]))
    ).count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL").count()
    high_alerts = db.query(Alert).filter(Alert.severity == "HIGH").count()
    active_incidents = db.query(Incident).filter(Incident.status.in_(["OPEN", "IN_PROGRESS"])).count()
    unique_source_ips = db.query(func.count(func.distinct(NormalizedEvent.source_ip))).scalar() or 0

    kpis = KPICards(
        total_events=total_events,
        suspicious_events=suspicious_events,
        critical_alerts=critical_alerts,
        high_alerts=high_alerts,
        active_incidents=active_incidents,
        unique_source_ips=unique_source_ips
    )

    # 2. Events over time (Grouped by hour/day or recent events)
    events_raw = db.query(
        func.strftime('%Y-%m-%d %H:00', NormalizedEvent.timestamp).label("hour_bin"),
        func.count(NormalizedEvent.id)
    ).group_by("hour_bin").order_by(desc("hour_bin")).limit(24).all()
    events_over_time = [TimeSeriesPoint(timestamp=str(r[0]), count=int(r[1])) for r in reversed(events_raw)]

    # 3. Alerts over time
    alerts_raw = db.query(
        func.strftime('%Y-%m-%d %H:00', Alert.timestamp).label("hour_bin"),
        func.count(Alert.id)
    ).group_by("hour_bin").order_by(desc("hour_bin")).limit(24).all()
    alerts_over_time = [TimeSeriesPoint(timestamp=str(r[0]), count=int(r[1])) for r in reversed(alerts_raw)]

    # 4. Attack type distribution
    attack_raw = db.query(
        Alert.attack_type, func.count(Alert.id)
    ).group_by(Alert.attack_type).order_by(desc(func.count(Alert.id))).all()
    
    # Define aesthetic cyber palette
    palette = ["#F43F5E", "#FB923C", "#FBBF24", "#38BDF8", "#A855F7", "#34D399", "#818CF8"]
    attack_type_dist = [
        DistributionItem(name=r[0], value=r[1], color=palette[i % len(palette)])
        for i, r in enumerate(attack_raw)
    ]

    # 5. Severity distribution
    sev_order = {"CRITICAL": "#E11D48", "HIGH": "#F97316", "MEDIUM": "#EAB308", "LOW": "#06B6D4"}
    sev_raw = db.query(
        Alert.severity, func.count(Alert.id)
    ).group_by(Alert.severity).all()
    sev_dict = {r[0]: r[1] for r in sev_raw}
    severity_dist = [
        DistributionItem(name=s, value=sev_dict.get(s, 0), color=c)
        for s, c in sev_order.items()
    ]

    # 6. Top suspicious IPs
    top_ips_raw = db.query(
        Alert.source_ip, func.count(Alert.id)
    ).filter(Alert.source_ip != None).group_by(Alert.source_ip).order_by(desc(func.count(Alert.id))).limit(6).all()
    top_ips = [DistributionItem(name=r[0], value=r[1], color="#F43F5E") for r in top_ips_raw]

    # 7. Top targeted usernames
    top_users_raw = db.query(
        Alert.username, func.count(Alert.id)
    ).filter(Alert.username != None).group_by(Alert.username).order_by(desc(func.count(Alert.id))).limit(6).all()
    top_users = [DistributionItem(name=r[0], value=r[1], color="#38BDF8") for r in top_users_raw]

    # 8. Anomaly score distribution
    # Bin events into brackets: 0-20, 21-40, 41-60, 61-80, 81-100
    anomaly_brackets = [
        ("0-20 (Normal)", 0, 20, "#10B981"),
        ("21-40 (Low)", 21, 40, "#06B6D4"),
        ("41-60 (Moderate)", 41, 60, "#F59E0B"),
        ("61-80 (High)", 61, 80, "#F97316"),
        ("81-100 (Critical)", 81, 100, "#EF4444"),
    ]
    anomaly_dist = []
    for label, low, high, color in anomaly_brackets:
        cnt = db.query(NormalizedEvent).filter(
            NormalizedEvent.anomaly_score >= low,
            NormalizedEvent.anomaly_score <= high
        ).count()
        anomaly_dist.append(DistributionItem(name=label, value=cnt, color=color))

    # 9. Recent alerts for live feed
    recent_alerts = db.query(Alert).order_by(desc(Alert.timestamp)).limit(10).all()

    return {
        "kpis": kpis,
        "events_over_time": events_over_time,
        "alerts_over_time": alerts_over_time,
        "attack_type_distribution": attack_type_dist,
        "severity_distribution": severity_dist,
        "top_suspicious_ips": top_ips,
        "top_targeted_users": top_users,
        "anomaly_score_distribution": anomaly_dist,
        "recent_alerts": recent_alerts
    }

@router.get("/ip/{ip}", response_model=IPInvestigationOut)
def investigate_ip(
    ip: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Comprehensive forensic telemetry for a specific IP address."""
    events = db.query(NormalizedEvent).filter(NormalizedEvent.source_ip == ip).order_by(desc(NormalizedEvent.timestamp)).all()
    if not events:
        # Return empty investigation template
        return {
            "ip": ip,
            "total_events": 0,
            "failed_logins": 0,
            "successful_logins": 0,
            "targeted_users": [],
            "targeted_ports": [],
            "total_requests": 0,
            "first_seen": None,
            "last_seen": None,
            "risk_score": 0.0,
            "threat_level": "UNKNOWN",
            "related_alerts": [],
            "timeline_events": []
        }

    total_events = len(events)
    failed_logins = sum(1 for e in events if e.action == "LOGIN" and e.status == "FAILURE")
    successful_logins = sum(1 for e in events if e.action == "LOGIN" and e.status == "SUCCESS")
    targeted_users = list({e.username for e in events if e.username})
    targeted_ports = list({e.destination_port for e in events if e.destination_port})
    total_requests = sum(1 for e in events if e.event_type == "WEB")
    
    first_seen = min(e.timestamp for e in events)
    last_seen = max(e.timestamp for e in events)
    max_risk = max(e.risk_score for e in events)

    related_alerts = db.query(Alert).filter(Alert.source_ip == ip).order_by(desc(Alert.timestamp)).limit(20).all()

    threat_level = "LOW"
    if max_risk >= 80:
        threat_level = "CRITICAL"
    elif max_risk >= 60:
        threat_level = "HIGH"
    elif max_risk >= 30:
        threat_level = "MEDIUM"

    return {
        "ip": ip,
        "total_events": total_events,
        "failed_logins": failed_logins,
        "successful_logins": successful_logins,
        "targeted_users": targeted_users[:15],
        "targeted_ports": targeted_ports[:20],
        "total_requests": total_requests,
        "first_seen": first_seen,
        "last_seen": last_seen,
        "risk_score": max_risk,
        "threat_level": threat_level,
        "related_alerts": related_alerts,
        "timeline_events": events[:50]
    }

@router.get("/user/{username}", response_model=UserInvestigationOut)
def investigate_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Comprehensive behavioral analytics for a targeted or investigated username."""
    events = db.query(NormalizedEvent).filter(NormalizedEvent.username == username).order_by(desc(NormalizedEvent.timestamp)).all()
    if not events:
        return {
            "username": username,
            "login_count": 0,
            "failed_login_count": 0,
            "successful_login_count": 0,
            "source_ips": [],
            "login_hours": {},
            "off_hours_logins": 0,
            "risk_score": 0.0,
            "threat_level": "CLEAN",
            "related_alerts": [],
            "timeline_events": []
        }

    failed_logins = sum(1 for e in events if e.action == "LOGIN" and e.status == "FAILURE")
    successful_logins = sum(1 for e in events if e.action == "LOGIN" and e.status == "SUCCESS")
    source_ips = list({e.source_ip for e in events if e.source_ip})

    hours_breakdown: Dict[int, int] = {h: 0 for h in range(24)}
    off_hours = 0
    for e in events:
        h = e.timestamp.hour
        hours_breakdown[h] += 1
        if h >= 23 or h < 5:
            off_hours += 1

    max_risk = max((e.risk_score for e in events), default=0.0)
    related_alerts = db.query(Alert).filter(Alert.username == username).order_by(desc(Alert.timestamp)).limit(20).all()

    threat_level = "NORMAL"
    if max_risk >= 80 or len(related_alerts) > 2:
        threat_level = "COMPROMISED_RISK"
    elif max_risk >= 50 or failed_logins >= 5:
        threat_level = "SUSPICIOUS"

    return {
        "username": username,
        "login_count": failed_logins + successful_logins,
        "failed_login_count": failed_logins,
        "successful_login_count": successful_logins,
        "source_ips": source_ips,
        "login_hours": hours_breakdown,
        "off_hours_logins": off_hours,
        "risk_score": max_risk,
        "threat_level": threat_level,
        "related_alerts": related_alerts,
        "timeline_events": events[:50]
    }
