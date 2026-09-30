from pydantic import BaseModel, Field, field_validator
from typing import Any, Dict, List, Optional
import math


class PortfolioRiskInput(BaseModel):
    risk_id: str
    risk_name: str
    current_risk: float = Field(ge=0)
    expected_residual_risk: float = Field(ge=0)
    remediation_cost: float = Field(ge=0)
    business_criticality: float = Field(default=50, ge=0, le=100)
    cvss_score: Optional[float] = Field(default=None, ge=0, le=10)
    threat_activity: float = Field(default=50, ge=0, le=100)
    exposure: float = Field(default=50, ge=0, le=100)


class PortfolioOptimizationRequest(BaseModel):
    available_budget: float = Field(ge=0)
    risks: List[PortfolioRiskInput] = Field(min_length=1, max_length=20)


class BudgetOptimizerRequest(BaseModel):
    available_budget: float
    currency: str = Field(default="INR", min_length=3, max_length=3)
    organization_id: str = Field(default="org_default")
    risks: Optional[List[Dict[str, Any]]] = None

    @field_validator("available_budget")
    @classmethod
    def validate_budget_finite(cls, v: float) -> float:
        if v is None or math.isnan(v) or math.isinf(v):
            raise ValueError("Budget must be a finite number")
        if v < 0:
            raise ValueError("Budget cannot be negative")
        return v
