import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.models import User, DetectionRule, AuditLog
from backend.app.core.security import get_password_hash

def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)

def seed_users(db: Session):
    """Seed initial role-based users if they do not exist."""
    users_data = [
        {
            "username": "admin",
            "email": "admin@soc.local",
            "password": "Admin@12345",
            "full_name": "Chief Security Officer",
            "role": "admin"
        },
        {
            "username": "analyst",
            "email": "analyst@soc.local",
            "password": "Analyst@12345",
            "full_name": "SOC Lead Analyst",
            "role": "analyst"
        },
        {
            "username": "viewer",
            "email": "viewer@soc.local",
            "password": "Viewer@12345",
            "full_name": "Auditor / Viewer",
            "role": "viewer"
        }
    ]

    for user_info in users_data:
        existing = db.query(User).filter(User.username == user_info["username"]).first()
        if not existing:
            user = User(
                username=user_info["username"],
                email=user_info["email"],
                hashed_password=get_password_hash(user_info["password"]),
                full_name=user_info["full_name"],
                role=user_info["role"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
    db.commit()

def seed_rules(db: Session):
    """Seed initial standard detection rules."""
    rules_data = [
        {
            "rule_code": "BRUTE_FORCE",
            "name": "SSH / Authentication Brute Force",
            "description": "Trigger when failed login attempts from the same IP >= threshold within configured window.",
            "attack_type": "BRUTE_FORCE",
            "severity": "HIGH",
            "threshold_value": 5.0,
            "time_window_minutes": 5,
            "is_enabled": True,
            "config_json": json.dumps({"action": "LOGIN", "status": "FAILURE"})
        },
        {
            "rule_code": "PASSWORD_SPRAYING",
            "name": "Password Spraying Detection",
            "description": "Detect one source IP attempting authentication against multiple usernames in a short time.",
            "attack_type": "BRUTE_FORCE",
            "severity": "HIGH",
            "threshold_value": 3.0,
            "time_window_minutes": 5,
            "is_enabled": True,
            "config_json": json.dumps({"unique_users_threshold": 3})
        },
        {
            "rule_code": "SUCCESS_AFTER_BRUTE_FORCE",
            "name": "Successful Login After Multiple Failures",
            "description": "Detects multiple failed logins followed by successful authentication from the same IP or target user.",
            "attack_type": "SUSPICIOUS_LOGIN",
            "severity": "CRITICAL",
            "threshold_value": 3.0,
            "time_window_minutes": 10,
            "is_enabled": True,
            "config_json": json.dumps({"min_failures_before_success": 3})
        },
        {
            "rule_code": "PORT_SCAN",
            "name": "TCP / UDP Port Scanning",
            "description": "Detect one source IP querying multiple distinct destination ports in a short duration.",
            "attack_type": "PORT_SCAN",
            "severity": "HIGH",
            "threshold_value": 5.0,
            "time_window_minutes": 2,
            "is_enabled": True,
            "config_json": json.dumps({"distinct_ports_threshold": 5})
        },
        {
            "rule_code": "EXCESSIVE_REQUESTS",
            "name": "Excessive HTTP / Web Requests (DoS Indicator)",
            "description": "Detect abnormally high HTTP traffic from a single source IP exceeding normal request rates.",
            "attack_type": "DOS",
            "severity": "MEDIUM",
            "threshold_value": 60.0,
            "time_window_minutes": 1,
            "is_enabled": True,
            "config_json": json.dumps({"rate_per_min": 60})
        },
        {
            "rule_code": "SUSPICIOUS_LOGIN_TIME",
            "name": "Off-Hours Authentication Activity",
            "description": "Flags authentication events occurring outside standard working hours (23:00 - 05:00) as anomalous context.",
            "attack_type": "SUSPICIOUS_LOGIN",
            "severity": "MEDIUM",
            "threshold_value": 1.0,
            "time_window_minutes": 60,
            "is_enabled": True,
            "config_json": json.dumps({"start_hour": 23, "end_hour": 5})
        },
        {
            "rule_code": "MULTIPLE_IP_LOGIN",
            "name": "Impossible Travel / Concurrent Multi-IP Logins",
            "description": "Detect a single user account authenticating from multiple distinct source IPs within a short time.",
            "attack_type": "SUSPICIOUS_LOGIN",
            "severity": "HIGH",
            "threshold_value": 2.0,
            "time_window_minutes": 15,
            "is_enabled": True,
            "config_json": json.dumps({"distinct_ips_threshold": 2})
        },
        {
            "rule_code": "HIGH_DATA_TRANSFER",
            "name": "Abnormal Data Exfiltration Transfer",
            "description": "Detect outbound data volume significantly exceeding baseline threshold in a single connection or window.",
            "attack_type": "DATA_EXFILTRATION",
            "severity": "HIGH",
            "threshold_value": 10485760.0, # 10MB
            "time_window_minutes": 15,
            "is_enabled": True,
            "config_json": json.dumps({"min_bytes": 10485760})
        }
    ]

    for rule_info in rules_data:
        existing = db.query(DetectionRule).filter(DetectionRule.rule_code == rule_info["rule_code"]).first()
        if not existing:
            rule = DetectionRule(
                rule_code=rule_info["rule_code"],
                name=rule_info["name"],
                description=rule_info["description"],
                attack_type=rule_info["attack_type"],
                severity=rule_info["severity"],
                threshold_value=rule_info["threshold_value"],
                time_window_minutes=rule_info["time_window_minutes"],
                is_enabled=rule_info["is_enabled"],
                config_json=rule_info["config_json"]
            )
            db.add(rule)
    db.commit()

def run_seed():
    """Run database creation and initial seeding."""
    print("[*] Initializing database tables...")
    init_db()
    db = SessionLocal()
    try:
        print("[*] Seeding default users (admin, analyst, viewer)...")
        seed_users(db)
        print("[*] Seeding default detection rules...")
        seed_rules(db)
        print("[+] Database initialized and seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
