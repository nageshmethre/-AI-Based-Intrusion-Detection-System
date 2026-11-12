from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import re

@dataclass
class ParsedEvent:
    timestamp: datetime
    raw_log: str
    event_type: str = "SYSTEM"          # AUTH, WEB, NETWORK, SYSTEM, UNKNOWN_EVENT
    action: Optional[str] = None        # LOGIN, LOGOUT, HTTP_GET, HTTP_POST, PORT_CONNECT, SUDO, CMD
    status: Optional[str] = None        # SUCCESS, FAILURE, ERROR, BLOCKED
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    username: Optional[str] = None
    protocol: Optional[str] = None
    resource: Optional[str] = None
    user_agent: Optional[str] = None
    bytes_sent: int = 0
    bytes_received: int = 0
    message: Optional[str] = None
    severity: str = "INFO"
    metadata: Dict[str, Any] = field(default_factory=dict)

class BaseLogParser(ABC):
    """Abstract base class for all log parsers."""
    name: str = "base"

    # Regex utilities for common token extraction
    IPV4_REGEX = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
    URL_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')
    HASH_MD5_REGEX = re.compile(r'\b[a-fA-F0-9]{32}\b')
    HASH_SHA256_REGEX = re.compile(r'\b[a-fA-F0-9]{64}\b')

    @abstractmethod
    def can_parse(self, sample_line: str) -> bool:
        """Return True if this parser recognizes the log format."""
        pass

    @abstractmethod
    def parse_line(self, line: str) -> Optional[ParsedEvent]:
        """Parse a single raw log line into a ParsedEvent."""
        pass

    def extract_ips(self, text: str) -> List[str]:
        return self.IPV4_REGEX.findall(text)

    def extract_urls(self, text: str) -> List[str]:
        return self.URL_REGEX.findall(text)
