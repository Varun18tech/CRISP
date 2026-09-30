from backend.app.risk_engine.configuration import RiskEngineConfig, default_risk_config

def calculate_likelihood(
    exploitability: float,
    threat_activity: float,
    exposure: float,
    vuln_severity: float,
    historical_incidents: float,
    config: RiskEngineConfig = default_risk_config,
) -> float:
    """
    Calculates likelihood on a normalized 0-100 scale using configurable weights.
    Likelihood =
        w_exploit * Exploitability
      + w_threat * ThreatActivity
      + w_exposure * Exposure
      + w_severity * VulnerabilitySeverity
      + w_incidents * HistoricalIncidentFrequency
    """
    # Clamp inputs between 0 and 100
    e = max(0.0, min(100.0, float(exploitability)))
    t = max(0.0, min(100.0, float(threat_activity)))
    x = max(0.0, min(100.0, float(exposure)))
    v = max(0.0, min(100.0, float(vuln_severity)))
    h = max(0.0, min(100.0, float(historical_incidents)))

    likelihood = (
        config.weight_exploitability * e
        + config.weight_threat_activity * t
        + config.weight_exposure * x
        + config.weight_vuln_severity * v
        + config.weight_historical_incidents * h
    )

    return round(max(0.0, min(100.0, likelihood)), 2)
