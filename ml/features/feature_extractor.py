import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_COLUMNS = [
    "failed_login_count",
    "successful_login_count",
    "auth_failure_ratio",
    "requests_per_minute",
    "unique_ports_count",
    "unique_users_count",
    "bytes_sent",
    "bytes_received",
    "login_hour",
    "is_weekend",
    "is_off_hours",
    "time_since_last_event_sec"
]

def extract_features_from_dict(d: Dict[str, Any]) -> pd.DataFrame:
    """Extract and validate feature vector for inference from a raw/event dictionary."""
    row = {
        "failed_login_count": float(d.get("failed_login_count", 0)),
        "successful_login_count": float(d.get("successful_login_count", 0)),
        "auth_failure_ratio": float(d.get("auth_failure_ratio", 0.0)),
        "requests_per_minute": float(d.get("requests_per_minute", 0)),
        "unique_ports_count": float(d.get("unique_ports_count", 1)),
        "unique_users_count": float(d.get("unique_users_count", 1)),
        "bytes_sent": float(d.get("bytes_sent", 0)),
        "bytes_received": float(d.get("bytes_received", 0)),
        "login_hour": float(d.get("login_hour", 12)),
        "is_weekend": float(1 if d.get("is_weekend") else 0),
        "is_off_hours": float(1 if d.get("is_off_hours") else 0),
        "time_since_last_event_sec": float(d.get("time_since_last_event_sec", 60))
    }
    # Calculate failure ratio if not explicitly provided
    total_logins = row["failed_login_count"] + row["successful_login_count"]
    if total_logins > 0 and row["auth_failure_ratio"] == 0.0:
        row["auth_failure_ratio"] = row["failed_login_count"] / total_logins

    return pd.DataFrame([row])[FEATURE_COLUMNS]
