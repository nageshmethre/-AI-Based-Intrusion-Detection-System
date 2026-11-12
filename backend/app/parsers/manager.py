from typing import List, Optional, Tuple
from backend.app.parsers.base import BaseLogParser, ParsedEvent
from backend.app.parsers.linux_auth import LinuxAuthParser
from backend.app.parsers.web_access import WebAccessParser
from backend.app.parsers.windows_event import WindowsEventParser
from backend.app.parsers.csv_json import CSVJSONParser
from backend.app.parsers.cic_flow import CICFlowParser
from backend.app.parsers.unknown import UnknownEventParser

class LogParserManager:
    """Manages parser selection, auto-detection, and line-by-line normalization."""

    def __init__(self):
        self.parsers: List[BaseLogParser] = [
            CICFlowParser(),
            LinuxAuthParser(),
            WebAccessParser(),
            WindowsEventParser(),
            CSVJSONParser(),
        ]
        self.fallback = UnknownEventParser()

    def detect_format(self, lines: List[str]) -> str:
        """Inspect sample lines to determine the most likely log format."""
        for line in lines[:10]:
            trimmed = line.strip()
            if not trimmed:
                continue
            for parser in self.parsers:
                if parser.can_parse(trimmed):
                    return parser.name
        return "unknown"

    def parse_line(self, line: str, preferred_format: Optional[str] = None) -> ParsedEvent:
        """Parse a single log line using preferred parser or fallback to auto-detection."""
        trimmed = line.strip()
        if not trimmed:
            return None

        if preferred_format:
            for parser in self.parsers:
                if parser.name == preferred_format:
                    res = parser.parse_line(trimmed)
                    if res:
                        return res

        # Auto-detect by trying parsers in order
        for parser in self.parsers:
            if parser.can_parse(trimmed):
                res = parser.parse_line(trimmed)
                if res:
                    return res

        # Fallback to unknown event parser
        return self.fallback.parse_line(trimmed)

parser_manager = LogParserManager()
