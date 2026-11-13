# AI-Based Intrusion Detection System: System Architecture

## 1. Architectural Vision & Core Principles

The **AI-Based Intrusion Detection System (AI-IDS)** is architected as a high-performance, real-time mini Security Operations Center (mini-SOC). It combines modern stream processing, dual-engine threat intelligence, real-time WebSocket communication, and responsive visualization.

### Core Architectural Principles:
1. **Zero Data Destruction (Dual-Storage)**: Immutable original raw logs are always preserved byte-for-byte in relational storage alongside structured normalized events.
2. **Deterministic + Probabilistic Fusion**: Deterministic heuristics provide instant, zero-latency detection of known threats, while unsupervised and supervised ML detect novel anomalies.
3. **Decoupled Asynchronous Processing**: File ingestion and synthetic attack simulations run without blocking dashboard UI interactions.
4. **Resilient Parsing**: The parsing pipeline gracefully falls back to an unknown format extractor rather than discarding malformed lines.
5. **Real-Time Push Model**: WebSocket broadcasting pushes alerts to connected SOC analysts with sub-second latency.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph DataSources["Data Sources & Log Ingestion"]
        L1["Linux Syslog / Auth.log"]
        L2["Web Access Logs (Nginx / Apache)"]
        L3["Windows Security Audits (4624, 4625, 4688)"]
        L4["Network Flow Datasets (CIC-IDS2017 CSV)"]
        L5["24x7 Real-Time Background Traffic Generator"]
    end

    subgraph IngestionLayer["Ingestion & Parsing Subsystem"]
        API_INGEST["FastAPI Ingestion Endpoints (/api/events/upload & /raw)"]
        PARSER_MGR["Log Parser Manager (Auto-Detection)"]
        PARSER_LINUX["Linux Auth Parser"]
        PARSER_WEB["Web Access CLF Parser"]
        PARSER_WIN["Windows Event Parser"]
        PARSER_CIC["CIC Flow CSV Parser"]
        PARSER_FALLBACK["Fallback Generic Parser"]
    end

    subgraph StorageLayer["Persistence & Database Layer (SQLite / PostgreSQL)"]
        DB_RAW["raw_logs Table (Immutable)"]
        DB_NORM["normalized_events Table"]
        DB_ALERTS["alerts Table"]
        DB_INCIDENTS["incidents Table"]
        DB_IOCS["iocs Table"]
        DB_RULES["detection_rules Table"]
    end

    subgraph DetectionLayer["Dual-Engine Threat Intelligence Brain"]
        RULE_ENGINE["Deterministic Heuristic Engine (8 Sliding-Window Rules)"]
        ML_ENGINE["Unsupervised Anomaly Engine (Isolation Forest)"]
        IOC_ENGINE["Automated Threat Intel IOC Extractor"]
        SCORER["Multi-Factor Risk Scorer (0-100 Score)"]
        CORRELATOR["Incident Campaign Correlation Engine"]
        EXPLAINER["Grounded AI Analytical Explainer"]
    end

    subgraph RealTimeLayer["Real-Time Dispatch Layer"]
        WS_MGR["WebSocket Connection Manager (/ws/alerts)"]
        EVENT_BUS["FastAPI Broadcast Queue"]
    end

    subgraph PresentationLayer["Frontend Presentation (React 19 + TailwindCSS)"]
        SPA["Vite Single Page Application"]
        DASH["SOC Command Dashboard"]
        STREAM["Live Event Stream Explorer"]
        TRIAGE["Alert Triage Queue"]
        INCIDENT_HUB["Incident Correlation Hub"]
        PDF_GEN["Publication-Ready PDF Audit Engine"]
    end

    DataSources --> API_INGEST
    API_INGEST --> PARSER_MGR
    PARSER_MGR --> PARSER_LINUX & PARSER_WEB & PARSER_WIN & PARSER_CIC & PARSER_FALLBACK
    PARSER_MGR --> DB_RAW
    PARSER_MGR --> DB_NORM

    DB_NORM --> RULE_ENGINE & ML_ENGINE & IOC_ENGINE
    RULE_ENGINE & ML_ENGINE --> SCORER
    SCORER --> CORRELATOR
    CORRELATOR --> EXPLAINER

    CORRELATOR --> DB_ALERTS & DB_INCIDENTS
    IOC_ENGINE --> DB_IOCS

    DB_ALERTS --> WS_MGR
    WS_MGR --> SPA
    SPA --> DASH & STREAM & TRIAGE & INCIDENT_HUB & PDF_GEN
```

---

## 3. Ingestion & Dual-Storage Architecture

When a log batch is received via multipart upload (`POST /api/events/upload`) or streaming paste (`POST /api/events/raw`):
1. **Raw Log Capture**: Each incoming line is assigned a unique identifier, timestamp, source filename, and line index, and committed to `raw_logs`.
2. **Format Auto-Detection**: The `LogParserManager` inspects the leading lines against regex signatures:
   - `sshd\[\d+\]` or `pam_unix` $\rightarrow$ `LinuxAuthParser`
   - Combined Log Format (CLF) $\rightarrow$ `WebAccessParser`
   - `Microsoft-Windows-Security-Auditing` or Event IDs `4624|4625|4688` $\rightarrow$ `WindowsEventParser`
   - Flow headers (`Destination Port, Flow Duration...`) $\rightarrow$ `CICFlowParser`
   - Generic JSON/CSV $\rightarrow$ `CSVJSONParser`
3. **Normalization**: The parsed fields are mapped into the `NormalizedEvent` data contract:
   - `timestamp` (UTC ISO-8601)
   - `source_ip` & `destination_ip` (IPv4 / IPv6)
   - `source_port` & `destination_port` (1–65535)
   - `username` / `identity`
   - `event_type` (`AUTH`, `WEB`, `NETWORK`, `SYSTEM`)
   - `action` (e.g., `SSH_LOGIN`, `HTTP_GET`, `PORT_PROBE`)
   - `status` (`SUCCESS`, `FAILURE`, `BLOCKED`)
   - `severity` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`)
   - `bytes_sent` & `bytes_received`

---

## 4. Database Schema & Entity Relationships

```mermaid
erDiagram
    RAW_LOGS ||--o{ NORMALIZED_EVENTS : "normalizes to"
    NORMALIZED_EVENTS ||--o{ ALERTS : "triggers"
    ALERTS }o--|| INCIDENTS : "groups into"
    NORMALIZED_EVENTS ||--o{ IOCS : "extracts"
    DETECTION_RULES ||--o{ ALERTS : "evaluates"

    RAW_LOGS {
        int id PK
        text raw_text
        string source_format
        string file_name
        int line_number
        datetime ingested_at
    }

    NORMALIZED_EVENTS {
        int id PK
        int log_id FK
        datetime timestamp
        string source_ip
        string destination_ip
        int source_port
        int destination_port
        string username
        string event_type
        string action
        string status
        float risk_score
        string severity
        string attack_type
    }

    ALERTS {
        int id PK
        string alert_id UK
        int event_id FK
        int incident_id FK
        string attack_type
        string severity
        float risk_score
        float confidence
        string status
        json evidence
        datetime created_at
    }

    INCIDENTS {
        int id PK
        string incident_id UK
        string title
        string severity
        float risk_score
        string status
        string primary_ip
        string primary_user
        int alert_count
        datetime start_time
        datetime end_time
    }

    IOCS {
        int id PK
        string ioc_type
        string value UK
        string risk_level
        string status
        int event_count
        datetime first_seen
        datetime last_seen
    }

    DETECTION_RULES {
        int id PK
        string rule_code UK
        string name
        float threshold_value
        int time_window_minutes
        string severity
        boolean is_enabled
    }
```

---

## 5. Real-Time Communication & WebSocket Architecture

The platform uses bidirectional WebSockets (`/ws/alerts`) to ensure sub-second SOC updates without polling:
1. **Connection Lifecycle**: On initial dashboard load, the React client establishes a persistent connection to `ws://<host>/ws/alerts`.
2. **Broadcaster Dispatch**: When the detection pipeline generates a new `Alert`:
   - It packages the alert into a lightweight JSON payload.
   - Pushes it to all active connections in the in-memory pool.
3. **Client-Side Toast & Sound Cue**: The `DashboardLayout.jsx` intercepts the alert, renders an animated amber/yellow toast in the lower right, and triggers a dynamic state refresh.
4. **Reconnection & Fallback**: If the socket closes, the client uses an exponential backoff algorithm with jitter ($2^n \times 1000\text{ms}$) to restore connectivity.

---

## 6. Deployment & Reverse Proxy Architecture

The production environment is packaged as a unified server model:
* **Backend**: FastAPI running on Python 3.11 with Uvicorn ASGI server on port `8000`.
* **Frontend**: Optimized Single Page Application (SPA) built via Vite and compiled into `dist/`. FastAPI serves these static assets directly with an SPA catch-all route.
* **Public Subdomain**: Routed through Cloudflare Tunnel daemon (`cloudflared`) to `https://mas-agree-instructions-moderators.trycloudflare.com`, providing SSL termination, DDoS protection, and public access without requiring open firewall ports.
