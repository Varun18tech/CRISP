from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InvestmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "Tooling"
    cost: float = 0.00
    implementation_time: str = "30 days"
    expected_likelihood_reduction: float = 0.00
    expected_impact_reduction: float = 0.00
    expected_risk_reduction: float = 0.00
    expected_eal_reduction: float = 0.00
    roi: float = 0.00
    status: str = "Proposed"

class InvestmentCreate(InvestmentBase):
    organization_id: Optional[str] = "org_default"

class InvestmentResponse(InvestmentBase):
    id: str
    organization_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ScenarioOptimizationRequest(BaseModel):
    investment_ids: List[str]
    budget_limit: Optional[float] = None

class ScenarioComparisonResult(BaseModel):
    option_id: str
    name: str
    cost: float
    projected_risk_reduction: float
    projected_eal_reduction: float
    projected_residual_eal: float
    roi: float
