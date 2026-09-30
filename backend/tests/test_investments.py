import pytest
from backend.app.risk_engine.eal import calculate_investment_benefit

def test_investment_scenario_comparison():
    # Option A: Patch critical vulnerability
    # Cost: 2L, Current EAL: 18L, Residual EAL: 11L -> EAL reduction: 7L
    opt_a = calculate_investment_benefit(current_eal=1800000, residual_eal=1100000, investment_cost=200000)
    assert opt_a["annual_eal_reduction"] == 700000
    assert opt_a["roi_percentage"] == 250.0  # (7L - 2L)/2L = 2.5 * 100 = 250%

    # Option B: Deploy WAF
    # Cost: 5L, Current EAL: 18L, Residual EAL: 8L -> EAL reduction: 10L
    opt_b = calculate_investment_benefit(current_eal=1800000, residual_eal=800000, investment_cost=500000)
    assert opt_b["annual_eal_reduction"] == 1000000
    assert opt_b["roi_percentage"] == 100.0  # (10L - 5L)/5L = 1.0 * 100 = 100%

    # Option A has higher ROI percentage, but Option B achieves higher absolute loss reduction
    assert opt_a["roi_percentage"] > opt_b["roi_percentage"]
    assert opt_b["annual_eal_reduction"] > opt_a["annual_eal_reduction"]
