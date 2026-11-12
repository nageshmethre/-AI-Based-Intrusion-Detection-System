from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class RuleBase(BaseModel):
    rule_code: str
    name: str
    description: str
    attack_type: str
    severity: str
    threshold_value: float
    time_window_minutes: int
    is_enabled: bool = True
    config_json: Optional[str] = None

class RuleCreate(RuleBase):
    pass

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    threshold_value: Optional[float] = None
    time_window_minutes: Optional[int] = None
    is_enabled: Optional[bool] = None
    config_json: Optional[str] = None

class RuleOut(RuleBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
