import pytest
from backend.app.risk_engine.ranking import rank_risks, calculate_priority_rank_score

def test_deterministic_risk_ranking():
    risks = [
        {"id": "r1", "residual_risk": 20.0, "eal": 500000.0, "criticality": "Low"},
        {"id": "r2", "residual_risk": 75.0, "eal": 10000000.0, "criticality": "Critical"},
        {"id": "r3", "residual_risk": 45.0, "eal": 3000000.0, "criticality": "High"},
    ]

    ranked = rank_risks(risks)
    assert len(ranked) == 3
    # r2 must be ranked #1
    assert ranked[0]["id"] == "r2"
    assert ranked[0]["priority_rank"] == 1
    # r3 must be ranked #2
    assert ranked[1]["id"] == "r3"
    assert ranked[1]["priority_rank"] == 2
    # r1 must be ranked #3
    assert ranked[2]["id"] == "r1"
    assert ranked[2]["priority_rank"] == 3

def test_ranking_empty_list():
    assert rank_risks([]) == []
