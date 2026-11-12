import re
from datetime import datetime, timezone
from typing import Optional
from backend.app.parsers.base import BaseLogParser, ParsedEvent

class WindowsEventParser(BaseLogParser):
    name: str = "windows_event"

    EVENT_ID_REGEX = re.compile(r'(?:(?:EventID|Event ID|EventId|Security)[:=]?\s*|\b)(?P<id>4624|4625|4672|4688)\b', re.IGNORECASE)
    TIME_REGEX = re.compile(r'(?P<time>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?)')
    USER_REGEX = re.compile(r'(?:TargetUserName|Account Name|SubjectUserName|User)[:=]?\s*["\']?(?P<user>[a-zA-Z0-9_\-\.\$]+)["\']?', re.IGNORECASE)
    IP_REGEX = re.compile(r'(?:IpAddress|Source Network Address|Client Address)[:=]?\s*["\']?(?P<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})["\']?', re.IGNORECASE)
    PORT_REGEX = re.compile(r'(?:IpPort|Source Port)[:=]?\s*(?P<port>\d+)', re.IGNORECASE)
    PROCESS_REGEX = re.compile(r'(?:ProcessName|New Process Name|CommandLine)[:=]?\s*["\']?(?P<proc>[^,;"]+)["\']?', re.IGNORECASE)

    def can_parse(self, sample_line: str) -> bool:
        line = sample_line.lower()
        return ("4624" in line or "4625" in line or "4672" in line or "4688" in line or "microsoft-windows-security" in line)

    def parse_line(self, line: str) -> Optional[ParsedEvent]:
        line = line.strip()
        if not line:
            return None

        eid_match = self.EVENT_ID_REGEX.search(line)
        if not eid_match:
            return None

        event_id = eid_match.group("id")
        
        # Parse timestamp
        timestamp = datetime.now(timezone.utc)
        time_match = self.TIME_REGEX.search(line)
        if time_match:
            try:
                t_str = time_match.group("time").replace(" ", "T")
                timestamp = datetime.fromisoformat(t_str).replace(tzinfo=timezone.utc)
            except Exception:
                pass

        # Extract fields
        user_match = self.USER_REGEX.search(line)
        username = user_match.group("user") if user_match else None
        
        ip_match = self.IP_REGEX.search(line)
        source_ip = ip_match.group("ip") if ip_match else None
        
        port_match = self.PORT_REGEX.search(line)
        source_port = int(port_match.group("port")) if port_match else None

        proc_match = self.PROCESS_REGEX.search(line)
        resource = proc_match.group("proc") if proc_match else None

        # Map Windows Event ID to normalized action and severity
        if event_id == "4624":  # Successful Logon
            return ParsedEvent(
                timestamp=timestamp,
                raw_log=line,
                event_type="AUTH",
                action="LOGIN",
                status="SUCCESS",
                source_ip=source_ip,
                source_port=source_port,
                username=username,
                protocol="Kerberos/NTLM",
                severity="INFO",
                message=f"Windows Logon Success (Event 4624) - User: {username}",
                metadata={"event_id": 4624}
            )

        elif event_id == "4625":  # Failed Logon
            return ParsedEvent(
                timestamp=timestamp,
                raw_log=line,
                event_type="AUTH",
                action="LOGIN",
                status="FAILURE",
                source_ip=source_ip,
                source_port=source_port,
                username=username,
                protocol="Kerberos/NTLM",
                severity="HIGH",
                message=f"Windows Logon Failure (Event 4625) - User: {username}",
                metadata={"event_id": 4625}
            )

        elif event_id == "4672":  # Special Privileges Assigned
            return ParsedEvent(
                timestamp=timestamp,
                raw_log=line,
                event_type="SYSTEM",
                action="PRIVILEGE_USE",
                status="SUCCESS",
                username=username,
                severity="MEDIUM",
                message=f"Special Privileges Assigned (Event 4672) - User: {username}",
                metadata={"event_id": 4672}
            )

        elif event_id == "4688":  # New Process Created
            sev = "INFO"
            if resource and any(susp in resource.lower() for susp in ["powershell.exe -enc", "whoami", "mimikatz", "net user", "vssadmin"]):
                sev = "HIGH"
            return ParsedEvent(
                timestamp=timestamp,
                raw_log=line,
                event_type="SYSTEM",
                action="PROCESS_CREATE",
                status="SUCCESS",
                username=username,
                resource=resource,
                severity=sev,
                message=f"Process Created (Event 4688) - {resource}",
                metadata={"event_id": 4688}
            )

        return ParsedEvent(
            timestamp=timestamp,
            raw_log=line,
            event_type="SYSTEM",
            action="WINDOWS_EVENT",
            status="INFO",
            username=username,
            source_ip=source_ip,
            severity="INFO",
            message=f"Windows Security Event {event_id}",
            metadata={"event_id": event_id}
        )
