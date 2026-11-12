import pytest
from ml.predict import ml_predictor

def test_normal_traffic_prediction():
    features = {
        "failed_login_count": 0,
        "successful_login_count": 5,
        "requests_per_minute": 10,
        "unique_ports_count": 1,
        "bytes_sent": 1500,
        "bytes_received": 5000,
        "login_hour": 14,
        "is_weekend": 0,
        "is_off_hours": 0
    }
    result = ml_predictor.predict(features)
    assert result["predicted_attack"] == "NORMAL"
    assert result["anomaly_score"] < 40.0
    assert result["is_anomaly"] is False

def test_brute_force_prediction():
    features = {
        "failed_login_count": 30,
        "successful_login_count": 0,
        "auth_failure_ratio": 1.0,
        "requests_per_minute": 50,
        "unique_ports_count": 1,
        "time_since_last_event_sec": 2
    }
    result = ml_predictor.predict(features)
    assert result["predicted_attack"] == "BRUTE_FORCE"
    assert result["anomaly_score"] >= 60.0
    assert result["is_anomaly"] is True

def test_data_exfiltration_prediction():
    features = {
        "failed_login_count": 0,
        "successful_login_count": 1,
        "requests_per_minute": 20,
        "unique_ports_count": 1,
        "bytes_sent": 45 * 1024 * 1024, # 45 MB
        "bytes_received": 2000,
        "is_off_hours": 1
    }
    result = ml_predictor.predict(features)
    assert result["predicted_attack"] == "DATA_EXFILTRATION"
    assert result["anomaly_score"] >= 60.0
