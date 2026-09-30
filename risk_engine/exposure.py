from backend.app.risk_engine.configuration import RiskEngineConfig, default_risk_config

def calculate_exposure(likelihood: float, impact: float) -> float:
    """
    Calculates inherent risk exposure:
    RiskExposure = Likelihood * Impact / 100
    Result is strictly on a 0-100 scale.
    """
    l = max(0.0, min(100.0, float(likelihood)))
    i = max(0.0, min(100.0, float(impact)))
    exposure = (l * i) / 100.0
    return round(exposure, 2)

def classify_risk_level(score: float, config: RiskEngineConfig = default_risk_config) -> str:
    """
    Classifies risk score into organizational tier based on configurable thresholds:
    0 - <= threshold_low: Low
    > threshold_low - <= threshold_moderate: Moderate
    > threshold_moderate - <= threshold_high: High
    > threshold_high - <= threshold_very_high: Very High
    > threshold_very_high: Critical
    """
    s = float(score)
    if s <= config.threshold_low:
        return "Low"
    elif s <= config.threshold_moderate:
        return "Moderate"
    elif s <= config.threshold_high:
        return "High"
    elif s <= config.threshold_very_high:
        return "Very High"
    else:
        return "Critical"
