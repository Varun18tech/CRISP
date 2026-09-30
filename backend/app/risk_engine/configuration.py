from pydantic import BaseModel
from typing import Dict
from backend.app.core.config import settings

class RiskEngineConfig(BaseModel):
    # Likelihood Weights (must sum to 1.0)
    weight_exploitability: float = settings.WEIGHT_EXPLOITABILITY
    weight_threat_activity: float = settings.WEIGHT_THREAT_ACTIVITY
    weight_exposure: float = settings.WEIGHT_EXPOSURE
    weight_vuln_severity: float = settings.WEIGHT_VULN_SEVERITY
    weight_historical_incidents: float = settings.WEIGHT_HISTORICAL_INCIDENTS

    # Impact Weights (must sum to 1.0)
    weight_financial_impact: float = settings.WEIGHT_FINANCIAL_IMPACT
    weight_data_sensitivity: float = settings.WEIGHT_DATA_SENSITIVITY
    weight_business_criticality: float = settings.WEIGHT_BUSINESS_CRITICALITY
    weight_regulatory_impact: float = settings.WEIGHT_REGULATORY_IMPACT
    weight_availability_impact: float = settings.WEIGHT_AVAILABILITY_IMPACT

    # Classification Thresholds
    threshold_low: float = settings.THRESHOLD_LOW
    threshold_moderate: float = settings.THRESHOLD_MODERATE
    threshold_high: float = settings.THRESHOLD_HIGH
    threshold_very_high: float = settings.THRESHOLD_VERY_HIGH

    currency: str = settings.DEFAULT_CURRENCY
    version: str = settings.CALCULATION_VERSION

default_risk_config = RiskEngineConfig()
