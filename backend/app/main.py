from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.database.session import Base, engine
from backend.app.database.seed import init_db, seed_users, seed_rules, SessionLocal
from backend.app.api.websocket import ws_manager

# Ensure tables and seed data exist on startup
init_db()
_db = SessionLocal()
try:
    seed_users(_db)
    seed_rules(_db)
finally:
    _db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Production-style AI-Based Suspicious Log Detector & Security Analytics Platform (Mini-SOC)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include all API routers
from backend.app.api.routes import (
    auth,
    events,
    alerts,
    incidents,
    iocs,
    rules,
    ml,
    analytics,
    reports,
    simulation,
    monitor
)
from backend.app.services.live_monitor_service import live_monitor_service

# Auto-start 24x7 Real-Time Host Monitoring & Syslog Listener
@app.on_event("startup")
def startup_event():
    live_monitor_service.start()

@app.on_event("shutdown")
def shutdown_event():
    live_monitor_service.stop()

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(iocs.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(monitor.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """WebSocket endpoint streaming live security alerts to frontend SOC dashboards."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; wait for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
