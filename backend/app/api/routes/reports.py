import os
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.incident import Incident
from backend.app.models.alert import Alert
from backend.app.services.report_generator import report_generator
from backend.app.api.deps import require_analyst, require_viewer
from backend.app.models.user import User

router = APIRouter(prefix="/reports", tags=["Incident Reports & PDF Generation"])

@router.post("/generate")
def generate_report(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Generate a formal PDF incident report for an incident or alert."""
    incident_id = payload.get("incident_id")
    alert_id = payload.get("alert_id")

    incident = None
    if incident_id:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
    elif alert_id:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            if alert.incident_id:
                incident = db.query(Incident).filter(Incident.id == alert.incident_id).first()
            if not incident:
                from backend.app.services.incident_service import incident_service
                incident = incident_service.correlate_alert(db, alert)

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found to generate report.")

    analyst_name = current_user.full_name or current_user.username
    pdf_path = report_generator.generate_pdf(incident, analyst_name=analyst_name)
    filename = os.path.basename(pdf_path)

    return {
        "message": "Incident report generated successfully",
        "incident_id": incident.incident_id,
        "filename": filename,
        "download_url": f"/api/reports/download/{filename}"
    }

@router.get("/download/{filename}")
def download_report(
    filename: str,
    current_user: User = Depends(require_viewer)
):
    """Download a generated PDF incident report."""
    filepath = os.path.join(report_generator.reports_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Requested report file does not exist.")
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=filename
    )
