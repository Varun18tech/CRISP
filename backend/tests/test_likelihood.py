import pytest
import math
from backend.app.risk_engine.likelihood import calculate_likelihood
from backend.app.risk_engine.configuration import RiskEngineConfig

def test_likelihood_calculation():
    # Base calculation with standard weights
    # 0.30*90 (27.0) + 0.25*80 (20.0) + 0.20*100 (20.0) + 0.15*98 (14.7) + 0.10*70 (7.0) = 88.7
    score = calculate_likelihood(
        exploitability=90,
        threat_activity=80,
        exposure=100,
        vuln_severity=98,
        historical_incidents=70,
    )
    assert math.isclose(score, 88.7, abs_tol=1.5)

def test_likelihood_clamping():
    # Values above 100 should be clamped to 100
    score_high = calculate_likelihood(150, 200, 110, 105, 120)
    assert score_high == 100.0

    # Values below 0 should be clamped to 0
    score_low = calculate_likelihood(-10, -50, -5, 0, -2)
    assert score_low == 0.0

def test_custom_likelihood_weights():
    custom_config = RiskEngineConfig(
        weight_exploitability=0.50,
        weight_threat_activity=0.50,
        weight_exposure=0.0,
        weight_vuln_severity=0.0,
        weight_historical_incidents=0.0,
    )
    score = calculate_likelihood(80, 60, 100, 100, 100, config=custom_config)
    # 0.50*80 + 0.50*60 = 70.0
    assert score == 70.0
