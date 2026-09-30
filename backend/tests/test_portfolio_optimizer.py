from backend.app.services.portfolio_optimizer import optimize_portfolio

def test_budget_optimizer_selects_combination_not_highest_cvss():
    result = optimize_portfolio([
        {"risk_id":"a","risk_name":"A","cvss_score":9.5,"current_risk":90,"expected_residual_risk":25,"remediation_cost":900000,"business_criticality":90},
        {"risk_id":"b","risk_name":"B","cvss_score":7.5,"current_risk":70,"expected_residual_risk":10,"remediation_cost":400000,"business_criticality":70},
        {"risk_id":"c","risk_name":"C","cvss_score":7.9,"current_risk":75,"expected_residual_risk":12,"remediation_cost":400000,"business_criticality":75},
    ], 1000000)
    assert {risk["risk_id"] for risk in result["selected_risks"]} == {"b", "c"}
    assert result["remaining_budget"] == 200000

def test_zero_budget_defers_everything():
    result = optimize_portfolio([{"risk_id":"a","risk_name":"A","current_risk":50,"expected_residual_risk":20,"remediation_cost":1}], 0)
    assert not result["selected_risks"]
    assert len(result["deferred_risks"]) == 1
