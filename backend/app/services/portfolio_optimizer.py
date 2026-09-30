"""Deterministic, explainable budget-constrained remediation selection."""
from __future__ import annotations

from itertools import combinations
from typing import Any, Dict, Iterable, List


def cvss_severity(score: float) -> str:
    if score < 0 or score > 10:
        raise ValueError("cvss_score must be between 0.0 and 10.0")
    if score == 0:
        return "LOW"
    if score < 4:
        return "LOW"
    if score < 7:
        return "MEDIUM"
    if score < 9:
        return "HIGH"
    return "CRITICAL"


def normalize_risk(item: Dict[str, Any]) -> Dict[str, Any]:
    required = ("risk_id", "risk_name", "current_risk", "expected_residual_risk", "remediation_cost")
    missing = [key for key in required if item.get(key) in (None, "")]
    if missing:
        raise ValueError(f"missing required fields: {', '.join(missing)}")
    risk = dict(item)
    for key in ("current_risk", "expected_residual_risk", "remediation_cost", "business_criticality", "cvss_score", "threat_activity", "exposure"):
        if risk.get(key) not in (None, ""):
            risk[key] = float(risk[key])
    if risk["current_risk"] < 0 or risk["expected_residual_risk"] < 0 or risk["remediation_cost"] < 0:
        raise ValueError("risk, residual risk, and remediation cost cannot be negative")
    if risk["expected_residual_risk"] > risk["current_risk"]:
        raise ValueError("expected_residual_risk cannot exceed current_risk")
    risk["business_criticality"] = risk.get("business_criticality", 50.0)
    risk["risk_reduction"] = risk["current_risk"] - risk["expected_residual_risk"]
    risk["expected_risk_reduction_percent"] = round((risk["risk_reduction"] / risk["current_risk"] * 100) if risk["current_risk"] else 0.0, 2)
    growth = min(0.50, 0.03 + (risk.get("threat_activity", 50.0) / 1000) + (risk.get("exposure", 50.0) / 2000) + (risk["business_criticality"] / 4000))
    risk["projected_untreated_risk"] = round(risk["current_risk"] * (1 + growth), 2)
    risk["projected_untreated_risk_increase_percent"] = round(growth * 100, 2)
    if risk.get("cvss_score") is not None:
        risk["severity"] = cvss_severity(risk["cvss_score"])
        risk["severity_level"] = risk["severity"].lower()
    elif risk.get("current_risk") is not None:
        cur = float(risk["current_risk"])
        if cur >= 75.0:
            risk["severity"] = "CRITICAL"
        elif cur >= 45.0:
            risk["severity"] = "HIGH"
        elif cur >= 25.0:
            risk["severity"] = "MEDIUM"
        else:
            risk["severity"] = "LOW"
        risk["severity_level"] = risk["severity"].lower()
    else:
        risk["severity"] = "MEDIUM"
        risk["severity_level"] = "medium"
    risk["risk_level"] = risk["severity"]
    return risk


def optimize_portfolio(items: Iterable[Dict[str, Any]], available_budget: float) -> Dict[str, Any]:
    if available_budget < 0:
        raise ValueError("available_budget cannot be negative")
    risks = [normalize_risk(item) for item in items]
    if not risks:
        raise ValueError("at least one risk is required")
    # Exhaustive evaluation is deliberate and transparent for the small company-risk portfolios this API accepts.
    if len(risks) > 20:
        raise ValueError("a maximum of 20 risks may be optimized in one request")
    best: List[Dict[str, Any]] = []
    best_key = (0.0, 0.0, 0.0, 0.0, ())
    for count in range(len(risks) + 1):
        for combo in combinations(risks, count):
            cost = sum(r["remediation_cost"] for r in combo)
            if cost > available_budget:
                continue
            key = (sum(r["risk_reduction"] for r in combo), sum(r["current_risk"] for r in combo), sum(r["business_criticality"] for r in combo), -cost, tuple(sorted(r["risk_id"] for r in combo)))
            if key > best_key:
                best_key, best = key, list(combo)
    selected_ids = {r["risk_id"] for r in best}
    deferred = [r for r in risks if r["risk_id"] not in selected_ids]
    spend = round(sum(r["remediation_cost"] for r in best), 2)
    current = round(sum(r["current_risk"] for r in risks), 2)
    post = round(sum(r["expected_residual_risk"] if r["risk_id"] in selected_ids else r["current_risk"] for r in risks), 2)
    red = round(current - post, 2)
    red_pct = round((red / current * 100) if current else 0.0, 2)
    return {
        "available_budget": available_budget,
        "recommended_total_investment": spend,
        "allocated_budget": spend,
        "recommended_investment": spend,
        "remaining_budget": round(available_budget - spend, 2),
        "selected_risks": best,
        "deferred_risks": deferred,
        "total_current_risk": current,
        "estimated_post_remediation_risk": post,
        "total_post_remediation_risk": post,
        "total_estimated_risk_reduction": red,
        "total_risk_reduction": red,
        "overall_risk_reduction_percent": red_pct,
        "recommendation": f"Select {len(best)} risk remediation item(s), investing {spend:.2f} within the available budget. The selection maximizes modeled risk reduction; deferred risks remain in the projected untreated-risk scenario."
    }
