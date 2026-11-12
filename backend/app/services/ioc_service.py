import re
from datetime import datetime, timezone
from typing import List, Set
from sqlalchemy.orm import Session
from backend.app.models.ioc import IOC

class IOCService:
    IPV4_PATTERN = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
    DOMAIN_PATTERN = re.compile(r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+(?:com|org|net|edu|gov|io|co|in|info|xyz|ru|cn)\b', re.IGNORECASE)
    URL_PATTERN = re.compile(r'https?://[^\s<>"\'{}|\\^`]+')
    MD5_PATTERN = re.compile(r'\b[a-fA-F0-9]{32}\b')
    SHA256_PATTERN = re.compile(r'\b[a-fA-F0-9]{64}\b')

    # Private IP ranges (RFC 1918 + loopback) - marked SAFE by default unless malicious behavior observed
    PRIVATE_IP_PREFIXES = ("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "127.")

    def extract_from_text(self, text: str) -> List[dict]:
        """Extract all candidate indicators from a raw log string."""
        iocs = []
        now = datetime.now(timezone.utc)

        # 1. IPv4s
        for ip in set(self.IPV4_PATTERN.findall(text)):
            is_priv = any(ip.startswith(p) for p in self.PRIVATE_IP_PREFIXES)
            iocs.append({
                "value": ip,
                "ioc_type": "IPV4",
                "risk_level": "SAFE" if is_priv else "SUSPICIOUS"
            })

        # 2. URLs
        for url in set(self.URL_PATTERN.findall(text)):
            iocs.append({
                "value": url[:250],
                "ioc_type": "URL",
                "risk_level": "SUSPICIOUS"
            })

        # 3. Hashes
        for h in set(self.SHA256_PATTERN.findall(text)):
            iocs.append({"value": h, "ioc_type": "SHA256", "risk_level": "SUSPICIOUS"})
        for h in set(self.MD5_PATTERN.findall(text)):
            # Avoid duplicate matching with SHA256 substrings
            if len(h) == 32:
                iocs.append({"value": h, "ioc_type": "MD5", "risk_level": "SUSPICIOUS"})

        return iocs

    def record_iocs(self, db: Session, text: str, suspicious_context: bool = False):
        """Extract and upsert IOCs into the database handling uncommitted session objects."""
        extracted = self.extract_from_text(text)
        now = datetime.now(timezone.utc)

        for item in extracted:
            val = item["value"]
            # First check pending uncommitted objects in the current session
            ioc = None
            for obj in db.new:
                if isinstance(obj, IOC) and obj.value == val:
                    ioc = obj
                    break

            # If not in pending session, query the database
            if not ioc:
                ioc = db.query(IOC).filter(IOC.value == val).first()

            if ioc:
                ioc.last_seen = now
                ioc.event_count += 1
                if suspicious_context and ioc.risk_level != "MALICIOUS":
                    ioc.risk_level = "SUSPICIOUS"
            else:
                risk = "SUSPICIOUS" if suspicious_context else item["risk_level"]
                ioc = IOC(
                    value=val,
                    ioc_type=item["ioc_type"],
                    first_seen=now,
                    last_seen=now,
                    event_count=1,
                    risk_level=risk,
                    status="ACTIVE"
                )
                db.add(ioc)

ioc_service = IOCService()
