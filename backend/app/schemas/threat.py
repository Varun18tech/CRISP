from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ThreatBase(BaseModel):
    name: str
    description: Optional[str] = None
    threat_type: str
    activity_level: float = 50.00
    source: Optional[str] = None

class ThreatCreate(ThreatBase):
    organization_id: Optional[str] = "org_default"

class ThreatResponse(ThreatBase):
    id: str
    organization_id: str
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
