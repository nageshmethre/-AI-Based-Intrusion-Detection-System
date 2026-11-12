import pytest
from backend.app.parsers import parser_manager

def test_linux_ssh_failed_login():
    line = "Oct 10 14:22:01 web01 sshd[12345]: Failed password for invalid user admin from 192.168.1.100 port 44212 ssh2"
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "AUTH"
    assert event.action == "LOGIN"
    assert event.status == "FAILURE"
    assert event.source_ip == "192.168.1.100"
    assert event.destination_port == 44212
    assert event.username == "admin"
    assert event.protocol == "SSH"

def test_linux_ssh_accepted_login():
    line = "Oct 10 14:25:12 web01 sshd[12350]: Accepted password for deploy from 192.168.1.50 port 51234 ssh2"
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "AUTH"
    assert event.action == "LOGIN"
    assert event.status == "SUCCESS"
    assert event.source_ip == "192.168.1.50"
    assert event.username == "deploy"

def test_linux_sudo_command():
    line = "Oct 10 14:28:00 web01 sudo:   alice : TTY=pts/0 ; PWD=/home/alice ; USER=root ; COMMAND=/bin/bash"
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "SYSTEM"
    assert event.action == "SUDO"
    assert event.username == "alice"
    assert event.resource == "/bin/bash"

def test_web_access_log():
    line = '10.0.0.15 - alice [10/Oct/2026:13:55:36 +0000] "GET /api/v1/users HTTP/1.1" 200 4520 "https://portal.internal" "Mozilla/5.0"'
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "WEB"
    assert event.source_ip == "10.0.0.15"
    assert event.username == "alice"
    assert event.action == "HTTP_GET"
    assert event.status == "SUCCESS"
    assert event.resource == "/api/v1/users"

def test_web_exploit_detection():
    line = '192.168.5.20 - - [10/Oct/2026:14:00:00 +0000] "GET /products.php?id=1%27%20UNION%20SELECT%20null,null HTTP/1.1" 500 1234'
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "WEB"
    assert event.severity in ("HIGH", "CRITICAL")

def test_windows_event_4625_logon_failure():
    line = "2026-10-10 14:35:15 Security 4625 Microsoft-Windows-Security-Auditing An account failed to log on. TargetUserName: Admin, IpAddress: 192.168.1.55"
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "AUTH"
    assert event.status == "FAILURE"
    assert event.source_ip == "192.168.1.55"
    assert event.username == "Admin"

def test_windows_event_4688_process_creation():
    line = "2026-10-10 14:37:00 Security 4688 Microsoft-Windows-Security-Auditing A new process has been created. ProcessName: C:\\Windows\\System32\\cmd.exe, SubjectUserName: SYSTEM"
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "SYSTEM"
    assert event.action == "PROCESS_CREATE"
    assert event.username == "SYSTEM"

def test_json_log_entry():
    line = '{"timestamp": "2026-10-10T14:40:00Z", "source_ip": "172.16.1.99", "username": "analyst1", "action": "LOGIN", "status": "SUCCESS", "event_type": "AUTH"}'
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "AUTH"
    assert event.source_ip == "172.16.1.99"
    assert event.username == "analyst1"
    assert event.status == "SUCCESS"

def test_unknown_event_fallback():
    line = "Custom appliance log: connection dropped from 203.0.113.44 due to policy rule"
    event = parser_manager.parse_line(line)
    assert event is not None
    assert event.event_type == "UNKNOWN_EVENT"
    assert event.source_ip == "203.0.113.44"
