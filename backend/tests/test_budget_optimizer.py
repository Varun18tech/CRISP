from backend.app.services.budget_optimizer_service import (
    run_budget_optimization,
    clear_optimizer_cache,
    normalize_currency,
)
from backend.tests.test_portfolio_optimizer import (
    test_budget_optimizer_selects_combination_not_highest_cvss,
    test_zero_budget_defers_everything,
)


def test_case_1_budget_lower_than_most_remediation_costs():
    """Case 1: Budget lower than most remediation costs."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R1", "risk_name": "Gateway RCE", "cvss_score": 9.8, "current_risk": 90, "expected_residual_risk": 20, "remediation_cost": 1500000},
        {"risk_id": "R2", "risk_name": "DB Exposure", "cvss_score": 8.5, "current_risk": 80, "expected_residual_risk": 25, "remediation_cost": 900000},
        {"risk_id": "R3", "risk_name": "Auth Bypass", "cvss_score": 7.4, "current_risk": 55, "expected_residual_risk": 15, "remediation_cost": 350000},
    ]
    res = run_budget_optimization(available_budget=400000, currency="INR", raw_risks=risks)
    assert res["budget_constraint_active"] is True
    assert res["selected_count"] == 1
    assert res["selected_risks"][0]["risk_id"] == "R3"
    assert res["recommended_investment"] == 350000
    assert res["remaining_budget"] == 50000
    assert res["deferred_count"] == 2


def test_case_2_budget_exactly_equal_to_useful_combination():
    """Case 2: Budget exactly equal to a useful combination."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R1", "risk_name": "Risk 1", "cvss_score": 9.0, "current_risk": 70, "expected_residual_risk": 50, "remediation_cost": 800000},
        {"risk_id": "R2", "risk_name": "Risk 2", "cvss_score": 7.8, "current_risk": 60, "expected_residual_risk": 25, "remediation_cost": 400000},
        {"risk_id": "R3", "risk_name": "Risk 3", "cvss_score": 7.6, "current_risk": 55, "expected_residual_risk": 20, "remediation_cost": 400000},
    ]
    res = run_budget_optimization(available_budget=800000, currency="INR", raw_risks=risks)
    assert {r["risk_id"] for r in res["selected_risks"]} == {"R2", "R3"}
    assert res["recommended_investment"] == 800000
    assert res["remaining_budget"] == 0
    assert res["total_risk_reduction"] == 70.0


def test_case_3_and_4_portfolio_combinations_beat_single_high_cvss_risk():
    """Case 3 & 4 & Section 63: Higher-CVSS expensive risk vs multiple lower-cost risks."""
    clear_optimizer_cache()
    risks = [
        {
            "risk_id": "risk_a",
            "risk_name": "Core Gateway RCE",
            "cvss_score": 9.8,
            "current_risk": 80,
            "expected_residual_risk": 60,  # reduction = 20
            "remediation_cost": 900000,
            "business_criticality": "High",
        },
        {
            "risk_id": "risk_b",
            "risk_name": "Internal API Injection",
            "cvss_score": 7.5,
            "current_risk": 50,
            "expected_residual_risk": 35,  # reduction = 15
            "remediation_cost": 400000,
            "business_criticality": "High",
        },
        {
            "risk_id": "risk_c",
            "risk_name": "Session Token Exposure",
            "cvss_score": 7.9,
            "current_risk": 45,
            "expected_residual_risk": 31,  # reduction = 14
            "remediation_cost": 400000,
            "business_criticality": "High",
        },
    ]
    res = run_budget_optimization(available_budget=1000000, currency="INR", raw_risks=risks)
    selected_ids = {r["risk_id"] for r in res["selected_risks"]}
    assert selected_ids == {"risk_b", "risk_c"}
    assert res["recommended_investment"] == 800000
    assert res["remaining_budget"] == 200000
    assert res["total_risk_reduction"] == 29.0
    assert res["deferred_risks"][0]["risk_id"] == "risk_a"
    assert "portfolio" in res["deferred_risks"][0]["decision_reason"].lower()


def test_case_5_budget_larger_than_all_eligible_remediation_costs():
    """Case 5 & Section 26-27: Budget larger than all eligible remediation costs does not force full spend."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R1", "risk_name": "Risk 1", "cvss_score": 8.2, "current_risk": 65, "expected_residual_risk": 20, "remediation_cost": 500000},
        {"risk_id": "R2", "risk_name": "Risk 2", "cvss_score": 7.1, "current_risk": 50, "expected_residual_risk": 15, "remediation_cost": 800000},
    ]
    res = run_budget_optimization(available_budget=2000000, currency="INR", raw_risks=risks)
    assert res["selected_count"] == 2
    assert res["deferred_count"] == 0
    assert res["recommended_investment"] == 1300000
    assert res["remaining_budget"] == 700000
    assert res["budget_constraint_active"] is False
    assert res["explanation"]["unused_budget_reason"] is not None


def test_case_6_zero_budget():
    """Case 6 & Section 25: Zero budget defers all eligible remediations honestly."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R1", "risk_name": "Risk 1", "cvss_score": 9.1, "current_risk": 80, "expected_residual_risk": 20, "remediation_cost": 300000},
    ]
    res = run_budget_optimization(available_budget=0, currency="INR", raw_risks=risks)
    assert res["recommended_investment"] == 0
    assert res["remaining_budget"] == 0
    assert res["selected_count"] == 0
    assert res["deferred_count"] == 1
    assert res["overall_risk_reduction_percent"] == 0.0


def test_case_7_missing_remediation_cost():
    """Case 7 & Section 15: Missing remediation cost is never assigned 0 or guessed."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R_VALID", "risk_name": "Valid Risk", "cvss_score": 8.0, "current_risk": 70, "expected_residual_risk": 30, "remediation_cost": 400000},
        {"risk_id": "R_NO_COST", "risk_name": "No Cost Risk", "cvss_score": 9.9, "current_risk": 95, "expected_residual_risk": 10, "remediation_cost": None},
    ]
    res = run_budget_optimization(available_budget=1000000, currency="INR", raw_risks=risks)
    assert {r["risk_id"] for r in res["selected_risks"]} == {"R_VALID"}
    assert res["data_insufficient_count"] == 1
    assert res["data_insufficient_risks"][0]["risk_id"] == "R_NO_COST"
    assert res["data_insufficient_risks"][0]["remediation_state"] == "Cost unavailable"
    assert any("remediation cost data is missing" in w for w in res["warnings"])


def test_case_8_missing_expected_risk_reduction():
    """Case 8 & Section 16: Missing expected risk reduction is classified as Data Insufficient."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R_VALID", "risk_name": "Valid Risk", "cvss_score": 7.5, "current_risk": 60, "expected_residual_risk": 20, "remediation_cost": 300000},
        {"risk_id": "R_NO_RED", "risk_name": "No Reduction Risk", "cvss_score": 8.8, "current_risk": 80, "expected_residual_risk": None, "remediation_cost": 250000},
    ]
    res = run_budget_optimization(available_budget=1000000, currency="INR", raw_risks=risks)
    assert {r["risk_id"] for r in res["selected_risks"]} == {"R_VALID"}
    assert res["data_insufficient_count"] == 1
    assert res["data_insufficient_risks"][0]["risk_id"] == "R_NO_RED"
    assert res["data_insufficient_risks"][0]["remediation_state"] == "Risk reduction unavailable"
    assert res["data_insufficient_risks"][0]["optimization_state"] == "Data Insufficient"


def test_case_9_already_remediated_risks():
    """Case 9 & Section 17: Already remediated risks are excluded from new spending."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R_DONE", "risk_name": "Patched Risk", "cvss_score": 9.0, "current_risk": 75, "expected_residual_risk": 10, "remediation_cost": 200000, "status": "Remediated"},
        {"risk_id": "R_OPEN", "risk_name": "Open Risk", "cvss_score": 7.2, "current_risk": 60, "expected_residual_risk": 20, "remediation_cost": 300000, "status": "Open"},
    ]
    res = run_budget_optimization(available_budget=1000000, currency="INR", raw_risks=risks)
    assert {r["risk_id"] for r in res["selected_risks"]} == {"R_OPEN"}
    assert res["already_remediated_count"] == 1
    assert res["already_remediated_risks"][0]["risk_id"] == "R_DONE"
    assert res["recommended_investment"] == 300000


def test_case_10_duplicate_risks():
    """Case 10: Duplicate risk IDs are deduplicated deterministically."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "DUP_1", "risk_name": "Duplicate Risk", "cvss_score": 8.0, "current_risk": 70, "expected_residual_risk": 20, "remediation_cost": 300000},
        {"risk_id": "DUP_1", "risk_name": "Duplicate Risk Copy", "cvss_score": 8.0, "current_risk": 70, "expected_residual_risk": 20, "remediation_cost": 300000},
    ]
    res = run_budget_optimization(available_budget=1000000, currency="INR", raw_risks=risks)
    assert len(res["all_risk_allocations"]) == 1
    assert res["selected_count"] == 1
    assert any("duplicate" in w.lower() for w in res["warnings"])


def test_case_11_multiple_currencies():
    """Case 11 & Section 3: Currency normalization works properly without double conversion."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R1", "risk_name": "Risk 1", "cvss_score": 8.5, "current_risk": 80, "expected_residual_risk": 20, "remediation_cost": 835000, "currency": "INR"},
    ]
    # 10,000 USD == 835,000 INR at 83.5 rate
    res = run_budget_optimization(available_budget=10000, currency="USD", raw_risks=risks)
    assert res["budget"]["entered_currency"] == "USD"
    assert res["budget"]["entered_amount"] == 10000
    assert res["budget"]["normalized_amount_inr"] == 835000.0
    assert res["selected_count"] == 1
    assert res["recommended_investment"] == 10000.0
    assert res["remaining_budget"] == 0.0


def test_case_12_and_boundaries_changed_budget_and_exact_boundaries():
    """Case 12 & Section 64: Boundary tests (budget=1, just below, exact, just above, decimal)."""
    clear_optimizer_cache()
    risks = [
        {"risk_id": "R1", "risk_name": "Risk 1", "cvss_score": 8.0, "current_risk": 70, "expected_residual_risk": 30, "remediation_cost": 500000},
        {"risk_id": "R2", "risk_name": "Risk 2", "cvss_score": 8.2, "current_risk": 75, "expected_residual_risk": 25, "remediation_cost": 500000},
    ]
    # Budget = 1
    r_one = run_budget_optimization(available_budget=1, currency="INR", raw_risks=risks)
    assert r_one["selected_count"] == 0

    # Just below single risk (499,999.99)
    r_below = run_budget_optimization(available_budget=499999.99, currency="INR", raw_risks=risks)
    assert r_below["selected_count"] == 0

    # Exact single risk (500,000) -> picks R2 because reduction 50 > 40
    r_exact1 = run_budget_optimization(available_budget=500000, currency="INR", raw_risks=risks)
    assert [r["risk_id"] for r in r_exact1["selected_risks"]] == ["R2"]

    # Exact combined (1,000,000) -> picks R1 + R2
    r_exact2 = run_budget_optimization(available_budget=1000000, currency="INR", raw_risks=risks)
    assert {r["risk_id"] for r in r_exact2["selected_risks"]} == {"R1", "R2"}

    # Just above (1,000,000.50)
    r_above = run_budget_optimization(available_budget=1000000.50, currency="INR", raw_risks=risks)
    assert r_above["remaining_budget"] == 0.50

    # Invalid negative budget
    try:
        normalize_currency(-100, "INR")
        assert False, "Expected ValueError for negative budget"
    except ValueError:
        pass

    try:
        normalize_currency(1000, "INVALID_CUR")
        assert False, "Expected ValueError for invalid currency"
    except ValueError:
        pass


if __name__ == "__main__":
    test_budget_optimizer_selects_combination_not_highest_cvss()
    test_zero_budget_defers_everything()
    test_case_1_budget_lower_than_most_remediation_costs()
    test_case_2_budget_exactly_equal_to_useful_combination()
    test_case_3_and_4_portfolio_combinations_beat_single_high_cvss_risk()
    test_case_5_budget_larger_than_all_eligible_remediation_costs()
    test_case_6_zero_budget()
    test_case_7_missing_remediation_cost()
    test_case_8_missing_expected_risk_reduction()
    test_case_9_already_remediated_risks()
    test_case_10_duplicate_risks()
    test_case_11_multiple_currencies()
    test_case_12_and_boundaries_changed_budget_and_exact_boundaries()
    print("ALL BUDGET OPTIMIZER FUNCTIONAL & BOUNDARY TESTS PASSED SUCCESSFULLY!")
