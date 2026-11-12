from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.incident import Incident
from backend.app.models.alert import Alert
from backend.app.schemas.incident import IncidentOut, IncidentUpdate, PaginatedIncidents
from backend.app.api.deps import require_analyst, require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/incidents", tags=["Incidents & Campaigns"])

@router.get("", response_model=PaginatedIncidents)
def list_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    """List correlated security incidents."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status.upper())
    if severity:
        query = query.filter(Incident.severity == severity.upper())

    total = query.count()
    items = query.order_by(desc(Incident.id)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Retrieve detailed incident with all associated alerts and evidence timeline."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    update_data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Update incident status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) or analyst notes."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if update_data.status:
        incident.status = update_data.status.upper()
    if update_data.severity:
        incident.severity = update_data.severity.upper()
    if update_data.title:
        incident.title = update_data.title
    if update_data.analyst_notes is not None:
        incident.analyst_notes = update_data.analyst_notes
    if update_data.remediation_steps is not None:
        incident.remediation_steps = update_data.remediation_steps

    db.commit()
    db.refresh(incident)
    return incident
