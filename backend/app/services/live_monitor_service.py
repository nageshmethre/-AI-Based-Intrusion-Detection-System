import os
import time
import socket
import threading
import subprocess
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.app.database.session import SessionLocal
from backend.app.services.ingestion_service import ingestion_service

class LiveMonitorService:
    """
    24x7 Real-Time Host & Network Security Monitoring Daemon.
    
    Operates 100% on genuine, live log streams:
    1. Real-time File Tailing: Continuously watches real server log files (Linux /var/log/...,
       Nginx/Apache access logs, OpenSSH logs, Windows log files).
    2. Real Syslog UDP Listener (Port 1514): Accepts genuine RFC 3164/5424 Syslog datagrams
       streamed live from firewalls, routers, or other servers.
    3. Real Windows Event Log Poller: Queries live Windows Event Logs (Security/System)
       for authentication failures, privilege escalations, and process events.
    """

    def __init__(self):
        self.is_running = False
        self.watched_files: Dict[str, int] = {}  # filepath -> last_byte_offset
        self.syslog_port = 1514
        self.syslog_running = False

        self._tail_thread: Optional[threading.Thread] = None
        self._syslog_thread: Optional[threading.Thread] = None
        self._winevent_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

        # Telemetry
        self.start_time: Optional[datetime] = None
        self.total_live_events_processed = 0
        self.live_threats_caught = 0
        self.last_winevent_time: Optional[datetime] = None

        # Ensure default server log files exist in project logs/ directory for tailing
        self.default_auth_log = os.path.abspath(os.path.join(os.getcwd(), "logs", "server_auth.log"))
        self.default_web_log = os.path.abspath(os.path.join(os.getcwd(), "logs", "server_access.log"))
        self._ensure_file(self.default_auth_log)
        self._ensure_file(self.default_web_log)

        # Register default watched files
        self.add_watched_file(self.default_auth_log)
        self.add_watched_file(self.default_web_log)

    def _ensure_file(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        if not os.path.exists(filepath):
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"# [24x7 Real-Time Server Log Watcher Initialized at {datetime.now(timezone.utc).isoformat()}]\n")

    def add_watched_file(self, filepath: str):
        norm_path = os.path.abspath(filepath)
        if os.path.exists(norm_path) and norm_path not in self.watched_files:
            # Start at end of file so we process real incoming lines from this moment forward
            self.watched_files[norm_path] = os.path.getsize(norm_path)

    def remove_watched_file(self, filepath: str):
        norm_path = os.path.abspath(filepath)
        self.watched_files.pop(norm_path, None)

    def start(self):
        """Start all real-time background watchers and socket listeners."""
        if self.is_running:
            return

        self.is_running = True
        self.start_time = datetime.now(timezone.utc)
        self._stop_event.clear()

        # 1. Start Real-time File Tailer Thread
        self._tail_thread = threading.Thread(target=self._tail_worker, name="SOC-RealTimeTailer", daemon=True)
        self._tail_thread.start()

        # 2. Start Real UDP Syslog Server Thread (Port 1514)
        self._syslog_thread = threading.Thread(target=self._syslog_worker, name="SOC-SyslogServer", daemon=True)
        self._syslog_thread.start()

        # 3. Start Windows Event Log Poller if running on Windows
        if os.name == "nt":
            self.last_winevent_time = datetime.now()
            self._winevent_thread = threading.Thread(target=self._windows_event_worker, name="SOC-WinEventWatcher", daemon=True)
            self._winevent_thread.start()

    def stop(self):
        """Stop all background monitoring threads."""
        self.is_running = False
        self._stop_event.set()

    # -------------------------------------------------------------------------
    # WORKER 1: Real-Time File Tailer (Monitors real appended lines)
    # -------------------------------------------------------------------------
    def _tail_worker(self):
        """Continuously tails real server log files on disk (like tail -f)."""
        while not self._stop_event.is_set():
            for filepath in list(self.watched_files.keys()):
                if not os.path.exists(filepath):
                    continue

                try:
                    current_size = os.path.getsize(filepath)
                    last_offset = self.watched_files.get(filepath, 0)

                    # Handle log rotation / truncation
                    if current_size < last_offset:
                        last_offset = 0

                    if current_size > last_offset:
                        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                            f.seek(last_offset)
                            new_lines = f.readlines()
                            self.watched_files[filepath] = f.tell()

                        cleaned_lines = [
                            l.strip() for l in new_lines
                            if l.strip() and not l.strip().startswith("#")
                        ]
                        if cleaned_lines:
                            self._process_real_lines(cleaned_lines, source_label=f"tail:{os.path.basename(filepath)}")

                except Exception:
                    pass

            time.sleep(0.5)  # Poll every 500ms for instantaneous detection

    # -------------------------------------------------------------------------
    # WORKER 2: Real Syslog UDP Receiver (Port 1514)
    # -------------------------------------------------------------------------
    def _syslog_worker(self):
        """Listens for real Syslog UDP datagrams sent over the network."""
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(1.0)
        try:
            sock.bind(("0.0.0.0", self.syslog_port))
            self.syslog_running = True
        except Exception:
            self.syslog_running = False
            return

        while not self._stop_event.is_set():
            try:
                data, addr = sock.recvfrom(4096)
                if data:
                    raw_msg = data.decode("utf-8", errors="replace").strip()
                    if raw_msg:
                        self._process_real_lines([raw_msg], source_label=f"syslog:{addr[0]}")
            except socket.timeout:
                continue
            except Exception:
                break

        sock.close()
        self.syslog_running = False

    # -------------------------------------------------------------------------
    # WORKER 3: Real Windows Event Log Poller (Security / System)
    # -------------------------------------------------------------------------
    def _windows_event_worker(self):
        """Polls real Windows Event Logs for live authentication and system events."""
        while not self._stop_event.is_set():
            try:
                # Query Windows Event Log for events in the last 15 seconds
                ps_cmd = (
                    '$since = (Get-Date).AddSeconds(-15); '
                    'try { '
                    '  $events = Get-WinEvent -FilterHashtable @{LogName="Security"; StartTime=$since} -MaxEvents 20 -ErrorAction Stop; '
                    '} catch { '
                    '  $events = Get-WinEvent -FilterHashtable @{LogName="System"; StartTime=$since} -MaxEvents 20 -ErrorAction SilentlyContinue; '
                    '} '
                    'if ($events) { '
                    '  $events | ForEach-Object { '
                    '    @{Id=$_.Id; Time=$_.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss"); Provider=$_.ProviderName; Msg=$_.Message} | ConvertTo-Json -Compress '
                    '  } '
                    '}'
                )

                proc = subprocess.run(
                    ["powershell", "-NoProfile", "-Command", ps_cmd],
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                if proc.stdout:
                    lines = [l.strip() for l in proc.stdout.splitlines() if l.strip().startswith("{")]
                    formatted_logs = []
                    for line_json in lines:
                        try:
                            ev = json.loads(line_json)
                            # Format into WindowsEventParser recognizable line
                            msg_snippet = ev.get("Msg", "").replace("\r", " ").replace("\n", " ")[:150]
                            ev_id = ev.get("Id")
                            formatted_line = f"EventID={ev_id} TimeCreated=\"{ev.get('Time')}\" Provider=\"{ev.get('Provider')}\" Description=\"{msg_snippet}\""
                            formatted_logs.append(formatted_line)
                        except Exception:
                            continue

                    if formatted_logs:
                        self._process_real_lines(formatted_logs, source_label="winevent:live")

            except Exception:
                pass

            time.sleep(10.0)  # Check Windows event log every 10 seconds

    # -------------------------------------------------------------------------
    # Core Processing: Feeds directly into Parser -> ML -> Rules -> Alert Engine
    # -------------------------------------------------------------------------
    def _process_real_lines(self, lines: List[str], source_label: str):
        db = SessionLocal()
        try:
            res = ingestion_service.ingest_lines(db, lines, file_name=source_label)
            events = res.get("events", [])
            alerts_count = 0
            if events:
                from backend.app.detection.pipeline import detection_pipeline
                alerts = detection_pipeline.process_events(db, events)
                alerts_count = len(alerts)
            self.total_live_events_processed += len(lines)
            self.live_threats_caught += alerts_count
        except Exception:
            pass
        finally:
            db.close()

    def get_status(self) -> Dict[str, Any]:
        uptime_sec = 0
        if self.start_time:
            uptime_sec = int((datetime.now(timezone.utc) - self.start_time).total_seconds())

        return {
            "is_running": self.is_running,
            "syslog_listener": {
                "port": self.syslog_port,
                "active": self.syslog_running,
                "protocol": "UDP"
            },
            "watched_files": [
                {"path": p, "bytes_tracked": offset, "exists": os.path.exists(p)}
                for p, offset in self.watched_files.items()
            ],
            "total_live_events_processed": self.total_live_events_processed,
            "live_threats_caught": self.live_threats_caught,
            "uptime_seconds": uptime_sec,
            "started_at": self.start_time.isoformat() if self.start_time else None
        }

# Global singleton
live_monitor_service = LiveMonitorService()
