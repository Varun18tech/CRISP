from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ControlBase(BaseModel):
    name: str
    control_type: str
    description: Optional[str] = None
    effectiveness: float = 70.00
    coverage: float = 80.00
    status: str = "Operational"

class ControlCreate(ControlBase):
    organization_id: Optional[str] = "org_default"

class ControlUpdate(BaseModel):
    name: Optional[str] = None
    control_type: Optional[str] = None
    description: Optional[str] = None
    effectiveness: Optional[float] = None
    coverage: Optional[float] = None
    status: Optional[str] = None

class ControlResponse(ControlBase):
    id: str
    organization_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
