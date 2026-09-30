import pytest
import math
from backend.app.risk_engine.exposure import calculate_exposure, classify_risk_level
from backend.app.risk_engine.residual_risk import calculate_residual_risk, calculate_composite_control_effectiveness

def test_risk_exposure():
    # Example from Section 1.6: Likelihood = 90, Impact = 85 -> 90 * 85 / 100 = 76.5
    exposure = calculate_exposure(90, 85)
    assert exposure == 76.5

    # Test case from Section 9: ~89.7 * ~89.25 / 100 ≈ 80.05
    exposure_spec = calculate_exposure(89.7, 89.25)
    assert math.isclose(exposure_spec, 80.05, abs_tol=0.2)

def test_risk_classification():
    assert classify_risk_level(15) == "Low"
    assert classify_risk_level(20) == "Low"
    assert classify_risk_level(25) == "Moderate"
    assert classify_risk_level(40) == "Moderate"
    assert classify_risk_level(55) == "High"
    assert classify_risk_level(60) == "High"
    assert classify_risk_level(75) == "Very High"
    assert classify_risk_level(80) == "Very High"
    assert classify_risk_level(85) == "Critical"
    assert classify_risk_level(100) == "Critical"

def test_residual_risk_preservation():
    # Inherent risk must NEVER be modified or overwritten
    inherent, residual = calculate_residual_risk(inherent_risk=80.05, control_effectiveness=35.0)
    assert inherent == 80.05
    # 80.05 * (1 - 0.35) = 80.05 * 0.65 = 52.0325 -> 52.03
    assert math.isclose(residual, 52.03, abs_tol=0.1)

def test_composite_controls():
    # Two controls: WAF (eff=70, cov=80 -> mit=0.56) and EDR (eff=80, cov=90 -> mit=0.72)
    # unmitigated = (1 - 0.56) * (1 - 0.72) = 0.44 * 0.28 = 0.1232
    # combined = (1 - 0.1232) * 100 = 87.68%
    controls = [
        {"effectiveness": 70, "coverage": 80},
        {"effectiveness": 80, "coverage": 90},
    ]
    eff = calculate_composite_control_effectiveness(controls)
    assert math.isclose(eff, 87.68, abs_tol=0.5)
