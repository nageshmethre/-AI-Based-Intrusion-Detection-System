import os
import numpy as np
import pandas as pd

def generate_synthetic_security_dataset(output_path: str = "ml/data/security_events_dataset.csv", n_samples: int = 12000, random_seed: int = 42):
    """
    Generates a realistic, documented synthetic cybersecurity log dataset.
    
    NOTE ON DATASET PROVENANCE:
    This dataset is synthetically generated for demonstration, research, and evaluation of 
    SOC detection capabilities without exposing proprietary organizational telemetry. 
    It models real-world statistical attack profiles documented in MITRE ATT&CK patterns.
    """
    np.random.seed(random_seed)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    rows = []

    # 1. NORMAL ACTIVITY (~55%)
    n_normal = int(n_samples * 0.55)
    for _ in range(n_normal):
        hour = np.random.choice(range(8, 19), p=[0.05, 0.1, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05])
        is_wknd = 1 if np.random.rand() < 0.10 else 0
        succ = np.random.randint(1, 10)
        fail = np.random.choice([0, 1, 2], p=[0.85, 0.12, 0.03])
        total_l = succ + fail
        ratio = fail / total_l if total_l > 0 else 0.0
        req_min = np.random.randint(1, 25)
        ports = 1
        users = 1
        b_sent = np.random.randint(500, 50000)
        b_recv = np.random.randint(1000, 200000)
        interval = np.random.randint(15, 300)

        rows.append({
            "failed_login_count": fail,
            "successful_login_count": succ,
            "auth_failure_ratio": ratio,
            "requests_per_minute": req_min,
            "unique_ports_count": ports,
            "unique_users_count": users,
            "bytes_sent": b_sent,
            "bytes_received": b_recv,
            "login_hour": hour,
            "is_weekend": is_wknd,
            "is_off_hours": 0,
            "time_since_last_event_sec": interval,
            "label": "NORMAL"
        })

    # 2. BRUTE FORCE (~15%)
    n_brute = int(n_samples * 0.15)
    for _ in range(n_brute):
        hour = np.random.randint(0, 24)
        is_wknd = np.random.choice([0, 1])
        fail = np.random.randint(6, 60)
        succ = np.random.choice([0, 1], p=[0.90, 0.10])
        total_l = succ + fail
        ratio = fail / total_l
        req_min = np.random.randint(20, 120)
        ports = 1
        users = np.random.choice([1, 2, 3], p=[0.70, 0.20, 0.10])
        b_sent = np.random.randint(300, 15000)
        b_recv = np.random.randint(500, 10000)
        interval = np.random.randint(1, 8)

        rows.append({
            "failed_login_count": fail,
            "successful_login_count": succ,
            "auth_failure_ratio": ratio,
            "requests_per_minute": req_min,
            "unique_ports_count": ports,
            "unique_users_count": users,
            "bytes_sent": b_sent,
            "bytes_received": b_recv,
            "login_hour": hour,
            "is_weekend": is_wknd,
            "is_off_hours": 1 if (hour >= 23 or hour < 5) else 0,
            "time_since_last_event_sec": interval,
            "label": "BRUTE_FORCE"
        })

    # 3. PORT SCAN (~10%)
    n_scan = int(n_samples * 0.10)
    for _ in range(n_scan):
        hour = np.random.randint(0, 24)
        is_wknd = np.random.choice([0, 1])
        fail = 0
        succ = 0
        ratio = 0.0
        req_min = np.random.randint(40, 300)
        ports = np.random.randint(8, 120)
        users = 0
        b_sent = np.random.randint(100, 5000)
        b_recv = np.random.randint(50, 2000)
        interval = np.random.randint(1, 5)

        rows.append({
            "failed_login_count": fail,
            "successful_login_count": succ,
            "auth_failure_ratio": ratio,
            "requests_per_minute": req_min,
            "unique_ports_count": ports,
            "unique_users_count": users,
            "bytes_sent": b_sent,
            "bytes_received": b_recv,
            "login_hour": hour,
            "is_weekend": is_wknd,
            "is_off_hours": 1 if (hour >= 23 or hour < 5) else 0,
            "time_since_last_event_sec": interval,
            "label": "PORT_SCAN"
        })

    # 4. DOS / EXCESSIVE REQUESTS (~10%)
    n_dos = int(n_samples * 0.10)
    for _ in range(n_dos):
        hour = np.random.randint(0, 24)
        is_wknd = np.random.choice([0, 1])
        fail = 0
        succ = 0
        ratio = 0.0
        req_min = np.random.randint(150, 1800)
        ports = 1
        users = 0
        b_sent = np.random.randint(10000, 500000)
        b_recv = np.random.randint(5000, 200000)
        interval = 0

        rows.append({
            "failed_login_count": fail,
            "successful_login_count": succ,
            "auth_failure_ratio": ratio,
            "requests_per_minute": req_min,
            "unique_ports_count": ports,
            "unique_users_count": users,
            "bytes_sent": b_sent,
            "bytes_received": b_recv,
            "login_hour": hour,
            "is_weekend": is_wknd,
            "is_off_hours": 1 if (hour >= 23 or hour < 5) else 0,
            "time_since_last_event_sec": interval,
            "label": "DOS"
        })

    # 5. SUSPICIOUS LOGIN (~5%)
    n_sus_login = int(n_samples * 0.05)
    for _ in range(n_sus_login):
        hour = np.random.choice([23, 0, 1, 2, 3, 4])
        is_wknd = np.random.choice([0, 1])
        fail = np.random.randint(3, 8)
        succ = 1
        total_l = fail + succ
        ratio = fail / total_l
        req_min = np.random.randint(5, 25)
        ports = 1
        users = np.random.choice([1, 2])
        b_sent = np.random.randint(2000, 25000)
        b_recv = np.random.randint(3000, 40000)
        interval = np.random.randint(10, 60)

        rows.append({
            "failed_login_count": fail,
            "successful_login_count": succ,
            "auth_failure_ratio": ratio,
            "requests_per_minute": req_min,
            "unique_ports_count": ports,
            "unique_users_count": users,
            "bytes_sent": b_sent,
            "bytes_received": b_recv,
            "login_hour": hour,
            "is_weekend": is_wknd,
            "is_off_hours": 1,
            "time_since_last_event_sec": interval,
            "label": "SUSPICIOUS_LOGIN"
        })

    # 6. DATA EXFILTRATION (~5%)
    n_exfil = int(n_samples * 0.05)
    for _ in range(n_exfil):
        hour = np.random.choice([22, 23, 1, 2, 3])
        is_wknd = np.random.choice([0, 1])
        fail = 0
        succ = 1
        ratio = 0.0
        req_min = np.random.randint(10, 50)
        ports = 1
        users = 1
        b_sent = int(np.random.uniform(15 * 1024 * 1024, 75 * 1024 * 1024)) # 15MB - 75MB
        b_recv = np.random.randint(500, 10000)
        interval = np.random.randint(2, 30)

        rows.append({
            "failed_login_count": fail,
            "successful_login_count": succ,
            "auth_failure_ratio": ratio,
            "requests_per_minute": req_min,
            "unique_ports_count": ports,
            "unique_users_count": users,
            "bytes_sent": b_sent,
            "bytes_received": b_recv,
            "login_hour": hour,
            "is_weekend": is_wknd,
            "is_off_hours": 1,
            "time_since_last_event_sec": interval,
            "label": "DATA_EXFILTRATION"
        })

    df = pd.DataFrame(rows)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    df.to_csv(output_path, index=False)
    print(f"[+] Synthetic security dataset generated: {len(df)} samples saved to {output_path}")
    print(f"[*] Class breakdown:\n{df['label'].value_counts()}")
    return df

if __name__ == "__main__":
    generate_synthetic_security_dataset()
