import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from ml.features.feature_extractor import extract_features_from_dict, FEATURE_COLUMNS

class MLSocPredictor:
    """Production ML inference engine for anomaly scoring and attack classification."""

    def __init__(self, models_dir: str = "ml/models"):
        self.models_dir = models_dir
        self.preprocessor = None
        self.iso_forest = None
        self.rf_classifier = None
        self.label_encoder = None
        self._load_models()

    def _load_models(self):
        try:
            prep_p = os.path.join(self.models_dir, "preprocessor.joblib")
            iso_p = os.path.join(self.models_dir, "isolation_forest.joblib")
            rf_p = os.path.join(self.models_dir, "attack_classifier.joblib")
            le_p = os.path.join(self.models_dir, "label_encoder.joblib")

            if all(os.path.exists(p) for p in [prep_p, iso_p, rf_p, le_p]):
                self.preprocessor = joblib.load(prep_p)
                self.iso_forest = joblib.load(iso_p)
                self.rf_classifier = joblib.load(rf_p)
                self.label_encoder = joblib.load(le_p)
                self.is_loaded = True
            else:
                self.is_loaded = False
        except Exception as e:
            print(f"[!] Error loading ML models: {e}")
            self.is_loaded = False

    def predict(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs feature extraction, Isolation Forest anomaly scoring, and Random Forest classification.
        Returns:
            - anomaly_score: float (0.0 - 100.0, higher = more anomalous)
            - is_anomaly: bool
            - predicted_attack: str
            - confidence: float (0.0 - 1.0)
        """
        if not self.is_loaded:
            # Fallback heuristic if models haven't been trained yet
            self._load_models()
            if not self.is_loaded:
                return self._fallback_prediction(feature_dict)

        # 1. Extract feature DataFrame
        df_features = extract_features_from_dict(feature_dict)
        X_scaled = self.preprocessor.transform(df_features)

        # 2. Isolation Forest Anomaly Scoring
        decision_val = float(self.iso_forest.decision_function(X_scaled)[0])
        # Calibrated mapping: decision_val ~ +0.15 (clean baseline) to <= -0.05 (severe outlier)
        raw_anomaly = ((0.15 - decision_val) / 0.25) * 100.0
        anomaly_score = max(5.0, min(99.0, round(raw_anomaly, 1)))

        # 3. Random Forest Attack Classification
        probs = self.rf_classifier.predict_proba(X_scaled)[0]
        max_idx = int(np.argmax(probs))
        confidence = round(float(probs[max_idx]), 3)
        predicted_attack = str(self.label_encoder.classes_[max_idx])

        # If probability is weak, mark as OTHER or NORMAL
        if confidence < 0.40:
            predicted_attack = "OTHER"

        # If classifier detects an active attack, ensure anomaly score reflects elevated threat
        if predicted_attack not in ("NORMAL", "OTHER") and confidence >= 0.35:
            anomaly_score = max(anomaly_score, min(95.0, round(50.0 + confidence * 40.0, 1)))

        is_anomaly = bool(anomaly_score >= 60.0 or self.iso_forest.predict(X_scaled)[0] == -1)

        return {
            "anomaly_score": anomaly_score,
            "is_anomaly": is_anomaly,
            "predicted_attack": predicted_attack,
            "confidence": confidence
        }

    def _fallback_prediction(self, d: Dict[str, Any]) -> Dict[str, Any]:
        fails = d.get("failed_login_count", 0)
        ports = d.get("unique_ports_count", 1)
        reqs = d.get("requests_per_minute", 0)
        
        score = min(fails * 12.0 + (ports - 1) * 8.0 + (reqs / 10.0), 95.0)
        attack = "NORMAL"
        if fails >= 5:
            attack = "BRUTE_FORCE"
        elif ports >= 5:
            attack = "PORT_SCAN"
        elif reqs >= 60:
            attack = "DOS"

        return {
            "anomaly_score": round(score, 1),
            "is_anomaly": score >= 60.0,
            "predicted_attack": attack,
            "confidence": 0.75
        }

ml_predictor = MLSocPredictor()
