# AI-Based Intrusion Detection System: Brain & Intelligence Specification

## 1. Executive Overview

The **Brain** of the AI-Based Intrusion Detection System (AI-IDS) represents the core analytical, heuristic, and cognitive decision-making engines responsible for detecting malicious activities, evaluating threat severity, correlating disparate security events, and generating human-interpretable explanations.

Unlike naive rule-only firewalls or ungrounded black-box deep learning models, the AI-IDS Brain implements a **Multi-Layered Dual-Engine Intelligence Architecture**:
1. **The Heuristic Deterministic Brain**: 8 high-precision sliding-window heuristic detection rules.
2. **The Unsupervised Anomaly Brain**: Scikit-Learn Isolation Forest evaluating high-dimensional behavioural deviations.
3. **The Supervised Classification Brain**: Multi-class Random Forest benchmarked against the Canadian Institute for Cybersecurity (CIC-IDS2017) dataset.
4. **The Threat Intelligence & IOC Brain**: Automated entity extractor parsing IPv4, domain, URI, and cryptographic hashes.
5. **The Multi-Factor Risk Scoring Brain**: Deterministic mathematics generating an explainable 0–100 composite threat score.
6. **The Incident Correlation Brain**: Graph-like time-window correlation grouping multi-stage attack chains into unified campaigns.
7. **The Grounded AI Analytical Explainer**: Analyst narrative engine translating raw logs and rule hits into plain English SOC briefings.

---

## 2. Multi-Tier Brain Architecture Diagram

```
                 INGESTED SECURITY LOG TELEMETRY
                                │
                                ▼
                   NORMALIZED EVENT DICTIONARY
                                │
         ┌──────────────────────┴──────────────────────┐
         ▼                                             ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│ DETERMINISTIC HEURISTIC │               │   UNSUPERVISED ML       │
│         BRAIN           │               │     ANOMALY BRAIN       │
│ • SSH Brute Force       │               │ • Isolation Forest      │
│ • Password Spraying     │               │ • Flow Rate Deviations  │
│ • Success After Brute   │               │ • Z-score Outliers      │
│ • UFW Port Scan         │               │ • Off-Hours Anomalies   │
│ • Excessive Requests    │               └────────────┬────────────┘
│ • Off-Hours Logins      │                            │
│ • Multi-IP Travel       │                            │
│ • Data Exfiltration     │                            │
└────────────┬────────────┘                            │
             │                                         │
             └──────────────────┬──────────────────────┘
                                ▼
                ┌───────────────────────────────┐
                │   COMPOSITE RISK SCORING      │
                │            BRAIN              │
                │  Risk = (0.50*R + 0.35*ML +   │
                │          0.15*Hist) * SevMod  │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │    INCIDENT CORRELATION       │
                │            BRAIN              │
                │ • Campaign Clustering         │
                │ • Kill-Chain Progression      │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │      EXPLAINABLE AI (XAI)     │
                │            BRAIN              │
                │ • What Happened               │
                │ • Why Suspicious              │
                │ • Recommended SOC Actions     │
                └───────────────────────────────┘
```

---

## 3. Subsystem 1: The Heuristic Deterministic Brain

The heuristic engine evaluates incoming events against stateful, sliding time windows stored in high-performance in-memory ring buffers and relational database tables.

### Rule 1: SSH / Authentication Brute Force (`BRUTE_FORCE`)
* **Logic**: Counts failed authentication events (`status == 'FAILURE'`) originating from the same `source_ip`.
* **Default Threshold**: $\ge 5$ failures within a **5-minute** window.
* **Severity**: `HIGH`
* **MITRE ATT&CK**: T1110.001 (Password Guessing)

### Rule 2: Password Spraying Detection (`PASSWORD_SPRAYING`)
* **Logic**: Detects a single `source_ip` attempting authentication across multiple distinct usernames to evade per-account lockouts.
* **Default Threshold**: $\ge 3$ distinct usernames within a **5-minute** window.
* **Severity**: `HIGH`
* **MITRE ATT&CK**: T1110.003 (Password Spraying)

### Rule 3: Successful Login After Multiple Failures (`SUCCESS_AFTER_BRUTE_FORCE`)
* **Logic**: A successful login (`status == 'SUCCESS'`) occurring within 10 minutes of multiple failed logins from the identical IP or targeted username.
* **Default Threshold**: $\ge 3$ previous failures within a **10-minute** window followed by success.
* **Severity**: `CRITICAL`
* **MITRE ATT&CK**: T1078 (Valid Accounts) / T1110 (Brute Force Compromise)

### Rule 4: TCP / UDP Port Scanning (`PORT_SCAN`)
* **Logic**: Evaluates connection attempts or firewall drops from a single `source_ip` across distinct destination ports.
* **Default Threshold**: $\ge 5$ distinct destination ports within a **2-minute** window.
* **Severity**: `HIGH`
* **MITRE ATT&CK**: T1046 (Network Service Discovery)

### Rule 5: Excessive HTTP Web Requests (`EXCESSIVE_REQUESTS`)
* **Logic**: High-frequency HTTP request bursts indicative of denial-of-service, content scraping, or directory fuzzing (e.g., Dirbuster/Gobuster).
* **Default Threshold**: $\ge 30$ requests within a **1-minute** window.
* **Severity**: `MEDIUM`
* **MITRE ATT&CK**: T1499 (Endpoint DoS) / T1595 (Active Scanning)

### Rule 6: Anomalous Off-Hours Logins (`SUSPICIOUS_LOGIN_TIMES`)
* **Logic**: Evaluates whether an authentication attempt occurs outside standard business operating hours (between 23:00 and 05:00 local time).
* **Default Threshold**: Hour $\ge 23$ OR Hour $\le 5$.
* **Severity**: `MEDIUM`
* **MITRE ATT&CK**: T1078.002 (Domain Accounts)

### Rule 7: Concurrent Multi-IP Logins / Impossible Travel (`MULTIPLE_IP_LOGINS`)
* **Logic**: Identifies a single user account authenticating concurrently from multiple distinct public IP subnets within a tight window.
* **Default Threshold**: $\ge 2$ distinct IP addresses within a **15-minute** window.
* **Severity**: `HIGH`
* **MITRE ATT&CK**: T1078 (Compromised Credentials)

### Rule 8: High Outbound Data Transfer (`HIGH_DATA_TRANSFER`)
* **Logic**: Tracks outbound cumulative bytes transferred (`bytes_sent`) during web responses or file transfers.
* **Default Threshold**: $\ge 10,000,000$ bytes (10 MB) within a single event or flow session.
* **Severity**: `CRITICAL`
* **MITRE ATT&CK**: T1048 (Exfiltration Over Alternative Protocol)

---

## 4. Subsystem 2: The Unsupervised Machine Learning Brain

To detect previously unseen (zero-day) attack vectors where deterministic rules have no predefined signature, the Brain deploys an **Isolation Forest** anomaly detection algorithm.

### Feature Space Vector ($\mathbf{x} \in \mathbb{R}^7$)
1. `flow_duration`: Total elapsed flow time in microseconds.
2. `fwd_packets`: Forward packet count.
3. `bwd_packets`: Backward packet count.
4. `packet_rate`: Packet velocity per second ($\frac{\text{packets}}{\text{duration}}$).
5. `byte_rate`: Throughput in bytes per second ($\frac{\text{bytes}}{\text{duration}}$).
6. `fwd_iat_mean`: Mean inter-arrival time between packets.
7. `dst_port`: Numerical destination port index.

### Mathematical Decision Function
The anomaly score $s(x, n)$ for an instance $x$ across an ensemble of $t$ isolation trees of sample size $n$ is defined by:
$$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
where:
* $h(x)$ is the path length to isolate point $x$ in an isolation tree.
* $E(h(x))$ is the expectation of path lengths over the ensemble.
* $c(n) = 2 \ln(n - 1) + 0.5772156649 - \frac{2(n - 1)}{n}$ is the average path length of unsuccessful searches in a Binary Search Tree (BST).

### Normalization to 0–100 Scale
Raw anomaly scores from Scikit-Learn's `decision_function(X)` range from $[-0.5, 0.5]$. The AI-IDS Brain maps this output monotonically to a $[0, 100]$ score:
$$\text{Score}_{\text{ML}} = \min\left(100.0, \max\left(0.0, (0.5 - s) \times 100\right)\right)$$
* Instances with $\text{Score}_{\text{ML}} \ge 75$ are flagged as anomalous.

---

## 5. Subsystem 3: The Composite Multi-Factor Risk Scoring Brain

To ensure transparency and eliminate arbitrary alert rankings, the Brain executes a deterministic mathematical formula combining heuristic rule weights, machine learning anomaly scores, and historical IP reputation.

$$\text{Composite Risk} = \min\left(100, \left( w_r \cdot S_{\text{rule}} + w_m \cdot S_{\text{ML}} + w_h \cdot S_{\text{hist}} \right) \times M_{\text{sev}} \right)$$

### Parameter Weights
* $w_r = 0.50$ (Deterministic Rule Weight)
* $w_m = 0.35$ (Machine Learning Anomaly Score Weight)
* $w_h = 0.15$ (Historical Entity Reputation Weight)

### Severity Multipliers ($M_{\text{sev}}$)
* `CRITICAL`: $1.30$
* `HIGH`: $1.15$
* `MEDIUM`: $1.00$
* `LOW`: $0.80$
* `INFO`: $0.50$

---

## 6. Subsystem 4: The Incident Correlation & Clustering Brain

Individual alerts do not occur in a vacuum; sophisticated attackers execute multi-stage kill chains. The Correlation Brain clusters individual alerts into persistent **Incident Campaigns**:
1. **Primary Entity Grouping**: Alerts sharing the identical `source_ip` or targeted `username`.
2. **Temporal Proximity Sliding Window**: Subsequent alerts occurring within **30 minutes** of an open incident are automatically associated.
3. **Composite Incident Escalation**: Incident risk score is dynamically updated to the maximum constituent alert risk multiplied by a logarithmic alert density factor:
   $$\text{Risk}_{\text{incident}} = \min\left(100, \max_{a \in \text{Alerts}}(\text{Risk}_a) + 5 \cdot \ln(1 + |\text{Alerts}|)\right)$$

---

## 7. Subsystem 5: Grounded AI Explainability Engine (XAI)

When an analyst investigates an alert, the Brain generates a human-readable 5-point analytical breakdown:
1. **What Happened?**: Concise factual statement detailing the attacker identity, target entity, protocol, and observed frequency.
2. **Why Was This Suspicious?**: Explanation of the behavioral baseline deviation and specific thresholds violated.
3. **Supporting Evidence**: Log line extracts, timestamp sequences, and offending port lists.
4. **Triggered Heuristics**: Array of active deterministic rules and ML model confidence levels.
5. **Recommended Response**: Actionable guidance for SOC analysts (e.g., "Block IP on edge firewall", "Revoke compromised session tokens", "Rotate administrative credentials").
