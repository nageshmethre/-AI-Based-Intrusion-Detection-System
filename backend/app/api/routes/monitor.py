from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from backend.app.services.live_monitor_service import live_monitor_service
from backend.app.api.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/monitor", tags=["24x7 Real-Time Host Monitoring"])

class WatchFileRequest(BaseModel):
    filepath: str

class StreamLogRequest(BaseModel):
    raw_log: str
    source_label: str = "remote_agent"

@router.get("/status")
def get_monitor_status() -> Dict[str, Any]:
    """Get operational telemetry of the 24x7 Real-Time Server Monitoring Daemon."""
    return live_monitor_service.get_status()

@router.post("/start")
def start_monitor(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Start 24x7 background log file tailing, Windows Event poller, and UDP Syslog listener."""
    live_monitor_service.start()
    return {"message": "24x7 Real-Time Server Monitoring Daemon is ACTIVE.", "status": live_monitor_service.get_status()}

@router.post("/stop")
def stop_monitor(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Pause 24x7 background log monitoring and listeners."""
    live_monitor_service.stop()
    return {"message": "24x7 Real-Time Server Monitoring Daemon paused.", "status": live_monitor_service.get_status()}

@router.post("/watch")
def add_watched_file(req: WatchFileRequest, current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Add a real server log file (e.g. /var/log/auth.log, /var/log/nginx/access.log) to continuous watch."""
    live_monitor_service.add_watched_file(req.filepath)
    return {"message": f"Added '{req.filepath}' to 24x7 continuous watch list.", "status": live_monitor_service.get_status()}

@router.post("/unwatch")
def remove_watched_file(req: WatchFileRequest, current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Remove a file from the continuous watch list."""
    live_monitor_service.remove_watched_file(req.filepath)
    return {"message": f"Removed '{req.filepath}' from watch list.", "status": live_monitor_service.get_status()}

@router.post("/stream-log")
def stream_single_log(req: StreamLogRequest) -> Dict[str, Any]:
    """
    Direct HTTP streaming ingestion endpoint for real external server agents (FluentBit, Vector, curl).
    Processes the raw log through the ML + Rule pipeline immediately.
    """
    live_monitor_service._process_real_lines([req.raw_log], source_label=req.source_label)
    return {"status": "processed", "raw_log": req.raw_log}
