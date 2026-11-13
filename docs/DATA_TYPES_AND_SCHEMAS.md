# Data Types, Schemas & Telemetry Specifications
## AI-Based Intrusion Detection System

Based on the research reference: **"Data Types in the AI-Based Intrusion Detection System (Minor Project: Machine Learning for Network Intrusion Detection)"**.

---

## 1. Overview of Data Flow & Taxonomy

The AI-IDS platform processes **structured, labeled, numeric flow-based network traffic data** alongside **unstructured system event logs**.

```
                RAW DATA SOURCES
       (Wireshark PCAPs, Syslogs, Web Logs)
                        │
                        ▼
               TELEMETRY NORMALIZER
                        │
      ┌─────────────────┴─────────────────┐
      ▼                                   ▼
IDENTIFIER DATA                   NUMERIC FLOW FEATURES
(Source IP, Target User,          (Duration, Packet Rates,
 Ports, Timestamps)                Flag Counts, Bytes/Sec)
      │                                   │
      ▼                                   ▼
SOC DASHBOARDS & ALERTS           MACHINE LEARNING BRAIN
(Forensics & Triage)              (Isolation Forest / Random Forest)
                                          │
                                          ▼
                                  CATEGORICAL LABELS
                                  (Attack Classifications)
```

---

## 2. The Four Primary Data Categories

### Category 1: Numeric Features (Model Input)
These describe each network flow or connection conversation. Extracted from network captures via CICFlowMeter or synthesized from server logs:

| Feature Group | Metric Description | Example Features | Units |
| :--- | :--- | :--- | :--- |
| **Time-based** | Flow duration, inter-arrival time (IAT) | `Flow Duration`, `Flow IAT Mean`, `Flow IAT Std`, `Flow IAT Max` | Microseconds ($\mu\text{s}$) |
| **Volume-based** | Total packets and total payload bytes | `Total Fwd Packets`, `Total Backward Packets`, `Total Length of Fwd Packets` | Packets / Bytes |
| **Rate-based** | Velocity and transfer bandwidth | `Flow Bytes/s`, `Flow Packets/s`, `Fwd Packets/s` | Bytes/s, Pkts/s |
| **Packet Size** | Statistical distribution of packet lengths | `Min Packet Length`, `Max Packet Length`, `Packet Length Mean`, `Packet Length Std` | Bytes |
| **TCP Flag Counts**| State control flags observed during flow | `FIN Flag Count`, `SYN Flag Count`, `RST Flag Count`, `PSH Flag Count`, `ACK Flag Count` | Integer Count |
| **Directional**| Forward vs. backward asymmetry | `Down/Up Ratio`, `Average Packet Size`, `Avg Fwd Segment Size` | Ratio / Bytes |
| **Connection Info**| Port and socket definitions | `Destination Port`, `Init_Win_bytes_forward`, `min_seg_size_forward` | Numeric Port / Bytes |

### Category 2: Categorical Labels (Ground Truth & Inference Output)
The classification target predicting whether a traffic flow is benign or malicious:

| Label Category | Attack Type | Typical Manifestation | Real-World Vector |
| :--- | :--- | :--- | :--- |
| `BENIGN` | Normal Traffic | Standard web browsing, streaming, DNS queries | Clean baseline |
| `DoS Hulk` | Denial of Service | High-volume HTTP GET requests exhausting web server workers | Layer 7 Web Flooding |
| `PortScan` | Reconnaissance | Rapid sequential connection attempts across port ranges | Nmap / Masscan sweeps |
| `FTP-Patator` | Brute Force | High-velocity dictionary attack against port 21 | Hydra / Medusa / Metasploit |
| `SSH-Patator` | Brute Force | Repeated failed SSH authentication attempts against port 22 | Automated botnet dictionary |
| `Web Attack` | Injection / Traversal | SQL injection union queries, `/etc/passwd` path traversal | SQLmap / Manual tampering |
| `Botnet` | Command & Control | Periodic beaconing and abnormal DNS traffic | Mirai / Cobalt Strike |

### Category 3: Identifier Data (Forensics & SOC Dashboards)
These fields are **not** used to train the machine learning models (to avoid spatial overfitting and target leakage). Instead, they provide context on who attacked whom and when:
* `source_ip`: Attacking host address (e.g., `203.0.113.55`, `198.51.100.99`).
* `destination_ip`: Targeted server asset (e.g., `10.0.0.10`, `192.168.1.100`).
* `source_port`: Ephemeral source socket port.
* `destination_port`: Targeted service port (`22` SSH, `80` HTTP, `443` HTTPS, `3306` MySQL).
* `username`: Targeted account identity (e.g., `root`, `admin`, `developer1`).
* `timestamp`: Precise ISO-8601 UTC event time.

### Category 4: Raw Packet & Telemetry Data
* **PCAP Files (`.pcap`)**: Binary packet captures recorded via Wireshark/tcpdump for deep-packet inspection.
* **Linux Syslog / Auth (`auth.log`)**: Line-based RFC 3164/5424 text emitted by `sshd` and PAM.
* **Web Access (`access.log`)**: Apache/Nginx Combined Log Format (CLF).
* **Windows Security Audits**: Windows Event Viewer event records (IDs 4624, 4625, 4672, 4688).

---

## 3. Normalized Database Schema Reference

```json
{
  "event_id": 1042,
  "timestamp": "2026-10-12T14:10:01Z",
  "source_ip": "203.0.113.55",
  "destination_ip": "10.0.0.10",
  "source_port": 41001,
  "destination_port": 22,
  "username": "root",
  "event_type": "AUTH",
  "action": "SSH_LOGIN",
  "status": "FAILURE",
  "protocol": "TCP",
  "severity": "HIGH",
  "risk_score": 78.5,
  "attack_type": "BRUTE_FORCE",
  "raw_log": "Oct 12 14:10:01 auth01 sshd[8011]: Failed password for invalid user root from 203.0.113.55 port 41001 ssh2"
}
```
