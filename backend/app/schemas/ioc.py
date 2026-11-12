from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class IOCBase(BaseModel):
    value: str
    ioc_type: str
    risk_level: str = "SUSPICIOUS"
    status: str = "ACTIVE"
    notes: Optional[str] = None

class IOCCreate(IOCBase):
    pass

class IOCOut(IOCBase):
    id: int
    first_seen: datetime
    last_seen: datetime
    event_count: int

    class Config:
        from_attributes = True

class PaginatedIOCs(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[IOCOut]
