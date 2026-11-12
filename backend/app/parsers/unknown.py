from datetime import datetime, timezone
from typing import Optional
from backend.app.parsers.base import BaseLogParser, ParsedEvent

class UnknownEventParser(BaseLogParser):
    name: str = "unknown"

    def can_parse(self, sample_line: str) -> bool:
        # Fallback catches anything
        return True

    def parse_line(self, line: str) -> Optional[ParsedEvent]:
        line = line.strip()
        if not line:
            return None

        # Extract any IPv4 address present in the line
        ips = self.extract_ips(line)
        src_ip = ips[0] if ips else None

        # Extract any URL
        urls = self.extract_urls(line)
        resource = urls[0] if urls else None

        return ParsedEvent(
            timestamp=datetime.now(timezone.utc),
            raw_log=line,
            event_type="UNKNOWN_EVENT",
            action="UNPARSED_LOG",
            status="INFO",
            source_ip=src_ip,
            resource=resource,
            message=line[:250],
            severity="INFO"
        )
