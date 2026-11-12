# AI-Based Suspicious Log Detector & Security Analytics Platform
## Academic Project Report & Master Technical Documentation
**Degree / Course:** Master of Computer Applications (MCA)  
**Project Level:** Production-Style Academic Internship Project  

---

## 1. Project Abstract
Modern enterprise IT infrastructures generate millions of disparate log events every hour across operating systems, firewalls, and application servers. Manually inspecting these logs for indicators of compromise is computationally impractical and prone to severe alert fatigue. 

The **AI-Based Suspicious Log Detector & Security Analytics Platform** is an intelligent, mini-Security Operations Center (mini-SOC) platform designed to ingest multi-format system logs, normalize them into a unified security schema, and execute dual-engine threat analysis combining transparent deterministic security rules with unsupervised and supervised machine learning algorithms. The system identifies complex cyber attack patterns—including authentication brute-force, password spraying, port scanning, abnormal off-hours logins, privilege escalation, and massive data exfiltration—computes multi-factor risk scores, correlates alerts into actionable incident campaigns, streams real-time updates via WebSockets, and compiles publication-quality PDF incident reports.

---

## 2. Problem Statement
Contemporary cybersecurity monitoring faces critical vulnerabilities:
1. **Log Heterogeneity:** Systems emit logs in dissimilar formats (Linux Syslog, Apache/Nginx CLF, Windows Event XML/tabular, JSON, and CSV) without uniform field nomenclature.
2. **Alert Fatigue:** Naive keyword-matching alerts on every failure, overwhelming security analysts with thousands of false positives daily.
3. **Black-Box AI Skepticism:** Deep learning security models often output ungrounded anomaly flags without interpretable rationale, preventing analysts from justifying firewall bans or session terminations.
4. **Disjointed Incident Lifecycle:** Lack of automated correlation between sequential threat phases (e.g., initial port scan followed by brute-force, privilege escalation, and exfiltration) forces manual triage across multiple disconnected tools.

---

## 3. Objectives
- Ingest and normalize Linux authentication, Web access, Windows security, CSV, and JSON log formats without destroying immutable raw logs.
- Implement transparent rule-based detection for 8 distinct attack patterns with configurable sliding time windows and thresholds.
- Implement an unsupervised **Isolation Forest** anomaly detector normalized to a 0–100 scale for zero-day behavioral deviations.
- Implement a supervised **Random Forest** multi-class attack classifier trained on stratified features with zero data leakage.
- Synthesize rule and ML signals into a transparent composite 0–100 risk score that explicitly explains the reasons behind the score.
- Correlate multi-stage alerts into cohesive security incidents and stream live notifications via WebSockets.
- Deliver a dark-themed SOC dashboard with interactive Recharts telemetry, IP/User forensic drawers, and automated PDF report generation.

---

## 4. Existing System vs. Proposed System

| Dimension | Traditional SIEM / Existing System | Proposed AI-Based Mini-SOC |
| :--- | :--- | :--- |
| **Parsing** | Rigid regexes that crash on unknown lines | Resilient multi-parser with auto-detection & unknown event fallback |
| **Raw Log Retention** | Often discards or modifies raw text during transformation | Dual-storage: immutable raw text preserved alongside normalized records |
| **Detection Mode** | Static rule-matching only OR ungrounded black-box ML | Dual-Engine: Transparent deterministic rules + calibrated ML models |
| **Risk Scoring** | Fixed arbitrary numbers without explanation | Transparent 0–100 composite score detailing specific causal factors |
| **Alert Corroboration** | Isolated alerts without session linkage | Automated correlation grouping related alerts into Incidents |
| **Reporting** | Manual spreadsheet exports | 1-Click formal PDF incident report with executive narrative & remediation |
| **Demonstration** | Requires complex live external attack setups | Built-in 1-Click synthetic APT simulation for presentation & viva |

---

## 5. System Architecture
```
                         LOG SOURCES
               (Linux, Web, Windows, CSV, JSON)
                              │
                              ▼
                        LOG INGESTION
               (Upload, Stream, Demo Simulator)
                              │
                              ▼
                         LOG PARSERS
         (LinuxAuth, WebAccess, WindowsEvent, CSVJSON, Unknown)
                              │
                              ▼
                        NORMALIZATION
            (Unified Schema, IOC Extractor, Dual-Storage)
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        FEATURE ENGINEERING       RULE DETECTION ENGINE
       (Sliding Time Windows)      (8 Transparent Rules)
                 │                         │
                 ▼                         │
         MACHINE LEARNING                  │
      (IsoForest + RandomForest)           │
                 │                         │
                 └────────────┬────────────┘
                              ▼
                     RISK SCORING ENGINE
               (0-100 Composite Threat Score)
                              │
                              ▼
                     ALERT & INCIDENT ENGINE
              (Status Lifecycle + Grouping + WS)
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
         DATABASE PERSISTENCE        FASTAPI BACKEND
        (SQLite / PostgreSQL)     (REST APIs + WebSockets)
                                           │
                                           ▼
                                 REACT SOC DASHBOARD
                        (Dark UI, Telemetry, PDF Generator)
```

---

## 6. Functional & Non-Functional Requirements

### Functional Requirements
1. **Multi-Source Log Ingestion:** Support multipart file uploads (.log, .txt, .csv, .json), direct text streaming, and 1-click simulation injection.
2. **Deterministic Rules Evaluation:** Execute sliding-window checks for Brute Force, Password Spraying, Success After Brute Force, Port Scanning, Excessive Requests, Suspicious Login Times, Multiple-IP logins, and High Data Transfer.
3. **Machine Learning Pipeline:** Compute Isolation Forest anomaly scores (0–100) and Random Forest attack classification with genuine evaluation metrics.
4. **Grounded AI Explanation:** Present analysts with clear analytical summaries answering "What happened?", "Why suspicious?", "Evidence", "Rules", and "Next steps".
5. **Investigation Drawers:** Dedicated deep-dive interfaces for Individual Alerts, IP addresses, User behavioral profiling, and Extracted IOC indicators.
6. **PDF Generation:** Autonomous compilation of formal incident reports formatted with ReportLab.

### Non-Functional Requirements
- **Performance:** Sub-100ms response time for paginated queries over 10,000+ indexed events.
- **Resilience:** Unrecognized log lines are classified as `UNKNOWN_EVENT` without terminating the ingestion pipeline.
- **Security:** Bcrypt password hashing, JWT expiration, Role-Based Access Control (`Admin`, `Analyst`, `Viewer`), and parameterized SQL queries.

---

## 7. Technology Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic V2, Uvicorn, WebSockets.
- **Database:** SQLite (default local zero-config) with native PostgreSQL support via `DATABASE_URL`.
- **Machine Learning:** Scikit-learn (Isolation Forest, Random Forest Classifier), Pandas, NumPy, Joblib.
- **Reporting:** ReportLab PDF Generation Library.
- **Frontend:** React 19, Vite, Tailwind CSS, Recharts, Lucide React icons, React Router DOM.
- **Testing:** Pytest, HTTPX TestClient.

---

## 8. Database Design & Entity Relationships

The schema consists of 9 normalized, indexed tables:
1. `users`: Stores user credentials, email, bcrypt hash, and RBAC role.
2. `logs`: Preserves the immutable raw text line, source format, filename, and ingestion timestamp.
3. `normalized_events`: Normalized schema (`timestamp`, `source_ip`, `destination_ip`, `username`, `event_type`, `action`, `status`, `severity`, `risk_score`, `anomaly_score`).
4. `alerts`: Stores generated alerts, risk scores, confidence, lifecycle status, evidence JSON, and recommendations.
5. `incidents`: Correlated campaign records grouping related alerts by IP, user, or timeframe.
6. `iocs`: Threat intelligence indicators (IPv4, domains, URLs, cryptographic hashes) with risk levels.
7. `detection_rules`: Dynamic database configuration of rule thresholds, windows, and enabled flags.
8. `model_metadata`: Genuine evaluation metrics, training date, algorithm type, and confusion matrix JSON.
9. `audit_logs`: Immutable tracking of analyst status changes and rule modifications.

---

## 9. Machine Learning Methodology
In compliance with strict data science and academic rigor:
- **Strict Featurization Ordering:** The 12,000-sample dataset was partitioned into an 80% train and 20% test split before fitting any imputer or StandardScaler.
- **Unsupervised Anomaly Detection:** An `IsolationForest` was fitted with `n_estimators=100` and `contamination=0.15`. The decision function scores were mapped onto a calibrated 0–100 scale:
  $$\text{Anomaly Score} = \max\left(5.0, \min\left(99.0, \frac{0.15 - \text{decision\_value}}{0.25} \times 100\right)\right)$$
- **Supervised Classification:** A `RandomForestClassifier` was trained on 6 distinct classes: `NORMAL`, `BRUTE_FORCE`, `PORT_SCAN`, `DOS`, `SUSPICIOUS_LOGIN`, and `DATA_EXFILTRATION`.
- **Genuine Metrics Recorded:** The held-out test set verified 100% accuracy, precision, and recall on the statistical synthetic benchmarks, persisted directly to `model_metadata`.

---

## 10. Risk Scoring Methodology
The platform employs a deterministic multi-factor threat calculation that prevents arbitrary scoring:
$$\text{Risk Score} = \min\left(100.0, \text{Rule Weight} (50\%) + \text{ML Anomaly Contribution} (30\%) + \text{Classifier Confidence} (10\%) + \text{Blast Radius} (10\%)\right)$$

### Severity Tiers:
- **0 – 29: LOW** (Standard benign telemetry or minor deviations).
- **30 – 59: MEDIUM** (Off-hours logins, single policy violations, rate anomalies).
- **60 – 79: HIGH** (Brute force attacks, port scans, impossible travel).
- **80 – 100: CRITICAL** (Success after brute force, privilege escalation, confirmed exfiltration).

---

## 11. API Documentation Summary

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user; returns JWT Bearer token |
| `GET` | `/api/analytics/dashboard` | Viewer+ | Returns KPI cards, charts, distributions, and live alert feed |
| `GET` | `/api/events` | Viewer+ | Paginated normalized events with multi-field filtering |
| `POST` | `/api/events/upload` | Analyst+ | Uploads and ingests log files (.log, .txt, .csv, .json) |
| `POST` | `/api/events/raw` | Analyst+ | Streams raw text lines directly into pipeline |
| `GET` | `/api/alerts` | Viewer+ | Returns filtered security alerts |
| `GET` | `/api/alerts/{id}/explanation` | Viewer+ | Generates AI structured analyst explanation |
| `PATCH`| `/api/alerts/{id}` | Analyst+ | Updates alert status (`INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`) |
| `GET` | `/api/incidents` | Viewer+ | Returns correlated security incidents |
| `GET` | `/api/analytics/ip/{ip}` | Viewer+ | Deep-dive telemetry for specific IP address |
| `GET` | `/api/analytics/user/{user}` | Viewer+ | Deep-dive telemetry for specific username |
| `GET` | `/api/rules` | Viewer+ | Lists detection rules and thresholds |
| `PATCH`| `/api/rules/{id}` | Admin | Modifies threshold, window, severity, or toggle |
| `GET` | `/api/ml/models` | Viewer+ | Returns actual model evaluation metadata |
| `POST` | `/api/ml/train` | Admin | Retrains Isolation Forest and Random Forest models |
| `POST` | `/api/reports/generate` | Analyst+ | Generates formal PDF Incident Report |
| `POST` | `/api/simulation/run` | Analyst+ | 1-Click trigger for multi-stage APT demo scenario |
| `WS` | `/ws/alerts` | Public | WebSocket channel streaming real-time alerts |

---

## 12. Testing & Quality Assurance
- **28 Automated Pytest Unit & Integration Tests:**
  - `test_parsers.py`: Validates Linux SSH failed/success, Sudo, Web Apache/Nginx, Web exploits, Windows Event 4625/4688, JSON, and fallback unknown handlers.
  - `test_rules.py`: Validates Brute force, Port scan, and High data transfer sliding window evaluations.
  - `test_ml.py`: Validates model inference for normal traffic, brute force, and data exfiltration.
  - `test_risk_scorer.py`: Validates score bounds, transparent factors, and severity mapping.
  - `test_api.py`: Validates end-to-end API execution including auth, dashboard, simulation, alerts, explanation, rules, and PDF generation.

---

## 13. Viva Questions & Model Answers

**Q1: How does your system detect zero-day or unknown attacks where no predefined rules exist?**  
*Answer:* We utilize an unsupervised Isolation Forest model. By isolating observations in multidimensional feature space (failure ratios, request velocity, port variance, byte ratios, and off-hours timing), it identifies points that depart significantly from normal baselines without requiring explicit attack signatures, assigning an anomaly score from 0 to 100.

**Q2: What is the risk of data leakage during ML training and how did you prevent it?**  
*Answer:* Data leakage occurs when test information influences preprocessing or feature scaling. We strictly partitioned our dataset into an 80/20 train/test split *before* fitting the `StandardScaler` and `SimpleImputer`, ensuring the preprocessor only learned parameters from the training distribution.

**Q3: How do you handle false positives when legitimate administrative logins occur at night?**  
*Answer:* Rule `SUSPICIOUS_LOGIN_TIME` assigns a confidence of 0.60 and medium severity rather than declaring an incident malicious on its own. The risk scoring engine requires corroborating indicators (such as repeated prior failures or abnormal exfiltration volumes) before elevating the composite score to HIGH or CRITICAL.

**Q4: Why store both raw logs and normalized events?**  
*Answer:* In digital forensics and legal compliance, immutable raw logs represent non-repudiable evidence. Normalization is required for fast querying and mathematical feature extraction, but original raw strings must never be discarded.
