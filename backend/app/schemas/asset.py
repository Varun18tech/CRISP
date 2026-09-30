from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AssetBase(BaseModel):
    name: str
    asset_type: str
    description: Optional[str] = None
    criticality: str = "High"
    business_value: float = 0.00
    data_sensitivity: float = 50.00
    internet_exposed: bool = False
    owner: Optional[str] = None
    environment: str = "Production"
    status: str = "Active"

class AssetCreate(AssetBase):
    organization_id: Optional[str] = "org_default"

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    description: Optional[str] = None
    criticality: Optional[str] = None
    business_value: Optional[float] = None
    data_sensitivity: Optional[float] = None
    internet_exposed: Optional[bool] = None
    owner: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[str] = None

class AssetResponse(AssetBase):
    id: str
    organization_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
