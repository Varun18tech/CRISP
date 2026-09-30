from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class RiskCalculateRequest(BaseModel):
    asset_id: str
    vulnerability_id: str
    threat_id: str
    organization_id: Optional[str] = "org_default"
    
    # Optional raw values to override asset defaults if modeling on the fly
    exploitability: Optional[float] = None
    threat_activity: Optional[float] = None
    exposure: Optional[float] = None
    vuln_severity: Optional[float] = None
    historical_incidents: Optional[float] = None
    
    financial_impact: Optional[float] = None
    data_sensitivity: Optional[float] = None
    business_criticality: Optional[float] = None
    regulatory_impact: Optional[float] = None
    availability_impact: Optional[float] = None
    
    control_ids: Optional[List[str]] = None
    annual_frequency: Optional[float] = None
    loss_magnitude: Optional[float] = None

class RiskResponse(BaseModel):
    id: str
    organization_id: str
    asset_id: str
    asset_name: Optional[str] = None
    vulnerability_id: str
    vulnerability_name: Optional[str] = None
    threat_id: str
    threat_name: Optional[str] = None
    
    likelihood: float
    impact: float
    inherent_risk: float
    control_effectiveness: float
    residual_risk: float
    
    annual_frequency: float
    loss_magnitude: float
    eal: float
    
    risk_level: str
    risk_status: str = "Active"
    calculation_version: str = "v1"
    
    drivers: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RiskRankingResponse(BaseModel):
    items: List[RiskResponse]
    total_eal: float
    total_residual_risk: float
    critical_count: int
