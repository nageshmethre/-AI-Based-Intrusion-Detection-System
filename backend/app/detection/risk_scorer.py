from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class RiskAssessment:
    risk_score: float                  # 0.0 - 100.0
    severity: str                      # LOW, MEDIUM, HIGH, CRITICAL
    reasons: List[str]                 # Transparent explanations for why the score was assigned
    factors: Dict[str, float]          # Numerical component breakdown

class RiskScoringEngine:
    """
    Computes an application-defined composite risk score (0-100).
    Combines rule severity weights, ML anomaly scores, attack classification confidence,
    temporal frequency, and affected blast radius.
    """

    SEVERITY_BASE_WEIGHTS = {
        "CRITICAL": 85.0,
        "HIGH": 65.0,
        "MEDIUM": 40.0,
        "LOW": 20.0,
        "INFO": 5.0
    }

    def assess_risk(
        self,
        rule_matches: list,
        ml_prediction: Dict[str, Any],
        event_severity: str = "INFO",
        affected_users_count: int = 1,
        affected_ips_count: int = 1,
        frequency_count: int = 1
    ) -> RiskAssessment:
        reasons = []
        score = 0.0

        # Component 1: Rule-based weight (max 50 points)
        rule_score = 0.0
        if rule_matches:
            # Take highest severity rule match
            max_rule_sev = "LOW"
            for m in rule_matches:
                reasons.append(f"Detection Rule Triggered: {m.rule_name} ({m.attack_type})")
                if m.severity == "CRITICAL":
                    max_rule_sev = "CRITICAL"
                elif m.severity == "HIGH" and max_rule_sev != "CRITICAL":
                    max_rule_sev = "HIGH"
                elif m.severity == "MEDIUM" and max_rule_sev not in ("CRITICAL", "HIGH"):
                    max_rule_sev = "MEDIUM"

            rule_score = self.SEVERITY_BASE_WEIGHTS.get(max_rule_sev, 25.0) * 0.50
        else:
            base = self.SEVERITY_BASE_WEIGHTS.get(event_severity, 5.0)
            rule_score = base * 0.30

        # Component 2: ML Anomaly Score (contributes up to 30 points)
        anom_score = float(ml_prediction.get("anomaly_score", 0.0))
        ml_contrib = (anom_score / 100.0) * 30.0
        if anom_score >= 60.0:
            reasons.append(f"ML Anomaly Score elevated: {anom_score:.1f}/100 (Isolation Forest)")
        
        # Component 3: ML Attack Classification Confidence (contributes up to 10 points)
        predicted_attack = ml_prediction.get("predicted_attack", "NORMAL")
        confidence = float(ml_prediction.get("confidence", 0.0))
        clf_contrib = 0.0
        if predicted_attack not in ("NORMAL", "OTHER") and confidence >= 0.50:
            clf_contrib = confidence * 10.0
            reasons.append(f"ML Classifier identified: {predicted_attack} ({confidence * 100:.1f}% confidence)")

        # Component 4: Asset Blast Radius & Frequency (contributes up to 10 points)
        blast_contrib = 0.0
        if affected_users_count > 1:
            boost = min((affected_users_count - 1) * 3.0, 5.0)
            blast_contrib += boost
            reasons.append(f"Multiple user accounts targeted ({affected_users_count} users)")
        if frequency_count > 5:
            boost = min((frequency_count - 5) * 0.5, 5.0)
            blast_contrib += boost
            reasons.append(f"High event frequency detected ({frequency_count} occurrences)")

        # Sum total composite score (clamped between 0.0 and 100.0)
        total_score = min(100.0, max(0.0, rule_score + ml_contrib + clf_contrib + blast_contrib))
        final_score = round(total_score, 1)

        # Map to severity bands
        # 0-29: LOW, 30-59: MEDIUM, 60-79: HIGH, 80-100: CRITICAL
        if final_score >= 80.0:
            severity = "CRITICAL"
        elif final_score >= 60.0:
            severity = "HIGH"
        elif final_score >= 30.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        if not reasons:
            reasons.append("Standard telemetry within normal statistical parameters.")

        return RiskAssessment(
            risk_score=final_score,
            severity=severity,
            reasons=reasons,
            factors={
                "rule_component": round(rule_score, 1),
                "ml_anomaly_component": round(ml_contrib, 1),
                "classifier_component": round(clf_contrib, 1),
                "blast_radius_component": round(blast_contrib, 1)
            }
        )

risk_scorer = RiskScoringEngine()
