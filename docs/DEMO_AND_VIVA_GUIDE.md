# AI-Based Intrusion Detection System: Academic Viva & Demonstration Guide

## 1. Quick Presentation Pitch (1-Minute Summary)

> *"Good morning, esteemed examiners and professors. Our project is an **AI-Based Intrusion Detection System & Security Analytics Platform (AI-IDS)**.
> 
> Modern networks produce millions of heterogeneous logs every day from Linux servers, web proxies, and Windows domains. Traditional rule-only systems suffer from severe alert fatigue and cannot catch zero-day attacks, while purely black-box deep learning models lack explainability.
> 
> To solve this, our project implements a **Dual-Engine Mini-SOC Architecture**:
> 1. It normalizes multi-format logs without destroying the original raw text.
> 2. It runs a dual detection engine: 8 transparent deterministic heuristic rules combined with an unsupervised **Isolation Forest** anomaly detector and supervised **Random Forest** classification.
> 3. It computes an explainable multi-factor 0–100 risk score and correlates sequential alerts into multi-stage attack campaigns.
> 4. Everything updates in real-time over WebSockets on a high-contrast Obsidian Black & Electric Yellow dashboard, complete with 1-click publication-ready PDF incident audit reports."*

---

## 2. Step-by-Step Live Demonstration Protocol

### Step 1: Login & SOC Command Center Overview
1. Open **[http://localhost:8000](http://localhost:8000)** (or the live public subdomain: **[https://mas-agree-instructions-moderators.trycloudflare.com](https://mas-agree-instructions-moderators.trycloudflare.com)**).
2. Login with credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Point out to the examiner:
   - The **24x7 Real-Time Telemetry Status** in the Navbar (green pulsing LED showing active WebSocket stream).
   - The **KPI Overview Tiles**: Total Logs Processed, Active Intercepted Alerts, Correlated Incidents, and Mean Risk Score.
   - The **Real-Time Threat Velocity Area Chart**: Electric yellow time-series telemetry showing alert spikes over time.
   - The **Live Threat Intercept Queue**: Instant triage view with severity badges.

### Step 2: 1-Click Synthetic Attack Simulation
1. Click the bright yellow **`RUN SIMULATION`** button in the top navigation bar.
2. Observe the instant response:
   - The backend runs a synthetic Advanced Persistent Threat (APT) scenario.
   - An amber/yellow **Threat Intercepted Toast** pops up in the bottom-right corner.
   - KPI counters increment immediately via the WebSocket stream without refreshing the browser.

### Step 3: Log Ingestion & 1-Click Attack Datasets
1. Navigate to **Events Explorer** (`/events`).
2. Click the yellow **`Ingest Logs / Upload`** button.
3. Show the examiner the **⚡ Ready-to-Test Attack Datasets (1-Click Load)** panel:
   - Click **`SSH Authentication Brute Force`** $\rightarrow$ Instantly loads 10 real-world failed auth attempts.
   - Click **`Ingest & Analyze`**.
   - Show how the system parses the log lines, detects the attack, extracts the attacking IP (`203.0.113.55`), and raises an alert.
4. (Optional) Show the download icon allowing raw `.log` and `.csv` files to be saved directly to the evaluator's computer.

### Step 4: Investigating an Alert & Explainable AI (XAI)
1. Go to **Alerts Queue** (`/alerts`) and click on the newly triggered alert.
2. Point out the **Forensic Grounding Layer**:
   - **What Happened?**: Plain English summary of the attack.
   - **Why Was This Suspicious?**: Mathematical and heuristic rationale.
   - **Supporting Telemetry Evidence**: Specific log line references and timestamp sequences.
   - **Composite Risk Meter**: Clear 0–100 score detailing causal factors.
3. Update the alert status to `INVESTIGATING` or `RESOLVED` with an analyst note.

### Step 5: Incident Campaigns & Correlated Attack Chains
1. Navigate to **Incident Hub** (`/incidents`).
2. Show how individual alerts from the same IP or targeting the same user are clustered into an overarching **Security Incident**.
3. Open an incident to view the correlated sequence of events (e.g., initial port scan $\rightarrow$ brute-force $\rightarrow$ privilege escalation).

### Step 6: 1-Click Executive PDF Audit Report
1. Click **`Download Incident PDF`** on the incident page (or navigate to `/reports`).
2. Open the downloaded PDF document.
3. Show the examiner the formal, publication-ready dossier:
   - Executive threat assessment
   - Incident timeline and attack progression
   - Offending IP and targeted assets
   - Recommended SOC remediation steps

### Step 7: Defense & Machine Learning Benchmarks
1. Navigate to **Detection Rules** (`/rules`):
   - Show the 8 configurable heuristics, thresholds, and sliding time windows.
   - Demonstrate toggling rules or adjusting threshold values.
2. Navigate to **ML Models & Matrix** (`/models`):
   - Show the **Confusion Matrix** comparing true vs. predicted classifications.
   - Show the benchmark metrics: Precision, Recall, F1-Score, and ROC-AUC.
   - Demonstrate the **Retrain Isolation Forest** button.

---

## 3. Top 10 Viva Questions & Winning Answers

#### Q1: What dataset did you use, and how did you train your models?
> **Answer**: We utilized flow-based network traffic data from the benchmark **CIC-IDS2017** dataset provided by the Canadian Institute for Cybersecurity, containing over 78 numeric network flow features (Flow Duration, Packet Rates, Flag Counts, IAT distributions). The data was pre-processed by removing infinite/NaN values, standardizing via `StandardScaler`, and evaluated across stratified train/test splits.

#### Q2: Why use both rules and machine learning (Dual-Engine)?
> **Answer**: Deterministic rules provide deterministic zero-latency detection for known attacks (like brute-force thresholds and port scans) with 0% false positives for defined patterns. Machine learning (specifically Isolation Forest) provides unsupervised anomaly detection capable of flagging zero-day behavioral deviations where no prior signature exists. Combining both gives defense-in-depth.

#### Q3: How do you prevent data leakage during model training?
> **Answer**: We strictly separate identifier fields (`source_ip`, `destination_ip`, `ports`, `timestamps`) from model feature inputs. Only scale-invariant numerical flow attributes (inter-arrival times, packet sizes, flag counts) are provided to the model. Furthermore, all feature scalers are fitted exclusively on training splits before transforming test sets.

#### Q4: How is your composite risk score calculated?
> **Answer**: Rather than picking an arbitrary number, we compute a weighted sum:
> $$\text{Risk} = \min(100, (0.50 \cdot S_{\text{rule}} + 0.35 \cdot S_{\text{ML}} + 0.15 \cdot S_{\text{hist}}) \times M_{\text{sev}})$$
> where deterministic rule score has 50% weight, ML anomaly score 35%, and historical entity reputation 15%, scaled by a severity multiplier.

#### Q5: What is the difference between an Alert and an Incident in your system?
> **Answer**: An **Alert** is a discrete security signal triggered by a single event or tight time window (e.g., a burst of failed logins). An **Incident** is an aggregated attack campaign that groups multiple correlated alerts sharing the same threat actor or target asset across an extended 30-minute window.

#### Q6: How does your system operate 24x7?
> **Answer**: The backend runs an asynchronous background daemon service (`LiveMonitorService`) initialized at FastAPI startup. It continuously generates realistic baseline system and network telemetry, inspects event buffers, checks sliding time windows, and evaluates rules 24 hours a day, 7 days a week.

#### Q7: Does your system modify or destroy the original raw logs?
> **Answer**: No. We follow a strict **Dual-Storage** architecture. When a log is ingested, the exact original raw line is stored immutably in the `raw_logs` database table. A separate foreign-key relationship links it to the `normalized_events` table. This ensures full forensic non-repudiation for legal and compliance audits.

#### Q8: How does the real-time communication work without page reloads?
> **Answer**: We use persistent bidirectional **WebSockets** (`/ws/alerts`). The FastAPI server maintains a thread-safe connection pool. When the detection pipeline registers a new alert, it broadcasts a lightweight JSON payload to all connected clients within milliseconds.

#### Q9: What technology stack did you use and why?
> **Answer**: 
> - **Backend**: Python 3.11 with **FastAPI** for asynchronous high-throughput REST APIs and WebSockets.
> - **Machine Learning**: **Scikit-Learn** for Isolation Forest and Random Forest algorithms.
> - **Database**: **SQLAlchemy ORM** with SQLite for local development and PostgreSQL compatibility.
> - **Frontend**: **React 19** with **Vite** and **TailwindCSS** for a responsive, single-page application SOC dashboard.
> - **Reports**: **ReportLab** for automated PDF document generation.

#### Q10: How is the system hosted and accessible to remote users?
> **Answer**: The application is deployed with FastAPI serving the optimized React production bundle on port 8000, connected to a secure **Cloudflare Tunnel** (`cloudflared`) providing SSL encryption and public accessibility via a live subdomain without requiring router port-forwarding or public IP exposure.
