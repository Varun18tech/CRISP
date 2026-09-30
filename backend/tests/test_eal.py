import pytest
from backend.app.risk_engine.eal import calculate_eal, calculate_investment_benefit

def test_eal_calculation():
    # Section 1.9 spec example: 0.25 * 40,00,000 = 10,00,000
    eal = calculate_eal(annual_frequency=0.25, loss_magnitude=4000000)
    assert eal == 1000000.0

def test_eal_zero_cases():
    assert calculate_eal(0, 5000000) == 0.0
    assert calculate_eal(0.5, 0) == 0.0

def test_investment_benefit():
    # Current EAL = 18L, Residual EAL = 8L, Cost = 5L
    # Benefit = 10L, ROI = (10L - 5L)/5L * 100 = 100%
    result = calculate_investment_benefit(
        current_eal=1800000,
        residual_eal=800000,
        investment_cost=500000,
    )
    assert result["annual_eal_reduction"] == 1000000.0
    assert result["investment_cost"] == 500000.0
    assert result["roi_percentage"] == 100.0
