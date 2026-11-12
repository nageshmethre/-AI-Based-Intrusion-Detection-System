import pytest
from backend.app.detection.risk_scorer import risk_scorer
from backend.app.detection.rules_engine import RuleMatch

def test_risk_scorer_low_normal():
    assessment = risk_scorer.assess_risk(
        rule_matches=[],
        ml_prediction={"anomaly_score": 10.0, "predicted_attack": "NORMAL", "confidence": 0.95},
        event_severity="INFO"
    )
    assert assessment.risk_score < 30.0
    assert assessment.severity == "LOW"
    assert len(assessment.reasons) > 0

def test_risk_scorer_critical_brute_force():
    rule_match = RuleMatch(
        rule_code="SUCCESS_AFTER_BRUTE_FORCE",
        rule_name="Successful Login After Multiple Failures",
        attack_type="SUSPICIOUS_LOGIN",
        severity="CRITICAL",
        confidence=0.95,
        description="Multiple failed logins followed by successful login",
        evidence={"failed_count": 5},
        recommended_action="Isolate account"
    )
    assessment = risk_scorer.assess_risk(
        rule_matches=[rule_match],
        ml_prediction={"anomaly_score": 85.0, "predicted_attack": "BRUTE_FORCE", "confidence": 0.92},
        event_severity="CRITICAL",
        affected_users_count=2,
        frequency_count=12
    )
    assert assessment.risk_score >= 80.0
    assert assessment.severity == "CRITICAL"
    assert any("Detection Rule Triggered" in r for r in assessment.reasons)
    assert any("ML Anomaly Score" in r for r in assessment.reasons)

def test_risk_scorer_factors_transparency():
    assessment = risk_scorer.assess_risk(
        rule_matches=[],
        ml_prediction={"anomaly_score": 70.0, "predicted_attack": "PORT_SCAN", "confidence": 0.80},
        event_severity="HIGH"
    )
    assert "rule_component" in assessment.factors
    assert "ml_anomaly_component" in assessment.factors
    assert "classifier_component" in assessment.factors
