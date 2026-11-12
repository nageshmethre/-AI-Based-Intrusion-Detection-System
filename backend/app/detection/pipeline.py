import json
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.event import NormalizedEvent
from backend.app.models.alert import Alert
from backend.app.detection.rules_engine import rules_engine
from backend.app.detection.risk_scorer import risk_scorer
from backend.app.services.alert_service import alert_service
from ml.predict import ml_predictor

class DetectionPipeline:
    """Master orchestrator combining feature extraction, rule checks, ML models, and risk scoring."""

    def extract_event_features(self, db: Session, event: NormalizedEvent) -> Dict[str, Any]:
        """Dynamically compute temporal and statistical feature vector for the event context."""
        now = event.timestamp
        five_min_ago = now - timedelta(minutes=5)
        one_min_ago = now - timedelta(minutes=1)

        failed_count = 0
        succ_count = 0
        req_count = 1
        unique_ports = 1
        unique_users = 1

        if event.source_ip:
            # Login counts in past 5m
            failed_count = db.query(NormalizedEvent).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.action == "LOGIN",
                NormalizedEvent.status == "FAILURE",
                NormalizedEvent.timestamp >= five_min_ago,
                NormalizedEvent.timestamp <= now
            ).count()

            succ_count = db.query(NormalizedEvent).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.action == "LOGIN",
                NormalizedEvent.status == "SUCCESS",
                NormalizedEvent.timestamp >= five_min_ago,
                NormalizedEvent.timestamp <= now
            ).count()

            # Requests in past 1m
            req_count = db.query(NormalizedEvent).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.timestamp >= one_min_ago,
                NormalizedEvent.timestamp <= now
            ).count()

            # Unique ports probed in past 5m
            unique_ports = db.query(func.count(func.distinct(NormalizedEvent.destination_port))).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.timestamp >= five_min_ago,
                NormalizedEvent.timestamp <= now
            ).scalar() or 1

            # Unique users targeted in past 5m
            unique_users = db.query(func.count(func.distinct(NormalizedEvent.username))).filter(
                NormalizedEvent.source_ip == event.source_ip,
                NormalizedEvent.timestamp >= five_min_ago,
                NormalizedEvent.timestamp <= now
            ).scalar() or 1

        total_logins = failed_count + succ_count
        ratio = failed_count / total_logins if total_logins > 0 else 0.0

        hour = event.timestamp.hour
        is_off_hours = 1 if (hour >= 23 or hour < 5) else 0
        is_wknd = 1 if event.timestamp.weekday() >= 5 else 0

        return {
            "failed_login_count": failed_count,
            "successful_login_count": succ_count,
            "auth_failure_ratio": ratio,
            "requests_per_minute": req_count,
            "unique_ports_count": unique_ports,
            "unique_users_count": unique_users,
            "bytes_sent": event.bytes_sent or 0,
            "bytes_received": event.bytes_received or 0,
            "login_hour": hour,
            "is_weekend": is_wknd,
            "is_off_hours": is_off_hours,
            "time_since_last_event_sec": 5
        }

    def process_event(self, db: Session, event: NormalizedEvent) -> Optional[Alert]:
        """Run complete detection pipeline on a single normalized event."""
        # 1. Temporal Feature Extraction
        features = self.extract_event_features(db, event)

        # 2. Rule Engine Evaluation
        rule_matches = rules_engine.evaluate_event(db, event)
        rule_codes = [m.rule_code for m in rule_matches]

        # 3. Machine Learning Inference
        ml_res = ml_predictor.predict(features)
        anomaly_score = ml_res["anomaly_score"]
        predicted_attack = ml_res["predicted_attack"]
        ml_confidence = ml_res["confidence"]

        # 4. Composite Risk Assessment
        assessment = risk_scorer.assess_risk(
            rule_matches=rule_matches,
            ml_prediction=ml_res,
            event_severity=event.severity,
            affected_users_count=features.get("unique_users_count", 1),
            affected_ips_count=1,
            frequency_count=features.get("requests_per_minute", 1)
        )

        # 5. Update Event Attributes
        event.risk_score = assessment.risk_score
        event.anomaly_score = anomaly_score
        event.attack_type = predicted_attack if predicted_attack != "NORMAL" else (rule_matches[0].attack_type if rule_matches else "NORMAL")
        event.rule_triggers = json.dumps(rule_codes)
        db.commit()

        # 6. Alert Generation Trigger
        # Trigger an alert if rules matched, or risk score >= 50, or ML detected strong anomaly
        should_alert = bool(rule_matches or assessment.risk_score >= 50.0 or (ml_res["is_anomaly"] and predicted_attack != "NORMAL"))

        if should_alert:
            attack_type = rule_matches[0].attack_type if rule_matches else (predicted_attack if predicted_attack != "NORMAL" else "SUSPICIOUS_ACTIVITY")
            description = rule_matches[0].description if rule_matches else f"Anomalous security behavior flagged with risk score {assessment.risk_score}."
            rec_action = rule_matches[0].recommended_action if rule_matches else "Investigate associated host telemetry and verify user credentials."

            evidence_data = {
                "risk_score": assessment.risk_score,
                "reasons": assessment.reasons,
                "factors": assessment.factors,
                "ml_anomaly_score": anomaly_score,
                "ml_predicted_attack": predicted_attack,
                "ml_confidence": ml_confidence,
                "rule_triggers": rule_codes,
                "extracted_features": features,
                "raw_sample": event.raw_log[:200]
            }

            alert = alert_service.create_alert(
                db=db,
                attack_type=attack_type,
                severity=assessment.severity,
                risk_score=assessment.risk_score,
                confidence=rule_matches[0].confidence if rule_matches else ml_confidence,
                description=description,
                source_ip=event.source_ip,
                username=event.username,
                evidence=evidence_data,
                recommended_action=rec_action
            )
            return alert

        return None

    def process_events(self, db: Session, events: List[NormalizedEvent]) -> List[Alert]:
        """Batch process a collection of newly ingested events."""
        created_alerts = []
        for e in events:
            alt = self.process_event(db, e)
            if alt:
                created_alerts.append(alt)
        return created_alerts

detection_pipeline = DetectionPipeline()
