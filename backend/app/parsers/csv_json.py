import json
import csv
import io
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from backend.app.parsers.base import BaseLogParser, ParsedEvent

class CSVJSONParser(BaseLogParser):
    name: str = "csv_json"

    def can_parse(self, sample_line: str) -> bool:
        line = sample_line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                json.loads(line)
                return True
            except Exception:
                return False
        if "," in line and any(k in line.lower() for k in ["ip", "user", "status", "action", "timestamp"]):
            return True
        return False

    def parse_line(self, line: str) -> Optional[ParsedEvent]:
        line = line.strip()
        if not line:
            return None

        # Check JSON first
        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
                return self._parse_dict(data, line)
            except Exception:
                pass

        # Try CSV parsing
        try:
            reader = csv.reader(io.StringIO(line))
            row = next(reader)
            if len(row) >= 4:
                # Basic positional or heuristic mapping
                # Example: timestamp, source_ip, username, action, status, severity, message
                ts = datetime.now(timezone.utc)
                try:
                    ts = datetime.fromisoformat(row[0].strip().replace("Z", "+00:00"))
                except Exception:
                    pass

                return ParsedEvent(
                    timestamp=ts,
                    raw_log=line,
                    source_ip=row[1].strip() if len(row) > 1 else None,
                    username=row[2].strip() if len(row) > 2 else None,
                    action=row[3].strip() if len(row) > 3 else "LOG_ENTRY",
                    status=row[4].strip() if len(row) > 4 else "INFO",
                    severity=row[5].strip() if len(row) > 5 else "INFO",
                    message=row[6].strip() if len(row) > 6 else line
                )
        except Exception:
            pass

        return None

    def _parse_dict(self, d: Dict[str, Any], raw: str) -> ParsedEvent:
        # Heuristic field normalization
        ts = datetime.now(timezone.utc)
        ts_val = d.get("timestamp") or d.get("time") or d.get("@timestamp") or d.get("datetime")
        if ts_val:
            try:
                ts = datetime.fromisoformat(str(ts_val).replace("Z", "+00:00"))
            except Exception:
                pass

        src_ip = d.get("source_ip") or d.get("src_ip") or d.get("ip") or d.get("client_ip")
        dst_ip = d.get("destination_ip") or d.get("dst_ip") or d.get("server_ip")
        user = d.get("username") or d.get("user") or d.get("account")
        action = d.get("action") or d.get("method") or "LOG_ENTRY"
        status = d.get("status") or d.get("result") or "INFO"
        event_type = d.get("event_type") or d.get("type") or "AUTH"
        severity = d.get("severity") or "INFO"
        protocol = d.get("protocol")
        resource = d.get("resource") or d.get("uri") or d.get("url")
        user_agent = d.get("user_agent") or d.get("agent")
        bytes_sent = int(d.get("bytes_sent") or 0)
        bytes_recv = int(d.get("bytes_received") or d.get("bytes") or 0)
        msg = d.get("message") or d.get("msg") or raw

        src_port = d.get("source_port") or d.get("src_port")
        dst_port = d.get("destination_port") or d.get("dst_port")

        return ParsedEvent(
            timestamp=ts,
            raw_log=raw,
            event_type=str(event_type).upper(),
            action=str(action).upper(),
            status=str(status).upper(),
            source_ip=str(src_ip) if src_ip else None,
            destination_ip=str(dst_ip) if dst_ip else None,
            source_port=int(src_port) if src_port else None,
            destination_port=int(dst_port) if dst_port else None,
            username=str(user) if user else None,
            protocol=str(protocol) if protocol else None,
            resource=str(resource) if resource else None,
            user_agent=str(user_agent) if user_agent else None,
            bytes_sent=bytes_sent,
            bytes_received=bytes_recv,
            message=str(msg),
            severity=str(severity).upper(),
            metadata=d
        )
