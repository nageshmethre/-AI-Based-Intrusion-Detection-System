import re
from datetime import datetime, timezone
from typing import Optional
from backend.app.parsers.base import BaseLogParser, ParsedEvent

class WebAccessParser(BaseLogParser):
    name: str = "web_access"

    # Apache/Nginx Combined and Common Log Format regex
    # Format: host ident authuser [date] "request" status bytes "referer" "user_agent"
    WEB_LOG_REGEX = re.compile(
        r'^(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+(?P<ident>[^\s]+)\s+(?P<user>[^\s]+)\s+\[(?P<time>[^\]]+)\]\s+"(?P<request>[^"]*)"\s+(?P<status>\d{3})\s+(?P<bytes>\d+|-)(?:\s+"(?P<referer>[^"]*)"\s+"(?P<agent>[^"]*)")?'
    )

    MONTHS = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
        "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
    }

    def _parse_clf_timestamp(self, ts_str: str) -> datetime:
        # Format: 10/Oct/2026:13:55:36 +0000
        try:
            date_part, tz_part = ts_str.split(" ")
            day_str, month_str, rest = date_part.split("/")
            year_str, hour_str, min_str, sec_str = rest.split(":")
            return datetime(
                int(year_str), self.MONTHS.get(month_str, 1), int(day_str),
                int(hour_str), int(min_str), int(sec_str), tzinfo=timezone.utc
            )
        except Exception:
            return datetime.now(timezone.utc)

    def can_parse(self, sample_line: str) -> bool:
        line = sample_line.strip()
        # Look for standard HTTP methods and status code pattern
        return bool(self.WEB_LOG_REGEX.match(line))

    def parse_line(self, line: str) -> Optional[ParsedEvent]:
        line = line.strip()
        if not line:
            return None

        m = self.WEB_LOG_REGEX.match(line)
        if not m:
            return None

        ip = m.group("ip")
        user = m.group("user")
        username = user if user != "-" else None
        timestamp = self._parse_clf_timestamp(m.group("time"))
        request_line = m.group("request")
        status_code = int(m.group("status"))
        bytes_val = int(m.group("bytes")) if m.group("bytes") != "-" else 0
        agent = m.group("agent")

        # Parse request line: "GET /index.html HTTP/1.1"
        method = "GET"
        path = "/"
        protocol = "HTTP"
        parts = request_line.split(" ")
        if len(parts) >= 2:
            method = parts[0]
            path = parts[1]
        if len(parts) >= 3:
            protocol = parts[2]

        action = f"HTTP_{method.upper()}"
        status = "SUCCESS" if status_code < 400 else ("FAILURE" if status_code in (401, 403) else "ERROR")
        severity = "INFO"
        if status_code in (401, 403):
            severity = "MEDIUM"
        elif status_code >= 500:
            severity = "HIGH"

        # Check for web attack indicators in path/query
        lower_path = path.lower()
        if any(kw in lower_path for kw in ["union+select", "' or '1'='1", "<script", "../..", "/etc/passwd", "/wp-login", "/.env"]):
            severity = "CRITICAL"
            action = "WEB_EXPLOIT_ATTEMPT"

        return ParsedEvent(
            timestamp=timestamp,
            raw_log=line,
            event_type="WEB",
            action=action,
            status=status,
            source_ip=ip,
            destination_port=443 if protocol.startswith("HTTPS") else 80,
            username=username,
            protocol=protocol,
            resource=path,
            user_agent=agent,
            bytes_received=bytes_val,
            message=f"{method} {path} - Status: {status_code} - Bytes: {bytes_val}",
            severity=severity,
            metadata={"status_code": status_code, "method": method, "referer": m.group("referer")}
        )
