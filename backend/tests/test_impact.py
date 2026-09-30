import pytest
import math
from backend.app.risk_engine.impact import calculate_impact
from backend.app.risk_engine.configuration import RiskEngineConfig

def test_impact_calculation():
    # 0.30*90 (27.0) + 0.25*95 (23.75) + 0.20*100 (20.0) + 0.15*80 (12.0) + 0.10*70 (7.0) = 89.75
    score = calculate_impact(
        financial_impact=90,
        data_sensitivity=95,
        business_criticality=100,
        regulatory_impact=80,
        availability_impact=70,
    )
    assert math.isclose(score, 89.75, abs_tol=1.0)

def test_impact_clamping():
    score_max = calculate_impact(120, 110, 105, 100, 130)
    assert score_max == 100.0

    score_min = calculate_impact(-10, -5, 0, -2, -8)
    assert score_min == 0.0

def test_custom_impact_weights():
    custom_config = RiskEngineConfig(
        weight_financial_impact=0.60,
        weight_data_sensitivity=0.40,
        weight_business_criticality=0.0,
        weight_regulatory_impact=0.0,
        weight_availability_impact=0.0,
    )
    # 0.60*50 + 0.40*80 = 30 + 32 = 62.0
    score = calculate_impact(50, 80, 0, 0, 0, config=custom_config)
    assert score == 62.0
