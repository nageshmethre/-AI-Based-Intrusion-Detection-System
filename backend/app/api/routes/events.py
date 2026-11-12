from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.event import NormalizedEvent
from backend.app.models.log import Log
from backend.app.schemas.event import EventOut, PaginatedEvents
from backend.app.schemas.log import LogUploadResponse
from backend.app.services.ingestion_service import ingestion_service
from backend.app.api.deps import get_current_user, require_analyst, require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/events", tags=["Events & Log Ingestion"])

@router.post("/upload", response_model=LogUploadResponse)
async def upload_log_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Upload and ingest a security log file (.log, .txt, .csv, .json)."""
    # Validate extension
    file_name = file.filename or "uploaded.log"
    lower_name = file_name.lower()
    if not any(lower_name.endswith(ext) for ext in [".log", ".txt", ".csv", ".json"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload .log, .txt, .csv, or .json files."
        )

    content_bytes = await file.read()
    # Check max file size (25MB)
    if len(content_bytes) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum permitted upload limit (25 MB)."
        )

    try:
        content_text = content_bytes.decode("utf-8", errors="replace")
    except Exception:
        content_text = content_bytes.decode("latin-1", errors="replace")

    lines = content_text.splitlines()
    result = ingestion_service.ingest_lines(db, lines, file_name=file_name)

    # Trigger detection pipeline on the ingested events (imported dynamically once built)
    from backend.app.detection.pipeline import detection_pipeline
    alerts_created = detection_pipeline.process_events(db, result.get("events", []))

    return {
        "file_name": file_name,
        "total_lines": result["total_lines"],
        "parsed_events": result["parsed_events"],
        "alerts_generated": len(alerts_created),
        "format_detected": result["format_detected"],
        "message": f"Successfully ingested {result['parsed_events']} events from {file_name}."
    }

@router.post("/raw", response_model=LogUploadResponse)
def ingest_raw_stream(
    raw_payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Ingest raw log text directly from stream or text paste."""
    raw_text = raw_payload.get("raw_logs", "")
    lines = raw_text.splitlines()
    result = ingestion_service.ingest_lines(db, lines, file_name="stream_input")

    from backend.app.detection.pipeline import detection_pipeline
    alerts_created = detection_pipeline.process_events(db, result.get("events", []))

    return {
        "file_name": "stream_input",
        "total_lines": result["total_lines"],
        "parsed_events": result["parsed_events"],
        "alerts_generated": len(alerts_created),
        "format_detected": result["format_detected"],
        "message": f"Successfully processed {result['parsed_events']} stream events."
    }

@router.get("", response_model=PaginatedEvents)
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    source_ip: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    attack_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Search, filter, and paginate normalized security events."""
    query = db.query(NormalizedEvent)

    if source_ip:
        query = query.filter(NormalizedEvent.source_ip.ilike(f"%{source_ip}%"))
    if username:
        query = query.filter(NormalizedEvent.username.ilike(f"%{username}%"))
    if event_type:
        query = query.filter(NormalizedEvent.event_type == event_type.upper())
    if severity:
        query = query.filter(NormalizedEvent.severity == severity.upper())
    if attack_type:
        query = query.filter(NormalizedEvent.attack_type == attack_type.upper())
    if search:
        query = query.filter(
            NormalizedEvent.message.ilike(f"%{search}%") |
            NormalizedEvent.raw_log.ilike(f"%{search}%") |
            NormalizedEvent.resource.ilike(f"%{search}%")
        )

    total = query.count()
    items = query.order_by(desc(NormalizedEvent.timestamp)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }

@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Retrieve full details of a normalized event by ID."""
    event = db.query(NormalizedEvent).filter(NormalizedEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")
    return event
