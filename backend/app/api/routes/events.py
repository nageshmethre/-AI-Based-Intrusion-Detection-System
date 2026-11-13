import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
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

_WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

SAMPLE_CATALOG = {
    "ssh_brute_force": {
        "id": "ssh_brute_force",
        "name": "SSH Authentication Brute Force",
        "category": "Brute Force",
        "filename": "ssh_brute_force.log",
        "rel_path": os.path.join("sample_data", "brute_force", "ssh_brute_force.log"),
        "description": "10 repeated failed root/admin authentication attempts from 203.0.113.55 targeting SSH service.",
        "mitre_tactic": "Credential Access (T1110.001)"
    },
    "exfiltration_web": {
        "id": "exfiltration_web",
        "name": "SQL Injection & Data Exfiltration",
        "category": "Web Exploitation",
        "filename": "exfiltration_web.log",
        "rel_path": os.path.join("sample_data", "suspicious", "exfiltration_web.log"),
        "description": "SQL injection union payload, directory traversal /etc/passwd, and 48MB database export.",
        "mitre_tactic": "Exfiltration Over C2 (T1048) / Injection (T1190)"
    },
    "ufw_port_scan": {
        "id": "ufw_port_scan",
        "name": "Reconnaissance Port Scan",
        "category": "Reconnaissance",
        "filename": "ufw_port_scan.log",
        "rel_path": os.path.join("sample_data", "port_scan", "ufw_port_scan.log"),
        "description": "UFW kernel blocked probes sweeping 13 consecutive TCP services from 198.51.100.99.",
        "mitre_tactic": "Network Service Discovery (T1046)"
    },
    "windows_privilege_escalation": {
        "id": "windows_privilege_escalation",
        "name": "Windows Privilege Escalation",
        "category": "Privilege Escalation",
        "filename": "windows_privilege_escalation.log",
        "rel_path": os.path.join("sample_data", "suspicious", "windows_privilege_escalation.log"),
        "description": "Failed logon followed by Event 4672 special privileges and cmd/powershell execution.",
        "mitre_tactic": "Privilege Escalation (T1078 / T1059)"
    },
    "ransomware_activity": {
        "id": "ransomware_activity",
        "name": "Ransomware Shadow Copy Deletion",
        "category": "Ransomware",
        "filename": "ransomware_activity.log",
        "rel_path": os.path.join("sample_data", "ransomware", "ransomware_activity.log"),
        "description": "Ransomware execution deleting volume shadow copies (vssadmin) and encrypting shares.",
        "mitre_tactic": "Inhibit System Recovery (T1490)"
    },
    "syn_flood_ddos": {
        "id": "syn_flood_ddos",
        "name": "Distributed SYN Flood (DDoS)",
        "category": "Denial of Service",
        "filename": "syn_flood_ddos.log",
        "rel_path": os.path.join("sample_data", "ddos", "syn_flood_ddos.log"),
        "description": "High-frequency TCP SYN packet burst across distributed public IP subnets.",
        "mitre_tactic": "Network Denial of Service (T1498)"
    },
    "cicids2017_flow_sample": {
        "id": "cicids2017_flow_sample",
        "name": "CIC-IDS2017 Network Flow Benchmark",
        "category": "ML Benchmark (CSV)",
        "filename": "cicids2017_flow_sample.csv",
        "rel_path": os.path.join("sample_data", "cicids2017", "cicids2017_flow_sample.csv"),
        "description": "Standard Canadian Institute for Cybersecurity benchmark flow dataset (DoS, Patator, PortScan, Benign).",
        "mitre_tactic": "Multiple Attack Vectors (Benchmark)"
    },
    "normal_syslog": {
        "id": "normal_syslog",
        "name": "Baseline Normal Operations",
        "category": "Benign Baseline",
        "filename": "normal_syslog.log",
        "rel_path": os.path.join("sample_data", "normal", "normal_syslog.log"),
        "description": "Normal developer access, routine sudo administrative commands, and benign health-check traffic.",
        "mitre_tactic": "Benign / Normal"
    }
}

@router.post("/upload", response_model=LogUploadResponse)
async def upload_log_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Upload and ingest a security log file (.log, .txt, .csv, .json)."""
    file_name = file.filename or "uploaded.log"
    lower_name = file_name.lower()
    if not any(lower_name.endswith(ext) for ext in [".log", ".txt", ".csv", ".json"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload .log, .txt, .csv, or .json files."
        )

    content_bytes = await file.read()
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

@router.get("/samples")
def list_sample_datasets():
    """List all available forensic investigation sample datasets with raw content and download links."""
    samples = []
    for sample_id, meta in SAMPLE_CATALOG.items():
        abs_path = os.path.join(_WORKSPACE_DIR, meta["rel_path"])
        content = ""
        line_count = 0
        if os.path.exists(abs_path):
            try:
                with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                line_count = len(content.splitlines())
            except Exception:
                content = ""
        samples.append({
            "id": meta["id"],
            "name": meta["name"],
            "category": meta["category"],
            "filename": meta["filename"],
            "description": meta["description"],
            "mitre_tactic": meta["mitre_tactic"],
            "line_count": line_count,
            "content": content,
            "download_url": f"/api/events/samples/{sample_id}/download"
        })
    return samples

@router.get("/samples/{sample_id}/download")
def download_sample_dataset(sample_id: str):
    """Download a specific investigation sample dataset as a file attachment."""
    if sample_id not in SAMPLE_CATALOG:
        raise HTTPException(status_code=404, detail="Sample dataset not found")

    meta = SAMPLE_CATALOG[sample_id]
    abs_path = os.path.join(_WORKSPACE_DIR, meta["rel_path"])
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="Dataset file missing on disk")

    media_type = "text/csv" if meta["filename"].endswith(".csv") else "text/plain"
    return FileResponse(
        path=abs_path,
        media_type=media_type,
        filename=meta["filename"],
        headers={"Content-Disposition": f'attachment; filename="{meta["filename"]}"'}
    )

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