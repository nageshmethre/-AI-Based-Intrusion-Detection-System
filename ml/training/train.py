import os
import sys

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest, RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from ml.features.feature_extractor import FEATURE_COLUMNS
from ml.preprocessing.pipeline import build_feature_pipeline
from ml.data.generate_dataset import generate_synthetic_security_dataset

def train_models(data_path: str = "ml/data/security_events_dataset.csv", models_dir: str = "ml/models"):
    """
    Trains and compares multiple classifiers as specified in the SRS:
    1. Random Forest (Ensemble baseline)
    2. Decision Tree (Interpretable baseline)
    3. Gradient Boosting / XGBoost style (Boosting baseline)
    4. Isolation Forest (Unsupervised Anomaly Detection)
    Adheres to strict featurization ordering by splitting data prior to fitting preprocessors.
    """
    if not os.path.exists(data_path):
        print(f"[*] Dataset not found at {data_path}. Generating synthetic dataset...")
        generate_synthetic_security_dataset(output_path=data_path)

    print(f"[*] Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)

    # Validate feature columns and handle any nulls
    X = df[FEATURE_COLUMNS].copy()
    y = df["label"].copy()

    # Encode target labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Strict ordering: Split data BEFORE fitting preprocessors
    print("[*] Performing 80/20 train/test split with stratification...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )

    # Fit preprocessor on training data ONLY
    print("[*] Fitting feature preprocessor pipeline on training data...")
    preprocessor = build_feature_pipeline()
    X_train_scaled = preprocessor.fit_transform(X_train)
    X_test_scaled = preprocessor.transform(X_test)

    # 1. Train Isolation Forest for Unsupervised Anomaly Detection
    print("[*] Training Isolation Forest anomaly detector...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.15,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train_scaled)

    # 2. Train Random Forest
    print("[*] Training Random Forest multi-class attack classifier...")
    rf_classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    rf_classifier.fit(X_train_scaled, y_train)

    # 3. Train Decision Tree
    print("[*] Training Decision Tree classifier...")
    dt_classifier = DecisionTreeClassifier(
        max_depth=10,
        random_state=42
    )
    dt_classifier.fit(X_train_scaled, y_train)

    # 4. Train Gradient Boosting (XGBoost baseline)
    print("[*] Training Gradient Boosting classifier...")
    gb_classifier = GradientBoostingClassifier(
        n_estimators=60,
        max_depth=5,
        random_state=42
    )
    gb_classifier.fit(X_train_scaled, y_train)

    # Save artifacts
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(preprocessor, os.path.join(models_dir, "preprocessor.joblib"))
    joblib.dump(iso_forest, os.path.join(models_dir, "isolation_forest.joblib"))
    joblib.dump(rf_classifier, os.path.join(models_dir, "attack_classifier.joblib"))
    joblib.dump(rf_classifier, os.path.join(models_dir, "attack_classifier_rf.joblib"))
    joblib.dump(dt_classifier, os.path.join(models_dir, "attack_classifier_dt.joblib"))
    joblib.dump(gb_classifier, os.path.join(models_dir, "attack_classifier_gb.joblib"))
    joblib.dump(le, os.path.join(models_dir, "label_encoder.joblib"))

    # Save test partition for independent evaluation
    test_df = X_test.copy()
    test_df["label"] = le.inverse_transform(y_test)
    test_df.to_csv("ml/data/test_set.csv", index=False)

    print(f"[+] Models successfully trained and serialized to {models_dir}/")
    print(f"[+] Test dataset saved to ml/data/test_set.csv ({len(test_df)} samples)")
    return {
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": list(le.classes_)
    }

if __name__ == "__main__":
    train_models()
