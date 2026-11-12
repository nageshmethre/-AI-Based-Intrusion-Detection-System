from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class LogOut(BaseModel):
    id: int
    raw_text: str
    source_format: str
    file_name: Optional[str] = None
    line_number: Optional[int] = None
    ingested_at: datetime

    class Config:
        from_attributes = True

class LogUploadResponse(BaseModel):
    file_name: str
    total_lines: int
    parsed_events: int
    alerts_generated: int
    format_detected: str
    message: str
