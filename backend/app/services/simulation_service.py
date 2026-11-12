from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.services.ingestion_service import ingestion_service
from backend.app.detection.pipeline import detection_pipeline

class SecuritySimulationService:
    """Generates realistic synthetic attack sequences for viva evaluation demonstrations."""

    def run_multi_stage_simulation(self, db: Session) -> Dict[str, Any]:
        """
        Executes an end-to-end multi-stage cyber attack scenario on local synthetic data:
        1. Normal baseline traffic
        2. Port scanning reconnaissance
        3. SSH authentication brute force
        4. Success after brute force (compromise)
        5. Sudo privilege escalation
        6. Outbound data exfiltration
        """
        now = datetime.now(timezone.utc)
        attacker_ip = "198.51.100.77"
        victim_host = "prod-db-server01"

        log_lines = []

        # Stage 1: Baseline Normal Traffic
        log_lines.append(f'{(now - timedelta(minutes=6)).strftime("%b %d %H:%M:%S")} {victim_host} sshd[1001]: Accepted password for developer1 from 10.0.1.25 port 49152 ssh2')
        log_lines.append(f'10.0.1.25 - developer1 [{(now - timedelta(minutes=5)).strftime("%d/%b/%Y:%H:%M:%S")} +0000] "GET /api/v1/health HTTP/1.1" 200 45')

        # Stage 2: Ingress Port Scanning (6 ports probed rapidly)
        for p in [21, 22, 80, 443, 3389, 8080]:
            log_lines.append(f'{(now - timedelta(minutes=4, seconds=p % 30)).strftime("%b %d %H:%M:%S")} {victim_host} kernel: [UFW BLOCK] IN=eth0 SRC={attacker_ip} DST=10.0.1.100 PROTO=TCP SPT=54321 DPT={p}')

        # Stage 3: SSH Brute Force Attacks (7 consecutive failures)
        users = ["root", "admin", "test", "oracle", "postgres", "deploy", "backup_admin"]
        for idx, u in enumerate(users):
            t = (now - timedelta(minutes=3, seconds=(10 - idx) * 5)).strftime("%b %d %H:%M:%S")
            log_lines.append(f'{t} {victim_host} sshd[102{idx}]: Failed password for invalid user {u} from {attacker_ip} port {40000 + idx} ssh2')

        # Stage 4: Compromise - Success After Brute Force
        t_succ = (now - timedelta(minutes=2)).strftime("%b %d %H:%M:%S")
        log_lines.append(f'{t_succ} {victim_host} sshd[1035]: Accepted password for backup_admin from {attacker_ip} port 40015 ssh2')

        # Stage 5: Privilege Escalation via Sudo
        t_priv = (now - timedelta(minutes=1, seconds=30)).strftime("%b %d %H:%M:%S")
        log_lines.append(f'{t_priv} {victim_host} sudo:   backup_admin : TTY=pts/1 ; PWD=/home/backup_admin ; USER=root ; COMMAND=/bin/bash')

        # Stage 6: High Data Exfiltration Transfer
        # JSON format web exfiltration log
        t_exfil = (now - timedelta(seconds=20)).isoformat()
        exfil_json = f'{{"timestamp": "{t_exfil}", "source_ip": "{attacker_ip}", "username": "backup_admin", "event_type": "NETWORK", "action": "DATA_TRANSFER", "status": "SUCCESS", "bytes_sent": 29360128, "bytes_received": 1200, "severity": "HIGH", "message": "Outbound database dump transfer via HTTPS archive"}}'
        log_lines.append(exfil_json)

        # Ingest lines into database
        ingest_res = ingestion_service.ingest_lines(
            db=db,
            lines=log_lines,
            file_name="security_simulation_scenario.log"
        )

        # Process through detection pipeline
        alerts = detection_pipeline.process_events(db, ingest_res.get("events", []))

        return {
            "status": "success",
            "scenario": "Multi-Stage Advanced Persistent Threat (APT) Simulation",
            "events_generated": len(log_lines),
            "alerts_created": len(alerts),
            "attacker_ip": attacker_ip,
            "target_host": victim_host,
            "stages_executed": [
                "1. Baseline Normal Operations",
                "2. Automated TCP Port Scanning Probe",
                "3. Targeted SSH Credential Brute Force",
                "4. Unauthorized Authentication Compromise",
                "5. Root Privilege Escalation via Sudo",
                "6. Bulk Database Archive Exfiltration"
            ]
        }

simulation_service = SecuritySimulationService()
