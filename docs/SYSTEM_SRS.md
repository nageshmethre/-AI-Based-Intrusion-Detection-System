# Software Requirements Specification (SRS) & System Analysis
## AI-Based Intrusion Detection System & Security Analytics Platform

**Course / Project**: 3rd Semester MCA Minor Project  
**Domain**: Cyber Security, Machine Learning, Security Operations Center (SIEM)  
**Authors**: Nandini Pandey & Nagesh  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional, non-functional, behavioral, and architectural requirements for the **AI-Based Intrusion Detection System & Security Analytics Platform (AI-IDS)**. The platform ingests multi-source system and network security logs, normalizes them into a unified schema, performs dual-engine deterministic heuristic and machine learning threat detection, scores composite risk, and visualizes incidents on a modern SOC dashboard.

### 1.2 Scope
* **Intended Users**: Security Operations Center (SOC) analysts, network administrators, IT security engineers, and academic evaluators.
* **Core Capabilities**:
  - Ingestion of Linux Syslog/Auth, Apache/Nginx web access, Windows Security Audits, and CIC-IDS2017 network flow CSV datasets.
  - Multi-tier detection engine combining 8 transparent heuristic rules with unsupervised Isolation Forest anomaly detection and supervised Random Forest classification.
  - Sub-second alert dispatch over persistent WebSockets.
  - Automated correlation grouping sequential alerts into persistent incident campaigns.
  - Publication-grade PDF incident report generation.
* **Out of Scope**: Direct active automated firewall rule deletion on live production networks without analyst authorization (the platform operates as an automated IDS with recommended response plans rather than an inline IPS).

---

## 2. Overall Description

### 2.1 Product Perspective
The AI-IDS functions as an autonomous mini-SIEM / mini-SOC suite. It provides a complete end-to-end telemetry pipeline:
$$\text{Data Sources} \longrightarrow \text{Ingestion \& Normalizer} \longrightarrow \text{Dual-Engine Brain} \longrightarrow \text{Alerting \& Incident Hub} \longrightarrow \text{SOC Dashboard}$$

### 2.2 User Classes & Roles
1. **Security Analyst (Tier 1 & Tier 2)**:
   - Investigates incoming alerts and incident campaigns.
   - Inspects normalized events and raw immutable logs.
   - Updates alert lifecycle states (`INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`).
   - Generates and downloads PDF incident audit reports.
2. **SOC Administrator**:
   - Manages and fine-tunes detection rules (thresholds and sliding time windows).
   - Manages user accounts and role-based access control (RBAC).
   - Retrains machine learning models and reviews confusion matrices.
3. **Auditor / Evaluator**:
   - Views high-level executive security metrics, KPI trends, and exported compliance dossiers.

---

## 3. Functional Requirements (FR)

### FR1: Multi-Format Log Ingestion
* **FR1.1**: The system shall accept multipart file uploads in `.log`, `.txt`, `.csv`, and `.json` formats up to 25 MB per file.
* **FR1.2**: The system shall accept direct raw text stream inputs pasted via the web UI.
* **FR1.3**: The system shall preserve original raw log text in the `raw_logs` table without alteration.

### FR2: Automated Format Detection & Parsing
* **FR2.1**: The system shall automatically detect log formats using signature regex matching.
* **FR2.2**: The system shall normalize parsed fields into a unified `NormalizedEvent` schema (timestamp, source IP, destination IP, ports, user, action, status, protocol, bytes).
* **FR2.3**: Unrecognized log lines shall be preserved via the `UnknownEventParser` without dropping data.

### FR3: Deterministic Rule Detection Engine
* **FR3.1**: The system shall evaluate 8 deterministic sliding-window heuristic security rules:
  1. `BRUTE_FORCE`: $\ge 5$ failed logins within 5 minutes from one IP.
  2. `PASSWORD_SPRAYING`: $\ge 3$ distinct usernames probed within 5 minutes from one IP.
  3. `SUCCESS_AFTER_BRUTE_FORCE`: $\ge 3$ failed logins followed by a successful login within 10 minutes.
  4. `PORT_SCAN`: $\ge 5$ distinct destination ports probed within 2 minutes.
  5. `EXCESSIVE_REQUESTS`: $\ge 30$ HTTP requests within 1 minute.
  6. `SUSPICIOUS_LOGIN_TIMES`: Logins occurring between 23:00 and 05:00 local time.
  7. `MULTIPLE_IP_LOGINS`: $\ge 2$ distinct IP addresses authenticating one user within 15 minutes.
  8. `HIGH_DATA_TRANSFER`: $\ge 10$ MB transferred in a single session.
* **FR3.2**: Administrators shall be able to update rule thresholds, windows, and severity ratings dynamically.

### FR4: Machine Learning Anomaly Detection
* **FR4.1**: The system shall deploy an unsupervised **Isolation Forest** model to compute multidimensional anomaly scores on network flow vectors.
* **FR4.2**: The model shall normalize raw decision scores to a transparent 0–100 scale.
* **FR4.3**: The system shall benchmark supervised classifiers (**Random Forest**, **Logistic Regression**) on stratified CIC-IDS2017 splits.

### FR5: Composite Multi-Factor Risk Scoring
* **FR5.1**: Every security alert shall receive a deterministic composite risk score:
  $$\text{Risk} = \min(100, (0.50 \cdot S_{\text{rule}} + 0.35 \cdot S_{\text{ML}} + 0.15 \cdot S_{\text{hist}}) \times M_{\text{sev}})$$
* **FR5.2**: The system shall provide an explicit breakdown of the factors contributing to the score.

### FR6: Incident Correlation & Campaign Clustering
* **FR6.1**: The system shall automatically group alerts sharing identical source IPs or usernames within 30 minutes into persistent Incidents.
* **FR6.2**: Incidents shall dynamically compute an aggregated risk score and maintain an alert count.

### FR7: Real-Time WebSocket Telemetry
* **FR7.1**: The system shall maintain bidirectional WebSocket connections (`/ws/alerts`).
* **FR7.2**: Intercepted alerts shall appear on client dashboards within 500 milliseconds of ingestion.

### FR8: Automated PDF Report Generation
* **FR8.1**: The system shall generate publication-ready PDF security dossiers using ReportLab.
* **FR8.2**: Reports shall include executive summaries, incident chronologies, evidence tables, and mitigation recommendations.

---

## 4. Non-Functional Requirements (NFR)

1. **Performance**: Ingestion and normalization latency shall not exceed 100 milliseconds for batches of up to 1,000 log lines.
2. **Reliability & Availability**: The system shall operate 24x7 with continuous background monitoring.
3. **Security & Data Integrity**: Passwords hashed using bcrypt; API endpoints protected via JWT Bearer authentication; original raw logs immutable.
4. **Usability**: Single Page Application (SPA) responsive across desktop and tablet viewports, adhering to WCAG AA contrast standards.

---

## 5. System Feasibility Analysis

* **Technical Feasibility**: High. Implemented using standard open-source tools (Python 3.11, FastAPI, React 19, TailwindCSS, Scikit-Learn, SQLite/PostgreSQL).
* **Economic Feasibility**: Zero licensing costs; uses public benchmarks (CIC-IDS2017) and open-source packages.
* **Operational Feasibility**: High. The intuitive web interface eliminates complex CLI operational overhead for analysts.
