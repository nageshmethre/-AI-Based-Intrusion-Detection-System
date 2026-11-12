from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.event import NormalizedEvent
from backend.app.models.rule import DetectionRule
from backend.app.core.config import settings

@dataclass
class RuleMatch:
    rule_code: str
    rule_name: str
    attack_type: str
    severity: str
    confidence: float
    description: str
    evidence: Dict[str, Any]
    recommended_action: str

@dataclass
class CachedRule:
    rule_code: str
    name: str
    description: str
    attack_type: str
    severity: str
    threshold_value: float
    time_window_minutes: int
    is_enabled: bool
    config_json: Optional[str] = None

class RuleBasedDetectionEngine:
    """Evaluates incoming normalized events against active security detection rules."""

    def __init__(self):
        self._rules_cache: Dict[str, CachedRule] = {}
        self._cache_time: Optional[datetime] = None

    def _get_active_rules(self, db: Session) -> Dict[str, CachedRule]:
        """Fetch active detection rules from DB with caching as detached plain dataclasses."""
        now = datetime.now(timezone.utc)
        if not self._rules_cache or not self._cache_time or (now - self._cache_time).total_seconds() > 30:
            rules = db.query(DetectionRule).filter(DetectionRule.is_enabled == True).all()
            self._rules_cache = {
                r.rule_code: CachedRule(
                    rule_code=r.rule_code,
                    name=r.name,
                    description=r.description,
                    attack_type=r.attack_type,
                    severity=r.severity,
                    threshold_value=float(r.threshold_value),
                    time_window_minutes=int(r.time_window_minutes),
                    is_enabled=r.is_enabled,
                    config_json=r.config_json
                )
                for r in rules
            }
            self._cache_time = now
        return self._rules_cache

    def evaluate_event(self, db: Session, event: NormalizedEvent) -> List[RuleMatch]:
        """Evaluate an event and its temporal context against all active rules."""
        matches: List[RuleMatch] = []
        rules = self._get_active_rules(db)

        # 1. BRUTE_FORCE: Failed login attempts from same IP >= threshold in window
        if "BRUTE_FORCE" in rules and event.source_ip and event.action == "LOGIN" and event.status == "FAILURE":
            rule = rules["BRUTE_FORCE"]
            window_start = event.timestamp - timedelta(minutes=rule.time_window_minutes)
            fail_count = db.query(NormalizedEvent).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.action == "LOGIN",
                NormalizedEvent.status == "FAILURE",
                NormalizedEvent.timestamp >= window_start,
                NormalizedEvent.timestamp <= event.timestamp
            ).count()

            if fail_count >= int(rule.threshold_value):
                matches.append(RuleMatch(
                    rule_code="BRUTE_FORCE",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=min(0.70 + (fail_count * 0.03), 0.98),
                    description=f"Detected {fail_count} failed login attempts from source IP {event.source_ip} within {rule.time_window_minutes} minutes.",
                    evidence={
                        "failed_attempts": fail_count,
                        "threshold": int(rule.threshold_value),
                        "window_minutes": rule.time_window_minutes,
                        "source_ip": event.source_ip,
                        "targeted_user": event.username
                    },
                    recommended_action="Temporarily ban source IP at firewall/WAF and enforce MFA on targeted account."
                ))

        # 2. PASSWORD_SPRAYING: One IP targeting multiple distinct usernames
        if "PASSWORD_SPRAYING" in rules and event.source_ip and event.action == "LOGIN" and event.status == "FAILURE":
            rule = rules["PASSWORD_SPRAYING"]
            window_start = event.timestamp - timedelta(minutes=rule.time_window_minutes)
            unique_users = db.query(func.count(func.distinct(NormalizedEvent.username))).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.action == "LOGIN",
                NormalizedEvent.status == "FAILURE",
                NormalizedEvent.timestamp >= window_start,
                NormalizedEvent.timestamp <= event.timestamp
            ).scalar() or 0

            if unique_users >= int(rule.threshold_value):
                matches.append(RuleMatch(
                    rule_code="PASSWORD_SPRAYING",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=0.88,
                    description=f"Source IP {event.source_ip} attempted failed logins across {unique_users} distinct usernames.",
                    evidence={
                        "unique_targeted_users": unique_users,
                        "threshold": int(rule.threshold_value),
                        "window_minutes": rule.time_window_minutes,
                        "source_ip": event.source_ip
                    },
                    recommended_action="Block source IP immediately; review directory services for leaked credential lists."
                ))

        # 3. SUCCESS_AFTER_BRUTE_FORCE: Multiple failed attempts followed by success
        if "SUCCESS_AFTER_BRUTE_FORCE" in rules and event.action == "LOGIN" and event.status == "SUCCESS":
            rule = rules["SUCCESS_AFTER_BRUTE_FORCE"]
            window_start = event.timestamp - timedelta(minutes=rule.time_window_minutes)
            
            # Check failures for either same IP or same target user
            prior_failures = 0
            if event.source_ip:
                prior_failures = db.query(NormalizedEvent).filter(
                    NormalizedEvent.source_ip == event.source_ip,
                    NormalizedEvent.action == "LOGIN",
                    NormalizedEvent.status == "FAILURE",
                    NormalizedEvent.timestamp >= window_start,
                    NormalizedEvent.timestamp < event.timestamp
                ).count()
            
            if prior_failures < int(rule.threshold_value) and event.username:
                prior_failures = db.query(NormalizedEvent).filter(
                    NormalizedEvent.username == event.username,
                    NormalizedEvent.action == "LOGIN",
                    NormalizedEvent.status == "FAILURE",
                    NormalizedEvent.timestamp >= window_start,
                    NormalizedEvent.timestamp < event.timestamp
                ).count()

            if prior_failures >= int(rule.threshold_value):
                matches.append(RuleMatch(
                    rule_code="SUCCESS_AFTER_BRUTE_FORCE",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=0.95,
                    description=f"Critical: Successful login for '{event.username}' from {event.source_ip} directly following {prior_failures} failed attempts.",
                    evidence={
                        "prior_failed_attempts": prior_failures,
                        "successful_user": event.username,
                        "source_ip": event.source_ip,
                        "window_minutes": rule.time_window_minutes
                    },
                    recommended_action="Terminate active user session immediately, force credential reset, and isolate endpoint."
                ))

        # 4. PORT_SCAN: One IP querying >= threshold distinct destination ports
        if "PORT_SCAN" in rules and event.source_ip and event.destination_port:
            rule = rules["PORT_SCAN"]
            window_start = event.timestamp - timedelta(minutes=rule.time_window_minutes)
            distinct_ports = db.query(func.count(func.distinct(NormalizedEvent.destination_port))).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.timestamp >= window_start,
                NormalizedEvent.timestamp <= event.timestamp
            ).scalar() or 0

            if distinct_ports >= int(rule.threshold_value):
                matches.append(RuleMatch(
                    rule_code="PORT_SCAN",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=0.90,
                    description=f"Source IP {event.source_ip} probed {distinct_ports} distinct destination ports within {rule.time_window_minutes} minutes.",
                    evidence={
                        "distinct_ports_scanned": distinct_ports,
                        "threshold": int(rule.threshold_value),
                        "window_minutes": rule.time_window_minutes,
                        "source_ip": event.source_ip
                    },
                    recommended_action="Drop ingress packets from source IP and verify perimeter firewall rules."
                ))

        # 5. EXCESSIVE_REQUESTS: High request volume from single IP
        if "EXCESSIVE_REQUESTS" in rules and event.source_ip and event.event_type == "WEB":
            rule = rules["EXCESSIVE_REQUESTS"]
            window_start = event.timestamp - timedelta(minutes=rule.time_window_minutes)
            req_count = db.query(NormalizedEvent).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.event_type == "WEB",
                NormalizedEvent.timestamp >= window_start,
                NormalizedEvent.timestamp <= event.timestamp
            ).count()

            if req_count >= int(rule.threshold_value):
                matches.append(RuleMatch(
                    rule_code="EXCESSIVE_REQUESTS",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=0.82,
                    description=f"Abnormally high HTTP request rate ({req_count} requests in {rule.time_window_minutes}m) from {event.source_ip}.",
                    evidence={
                        "request_count": req_count,
                        "rate_limit_threshold": int(rule.threshold_value),
                        "source_ip": event.source_ip
                    },
                    recommended_action="Apply rate-limiting or CAPTCHA challenge at reverse proxy."
                ))

        # 6. SUSPICIOUS_LOGIN_TIME: Login outside working hours
        if "SUSPICIOUS_LOGIN_TIME" in rules and event.action == "LOGIN" and event.status == "SUCCESS":
            rule = rules["SUSPICIOUS_LOGIN_TIME"]
            event_hour = event.timestamp.hour
            is_off_hours = (event_hour >= 23 or event_hour < 5)
            if is_off_hours:
                matches.append(RuleMatch(
                    rule_code="SUSPICIOUS_LOGIN_TIME",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=0.60, # Non-deterministic: not automatically malicious, flagged as anomalous evidence
                    description=f"Authentication activity for '{event.username}' observed during off-hours ({event_hour:02d}:00 UTC).",
                    evidence={
                        "event_hour": event_hour,
                        "username": event.username,
                        "source_ip": event.source_ip
                    },
                    recommended_action="Verify user identity and check if user had authorized scheduled off-hours maintenance."
                ))

        # 7. MULTIPLE_IP_LOGIN: One user authenticating from distinct IPs
        if "MULTIPLE_IP_LOGIN" in rules and event.username and event.action == "LOGIN" and event.status == "SUCCESS":
            rule = rules["MULTIPLE_IP_LOGIN"]
            window_start = event.timestamp - timedelta(minutes=rule.time_window_minutes)
            distinct_ips = db.query(func.count(func.distinct(NormalizedEvent.source_ip))).filter(
                NormalizedEvent.username == event.username,
                NormalizedEvent.action == "LOGIN",
                NormalizedEvent.status == "SUCCESS",
                NormalizedEvent.timestamp >= window_start,
                NormalizedEvent.timestamp <= event.timestamp
            ).scalar() or 0

            if distinct_ips >= int(rule.threshold_value):
                matches.append(RuleMatch(
                    rule_code="MULTIPLE_IP_LOGIN",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=0.85,
                    description=f"User account '{event.username}' successfully logged in from {distinct_ips} distinct IP addresses within {rule.time_window_minutes} minutes.",
                    evidence={
                        "distinct_ips": distinct_ips,
                        "username": event.username,
                        "window_minutes": rule.time_window_minutes
                    },
                    recommended_action="Investigate impossible travel anomaly; verify VPN/proxy usage with employee."
                ))

        # 8. HIGH_DATA_TRANSFER: Outbound data spike
        if "HIGH_DATA_TRANSFER" in rules and (event.bytes_sent or event.bytes_received):
            rule = rules["HIGH_DATA_TRANSFER"]
            total_bytes = (event.bytes_sent or 0) + (event.bytes_received or 0)
            if total_bytes >= int(rule.threshold_value):
                mb_val = round(total_bytes / (1024 * 1024), 2)
                matches.append(RuleMatch(
                    rule_code="HIGH_DATA_TRANSFER",
                    rule_name=rule.name,
                    attack_type=rule.attack_type,
                    severity=rule.severity,
                    confidence=0.84,
                    description=f"High outbound data volume detected: {mb_val} MB transferred in a single session.",
                    evidence={
                        "bytes_transferred": total_bytes,
                        "megabytes": mb_val,
                        "threshold_bytes": int(rule.threshold_value),
                        "source_ip": event.source_ip,
                        "resource": event.resource
                    },
                    recommended_action="Inspect destination IP and review DLP alerts for unauthorized exfiltration."
                ))

        return matches

rules_engine = RuleBasedDetectionEngine()
