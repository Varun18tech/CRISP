from backend.app.risk_engine.configuration import RiskEngineConfig, default_risk_config

def calculate_impact(
    financial_impact: float,
    data_sensitivity: float,
    business_criticality: float,
    regulatory_impact: float,
    availability_impact: float,
    config: RiskEngineConfig = default_risk_config,
) -> float:
    """
    Calculates business impact on a normalized 0-100 scale using configurable weights.
    Impact =
        w_financial * FinancialImpact
      + w_sensitivity * DataSensitivity
      + w_criticality * BusinessCriticality
      + w_regulatory * RegulatoryImpact
      + w_availability * AvailabilityImpact
    """
    f = max(0.0, min(100.0, float(financial_impact)))
    s = max(0.0, min(100.0, float(data_sensitivity)))
    c = max(0.0, min(100.0, float(business_criticality)))
    r = max(0.0, min(100.0, float(regulatory_impact)))
    a = max(0.0, min(100.0, float(availability_impact)))

    impact = (
        config.weight_financial_impact * f
        + config.weight_data_sensitivity * s
        + config.weight_business_criticality * c
        + config.weight_regulatory_impact * r
        + config.weight_availability_impact * a
    )

    return round(max(0.0, min(100.0, impact)), 2)
