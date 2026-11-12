import re
from datetime import datetime, timezone
from typing import Optional
from backend.app.parsers.base import BaseLogParser, ParsedEvent

class LinuxAuthParser(BaseLogParser):
    name: str = "linux_auth"

    # Pattern for standard syslog header: "Mmm dd hh:mm:ss hostname daemon[pid]:" or ISO 8601
    SYSLOG_PREFIX = re.compile(
        r'^(?P<month>[A-Za-z]{3})\s+(?P<day>\d{1,2})\s+(?P<time>\d{2}:\d{2}:\d{2})\s+(?P<host>[^\s]+)\s+(?P<process>[a-zA-Z0-9_\-\.]+)(?:\[(?P<pid>\d+)\])?:\s*(?P<message>.*)$'
    )
    ISO_PREFIX = re.compile(
        r'^(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+(?P<host>[^\s]+)\s+(?P<process>[a-zA-Z0-9_\-\.]+)(?:\[(?P<pid>\d+)\])?:\s*(?P<message>.*)$'
    )

    # Detailed SSH regex patterns
    SSH_FAILED_PASS = re.compile(
        r'Failed password for (?:invalid user )?(?P<user>[^\s]+) from (?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) port (?P<port>\d+)'
    )
    SSH_ACCEPTED = re.compile(
        r'Accepted (?:password|publickey) for (?P<user>[^\s]+) from (?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) port (?P<port>\d+)'
    )
    SSH_INVALID_USER = re.compile(
        r'Invalid user (?P<user>[^\s]+) from (?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
    )
    SUDO_CMD = re.compile(
        r'^\s*(?P<user>[^\s]+)\s*:\s*TTY=(?P<tty>[^\s;]+)\s*;\s*PWD=(?P<pwd>[^\s;]+)\s*;\s*USER=(?P<target_user>[^\s;]+)\s*;\s*COMMAND=(?P<command>.*)$'
    )
    PAM_AUTH_FAILURE = re.compile(
        r'pam_unix\(.*:auth\):\s*authentication failure;.*rhost=(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?.*user=(?P<user>[^\s]*)'
    )

    MONTHS = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
        "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
    }

    def _parse_timestamp(self, month_str: str, day_str: str, time_str: str) -> datetime:
        year = datetime.now(timezone.utc).year
        month = self.MONTHS.get(month_str, 1)
        day = int(day_str)
        parts = [int(p) for p in time_str.split(":")]
        return datetime(year, month, day, parts[0], parts[1], parts[2], tzinfo=timezone.utc)

    def can_parse(self, sample_line: str) -> bool:
        line = sample_line.strip()
        if "sshd" in line or "sudo" in line or "pam_unix" in line:
            return bool(self.SYSLOG_PREFIX.match(line) or self.ISO_PREFIX.match(line))
        return False

    def parse_line(self, line: str) -> Optional[ParsedEvent]:
        line = line.strip()
        if not line:
            return None

        # Check ISO prefix first
        iso_match = self.ISO_PREFIX.match(line)
        timestamp = None
        process = ""
        msg = ""

        if iso_match:
            try:
                # Handle varying ISO formats
                ts_str = iso_match.group("timestamp").replace(" ", "T")
                if "T" in ts_str and not ts_str.endswith("Z") and "+" not in ts_str and "-" not in ts_str[10:]:
                    ts_str += "+00:00"
                timestamp = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            except Exception:
                timestamp = datetime.now(timezone.utc)
            process = iso_match.group("process")
            msg = iso_match.group("message")
        else:
            sys_match = self.SYSLOG_PREFIX.match(line)
            if sys_match:
                try:
                    timestamp = self._parse_timestamp(
                        sys_match.group("month"),
                        sys_match.group("day"),
                        sys_match.group("time")
                    )
                except Exception:
                    timestamp = datetime.now(timezone.utc)
                process = sys_match.group("process")
                msg = sys_match.group("message")
            else:
                return None

        # Analyze message content
        if "Failed password" in msg:
            m = self.SSH_FAILED_PASS.search(msg)
            if m:
                return ParsedEvent(
                    timestamp=timestamp,
                    raw_log=line,
                    event_type="AUTH",
                    action="LOGIN",
                    status="FAILURE",
                    source_ip=m.group("ip"),
                    destination_port=int(m.group("port")),
                    username=m.group("user"),
                    protocol="SSH",
                    severity="HIGH",
                    message=f"SSH failed login attempt for user '{m.group('user')}'"
                )

        if "Accepted password" in msg or "Accepted publickey" in msg:
            m = self.SSH_ACCEPTED.search(msg)
            if m:
                return ParsedEvent(
                    timestamp=timestamp,
                    raw_log=line,
                    event_type="AUTH",
                    action="LOGIN",
                    status="SUCCESS",
                    source_ip=m.group("ip"),
                    destination_port=int(m.group("port")),
                    username=m.group("user"),
                    protocol="SSH",
                    severity="INFO",
                    message=f"SSH successful authentication for user '{m.group('user')}'"
                )

        if "Invalid user" in msg:
            m = self.SSH_INVALID_USER.search(msg)
            if m:
                return ParsedEvent(
                    timestamp=timestamp,
                    raw_log=line,
                    event_type="AUTH",
                    action="LOGIN",
                    status="FAILURE",
                    source_ip=m.group("ip"),
                    username=m.group("user"),
                    protocol="SSH",
                    severity="HIGH",
                    message=f"SSH invalid user logon attempt '{m.group('user')}'"
                )

        if process == "sudo":
            m = self.SUDO_CMD.search(msg)
            if m:
                return ParsedEvent(
                    timestamp=timestamp,
                    raw_log=line,
                    event_type="SYSTEM",
                    action="SUDO",
                    status="SUCCESS",
                    username=m.group("user"),
                    resource=m.group("command"),
                    severity="MEDIUM",
                    message=f"User '{m.group('user')}' executed sudo command: {m.group('command')}",
                    metadata={"target_user": m.group("target_user"), "pwd": m.group("pwd")}
                )

        if "authentication failure" in msg:
            m = self.PAM_AUTH_FAILURE.search(msg)
            user = m.group("user") if m and m.group("user") else "unknown"
            ip = m.group("ip") if m and m.group("ip") else None
            return ParsedEvent(
                timestamp=timestamp,
                raw_log=line,
                event_type="AUTH",
                action="LOGIN",
                status="FAILURE",
                source_ip=ip,
                username=user,
                protocol="PAM",
                severity="HIGH",
                message=f"PAM authentication failure for user '{user}'"
            )

        # Generic SSH / System event fallback
        return ParsedEvent(
            timestamp=timestamp,
            raw_log=line,
            event_type="AUTH" if "sshd" in process else "SYSTEM",
            action="SYSTEM_MSG",
            status="INFO",
            message=msg,
            severity="INFO"
        )
