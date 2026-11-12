from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.ioc import IOC
from backend.app.schemas.ioc import IOCOut, PaginatedIOCs
from backend.app.api.deps import require_analyst, require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/iocs", tags=["Indicators of Compromise (IOCs)"])

@router.get("", response_model=PaginatedIOCs)
def list_iocs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ioc_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Retrieve extracted IOCs (IPv4, domains, URLs, hashes) with filtering."""
    query = db.query(IOC)
    if ioc_type:
        query = query.filter(IOC.ioc_type == ioc_type.upper())
    if risk_level:
        query = query.filter(IOC.risk_level == risk_level.upper())
    if status:
        query = query.filter(IOC.status == status.upper())
    if search:
        query = query.filter(IOC.value.ilike(f"%{search}%"))

    total = query.count()
    items = query.order_by(desc(IOC.last_seen)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.patch("/{ioc_id}", response_model=IOCOut)
def update_ioc_status(
    ioc_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Update IOC status (ACTIVE, BLOCKED, WHITELISTED) and risk level."""
    ioc = db.query(IOC).filter(IOC.id == ioc_id).first()
    if not ioc:
        raise HTTPException(status_code=404, detail="IOC not found")

    new_status = status_update.get("status")
    new_risk = status_update.get("risk_level")
    notes = status_update.get("notes")

    if new_status:
        ioc.status = new_status.upper()
    if new_risk:
        ioc.risk_level = new_risk.upper()
    if notes is not None:
        ioc.notes = notes

    db.commit()
    db.refresh(ioc)
    return ioc
