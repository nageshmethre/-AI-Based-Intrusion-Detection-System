from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.log import Log
from backend.app.models.event import NormalizedEvent
from backend.app.parsers.manager import parser_manager
from backend.app.services.ioc_service import ioc_service

class IngestionService:
    """Handles raw log intake, normalization, storage, and pipeline dispatch."""

    def ingest_lines(
        self,
        db: Session,
        lines: List[str],
        file_name: Optional[str] = "direct_input",
        preferred_format: Optional[str] = None
    ) -> Dict[str, Any]:
        """Ingest a batch of raw log lines, persist raw logs, normalize events, and extract IOCs."""
        total_lines = len(lines)
        if total_lines == 0:
            return {
                "file_name": file_name,
                "total_lines": 0,
                "parsed_events": 0,
                "alerts_generated": 0,
                "format_detected": "none",
                "message": "Empty log input provided."
            }

        # 1. Format auto-detection if not specified
        detected_format = preferred_format or parser_manager.detect_format(lines)

        normalized_events_to_insert = []
        raw_logs_to_insert = []

        for idx, line in enumerate(lines, start=1):
            trimmed = line.strip()
            if not trimmed:
                continue

            # Store raw log record
            raw_log = Log(
                raw_text=trimmed,
                source_format=detected_format,
                file_name=file_name,
                line_number=idx,
                ingested_at=datetime.now(timezone.utc)
            )
            raw_logs_to_insert.append(raw_log)

            # Parse line
            parsed = parser_manager.parse_line(trimmed, preferred_format=detected_format)
            if parsed:
                # Extract IOCs
                suspicious = parsed.severity in ("HIGH", "CRITICAL") or parsed.status == "FAILURE"
                ioc_service.record_iocs(db, trimmed, suspicious_context=suspicious)

                event = NormalizedEvent(
                    timestamp=parsed.timestamp,
                    source_ip=parsed.source_ip,
                    destination_ip=parsed.destination_ip,
                    source_port=parsed.source_port,
                    destination_port=parsed.destination_port,
                    username=parsed.username,
                    event_type=parsed.event_type,
                    action=parsed.action,
                    status=parsed.status,
                    protocol=parsed.protocol,
                    resource=parsed.resource,
                    user_agent=parsed.user_agent,
                    bytes_sent=parsed.bytes_sent,
                    bytes_received=parsed.bytes_received,
                    message=parsed.message,
                    raw_log=parsed.raw_log,
                    severity=parsed.severity,
                    risk_score=0.0
                )
                normalized_events_to_insert.append((raw_log, event))

        # Commit raw logs and link events
        db.add_all(raw_logs_to_insert)
        db.flush()

        events_list = []
        for raw_log, event in normalized_events_to_insert:
            event.log_id = raw_log.id
            events_list.append(event)
        
        db.add_all(events_list)
        db.commit()

        # Refresh objects to have IDs populated
        for e in events_list:
            db.refresh(e)

        return {
            "file_name": file_name,
            "total_lines": total_lines,
            "parsed_events": len(events_list),
            "format_detected": detected_format,
            "events": events_list
        }

ingestion_service = IngestionService()
