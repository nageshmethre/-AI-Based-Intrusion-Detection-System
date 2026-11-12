import pytest
from datetime import datetime, timedelta, timezone
from backend.app.database.session import SessionLocal
from backend.app.models.event import NormalizedEvent
from backend.app.detection.rules_engine import rules_engine

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_brute_force_rule(db):
    now = datetime.now(timezone.utc)
    test_ip = "198.51.100.25"

    # Insert 5 failed logins within 2 minutes
    events = []
    for i in range(5):
        e = NormalizedEvent(
            timestamp=now - timedelta(seconds=(5 - i) * 15),
            source_ip=test_ip,
            username="root",
            event_type="AUTH",
            action="LOGIN",
            status="FAILURE",
            raw_log="Failed password for root",
            severity="HIGH"
        )
        db.add(e)
        events.append(e)
    db.commit()

    # Evaluate the 5th event
    matches = rules_engine.evaluate_event(db, events[-1])
    brute_matches = [m for m in matches if m.rule_code == "BRUTE_FORCE"]
    assert len(brute_matches) >= 1
    assert brute_matches[0].severity == "HIGH"
    assert brute_matches[0].attack_type == "BRUTE_FORCE"

def test_port_scan_rule(db):
    now = datetime.now(timezone.utc)
    scanner_ip = "203.0.113.88"

    # Probes 6 different ports
    events = []
    ports = [21, 22, 23, 80, 443, 3389]
    for p in ports:
        e = NormalizedEvent(
            timestamp=now - timedelta(seconds=10),
            source_ip=scanner_ip,
            destination_port=p,
            event_type="NETWORK",
            action="PORT_CONNECT",
            status="BLOCKED",
            raw_log=f"Connection attempt to port {p}",
            severity="LOW"
        )
        db.add(e)
        events.append(e)
    db.commit()

    matches = rules_engine.evaluate_event(db, events[-1])
    scan_matches = [m for m in matches if m.rule_code == "PORT_SCAN"]
    assert len(scan_matches) >= 1
    assert scan_matches[0].evidence["distinct_ports_scanned"] >= 5

def test_high_data_transfer_rule(db):
    now = datetime.now(timezone.utc)
    e = NormalizedEvent(
        timestamp=now,
        source_ip="10.0.0.40",
        event_type="NETWORK",
        action="DATA_TRANSFER",
        status="SUCCESS",
        bytes_sent=15 * 1024 * 1024, # 15 MB
        raw_log="Large outbound data transfer",
        severity="HIGH"
    )
    db.add(e)
    db.commit()

    matches = rules_engine.evaluate_event(db, e)
    transfer_matches = [m for m in matches if m.rule_code == "HIGH_DATA_TRANSFER"]
    assert len(transfer_matches) >= 1
    assert transfer_matches[0].evidence["megabytes"] == 15.0
