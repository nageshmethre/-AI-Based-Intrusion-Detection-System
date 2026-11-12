from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.services.simulation_service import simulation_service
from backend.app.api.deps import require_analyst
from backend.app.models.user import User

router = APIRouter(prefix="/simulation", tags=["Security Attack Simulation Engine"])

@router.post("/run")
def trigger_security_simulation(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """
    1-Click Demo Mode (Section 26):
    Triggers controlled synthetic multi-stage attack sequence (Port Scan -> Brute Force -> Privilege Escalation -> Exfiltration).
    Streams live alerts via WebSocket and updates dashboard telemetry.
    """
    result = simulation_service.run_multi_stage_simulation(db)
    return result
