import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def admin_token():
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@12345"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "online"

def test_auth_login_admin():
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@12345"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_auth_login_invalid():
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert resp.status_code == 401

def test_get_dashboard_summary(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/analytics/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "kpis" in data
    assert "events_over_time" in data
    assert "attack_type_distribution" in data

def test_security_simulation_run(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.post("/api/simulation/run", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["events_generated"] >= 10
    assert data["alerts_created"] >= 1

def test_get_alerts_after_simulation(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/alerts", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    first_alert = data["items"][0]
    assert "alert_id" in first_alert
    assert "risk_score" in first_alert

def test_alert_ai_explanation(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/alerts", headers=headers)
    alerts = resp.json()["items"]
    if alerts:
        alt_id = alerts[0]["id"]
        exp_resp = client.get(f"/api/alerts/{alt_id}/explanation", headers=headers)
        assert exp_resp.status_code == 200
        exp = exp_resp.json()
        assert "what_happened" in exp
        assert "why_suspicious" in exp
        assert "supporting_evidence" in exp
        assert "recommended_investigation_steps" in exp

def test_get_rules_list(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/rules", headers=headers)
    assert resp.status_code == 200
    rules = resp.json()
    assert len(rules) >= 8

def test_get_ml_models_metadata(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/ml/models", headers=headers)
    assert resp.status_code == 200
    models = resp.json()
    assert len(models) >= 1

def test_generate_pdf_report(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Fetch an incident
    inc_resp = client.get("/api/incidents", headers=headers)
    assert inc_resp.status_code == 200
    incidents = inc_resp.json()["items"]
    if incidents:
        inc_id = incidents[0]["id"]
        gen_resp = client.post("/api/reports/generate", json={"incident_id": inc_id}, headers=headers)
        assert gen_resp.status_code == 200
        data = gen_resp.json()
        assert "download_url" in data
        assert data["filename"].endswith(".pdf")
