"""Authoritative, deterministic Budget-Constrained Cybersecurity Risk Remediation Optimizer."""
from __future__ import annotations

import hashlib
import json
import math
from typing import TYPE_CHECKING, Any, Dict, Iterable, List, Optional, Tuple

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

# Deterministic FX reference rates to internal base currency (INR)
# Base currency in CRISP risk models is INR.
SUPPORTED_CURRENCIES: Dict[str, Dict[str, Any]] = {
    "INR": {"rate_to_inr": 1.0, "symbol": "₹", "name": "Indian Rupee"},
    "USD": {"rate_to_inr": 83.50, "symbol": "$", "name": "US Dollar"},
    "EUR": {"rate_to_inr": 90.00, "symbol": "€", "name": "Euro"},
    "GBP": {"rate_to_inr": 105.00, "symbol": "£", "name": "British Pound"},
}

REMEDIATED_STATUSES = {"remediated", "resolved", "closed", "mitigated", "completed", "fixed"}

# Simple in-memory deterministic cache keyed by (dataset_hash, budget_inr, currency)
_OPTIMIZATION_CACHE: Dict[str, Dict[str, Any]] = {}


def clear_optimizer_cache() -> None:
    """Invalidate cached optimization results when underlying dataset changes."""
    _OPTIMIZATION_CACHE.clear()


def normalize_currency(amount: float, currency: str) -> Dict[str, Any]:
    """Validate and normalize user-entered budget into internal base currency (INR) without double-conversion."""
    if amount is None or isinstance(amount, bool) or not isinstance(amount, (int, float)):
        raise ValueError("Budget amount must be a valid number.")
    if math.isnan(amount) or math.isinf(amount):
        raise ValueError("Budget amount must be a finite number.")
    if amount < 0:
        raise ValueError("Budget amount cannot be negative.")

    code = (currency or "INR").strip().upper()
    if code not in SUPPORTED_CURRENCIES:
        supported_list = ", ".join(sorted(SUPPORTED_CURRENCIES.keys()))
        raise ValueError(f"Unsupported currency '{currency}'. Supported currencies: {supported_list}")

    fx = SUPPORTED_CURRENCIES[code]
    rate = fx["rate_to_inr"]
    normalized_inr = round(float(amount) * rate, 2)

    return {
        "entered_amount": round(float(amount), 2),
        "entered_currency": code,
        "currency_symbol": fx["symbol"],
        "normalized_amount_inr": normalized_inr,
        "conversion_rate_to_inr": rate,
        "conversion_source": "CRISP deterministic FX reference rate (1 " + code + f" = {rate} INR)" if code != "INR" else "Native base currency (INR)",
    }


def convert_from_inr(amount_inr: Optional[float], currency: str) -> Optional[float]:
    """Convert an internal INR amount to the display currency deterministically."""
    if amount_inr is None:
        return None
    code = (currency or "INR").strip().upper()
    fx = SUPPORTED_CURRENCIES.get(code, SUPPORTED_CURRENCIES["INR"])
    rate = fx["rate_to_inr"]
    if rate <= 0:
        return round(amount_inr, 2)
    return round(amount_inr / rate, 2)


def classify_severity(cvss_score: Optional[float], raw_severity: Optional[str], current_risk: Optional[float]) -> str:
    """Classify risk severity using CVSS, explicit severity, or risk score without fabricating data."""
    if raw_severity and str(raw_severity).strip():
        val = str(raw_severity).strip().upper()
        if val in {"CRITICAL", "VERY HIGH"}:
            return "Critical"
        if val == "HIGH":
            return "High"
        if val in {"MEDIUM", "MODERATE"}:
            return "Medium"
        if val == "LOW":
            return "Low"

    if cvss_score is not None:
        if cvss_score >= 9.0:
            return "Critical"
        if cvss_score >= 7.0:
            return "High"
        if cvss_score >= 4.0:
            return "Medium"
        return "Low"

    if current_risk is not None:
        if current_risk >= 75.0:
            return "Critical"
        if current_risk >= 50.0:
            return "High"
        if current_risk >= 25.0:
            return "Medium"
        return "Low"

    return "Unknown"


def classify_business_importance(criticality_score: Optional[float], asset_criticality: Optional[str]) -> str:
    if asset_criticality and str(asset_criticality).strip():
        val = str(asset_criticality).strip().lower()
        if val in {"mission critical", "critical"}:
            return "Mission Critical"
        if val == "high":
            return "High"
        if val in {"medium", "moderate"}:
            return "Medium"
        if val == "low":
            return "Low"

    if criticality_score is not None:
        if criticality_score >= 85.0:
            return "Mission Critical"
        if criticality_score >= 65.0:
            return "High"
        if criticality_score >= 35.0:
            return "Medium"
        return "Low"

    return "Unknown"


def classify_exposure(internet_exposed: Optional[bool], exposure_score: Optional[float]) -> str:
    if internet_exposed is True:
        return "Internet Exposed"
    if internet_exposed is False:
        if exposure_score is not None and exposure_score < 35.0:
            return "Restricted/Internal"
        return "Internal"
    if exposure_score is not None:
        if exposure_score >= 75.0:
            return "Internet Exposed"
        if exposure_score >= 35.0:
            return "Internal"
        return "Restricted/Internal"
    return "Unknown"


def classify_threat_exploitability(
    exploit_available: Optional[bool],
    exploitability_score: Optional[float],
    threat_activity: Optional[float],
) -> str:
    if exploit_available is True or (threat_activity is not None and threat_activity >= 85.0):
        return "Active / Exploited"
    if exploitability_score is not None:
        if exploitability_score >= 75.0:
            return "High Exploitability"
        if exploitability_score >= 45.0:
            return "Moderate"
        return "Low"
    if threat_activity is not None:
        if threat_activity >= 70.0:
            return "High Exploitability"
        if threat_activity >= 40.0:
            return "Moderate"
        return "Low"
    return "Unknown"


def _parse_optional_float(val: Any) -> Optional[float]:
    if val is None or val == "" or isinstance(val, bool):
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def evaluate_and_profile_risk(raw: Dict[str, Any], display_currency: str = "INR") -> Dict[str, Any]:
    """
    Build a complete remediation profile and classification for a single risk record.
    Never fabricates missing costs or missing risk reductions.
    """
    risk_id = str(raw.get("risk_id") or raw.get("id") or "").strip()
    risk_name = str(
        raw.get("risk_name")
        or raw.get("title")
        or raw.get("vulnerability_name")
        or risk_id
        or "Unnamed Risk"
    ).strip()

    status_raw = str(raw.get("risk_status") or raw.get("status") or "Active").strip()
    is_already_remediated = status_raw.lower() in REMEDIATED_STATUSES

    cvss_score = _parse_optional_float(raw.get("cvss_score"))
    current_risk = _parse_optional_float(raw.get("current_risk"))
    if current_risk is None:
        current_risk = _parse_optional_float(raw.get("residual_risk"))

    expected_residual_risk = _parse_optional_float(raw.get("expected_residual_risk"))
    explicit_reduction = _parse_optional_float(raw.get("expected_risk_reduction") or raw.get("risk_reduction"))

    # Derive expected_residual_risk or explicit_reduction if one is legitimately provided
    if current_risk is not None:
        if expected_residual_risk is None and explicit_reduction is not None:
            expected_residual_risk = round(max(0.0, current_risk - explicit_reduction), 2)
        elif expected_residual_risk is not None and explicit_reduction is None:
            explicit_reduction = round(current_risk - expected_residual_risk, 2)

    remediation_cost_inr = _parse_optional_float(raw.get("remediation_cost") if "remediation_cost" in raw else raw.get("cost"))
    business_criticality = _parse_optional_float(raw.get("business_criticality"))
    asset_criticality = raw.get("asset_criticality") or raw.get("criticality")
    if business_criticality is None and asset_criticality:
        crit_lookup = {"critical": 95.0, "mission critical": 95.0, "high": 80.0, "medium": 50.0, "moderate": 50.0, "low": 25.0}
        business_criticality = crit_lookup.get(str(asset_criticality).strip().lower())

    internet_exposed = raw.get("internet_exposed")
    if isinstance(internet_exposed, str):
        internet_exposed = internet_exposed.strip().lower() in {"true", "1", "yes", "internet exposed"}
    exposure_score = _parse_optional_float(raw.get("exposure"))
    exploit_available = raw.get("exploit_available")
    if isinstance(exploit_available, str):
        exploit_available = exploit_available.strip().lower() in {"true", "1", "yes"}
    exploitability_score = _parse_optional_float(raw.get("exploitability") or raw.get("exploitability_score"))
    threat_activity = _parse_optional_float(raw.get("threat_activity") or raw.get("activity_level"))
    control_effectiveness = _parse_optional_float(raw.get("control_effectiveness"))
    eal_inr = _parse_optional_float(raw.get("eal") or raw.get("potential_loss"))
    expected_eal_reduction_inr = _parse_optional_float(raw.get("expected_eal_reduction"))

    # Classifications
    severity_class = classify_severity(cvss_score, raw.get("severity") or raw.get("risk_level"), current_risk)
    business_importance_class = classify_business_importance(business_criticality, asset_criticality)
    exposure_class = classify_exposure(internet_exposed if isinstance(internet_exposed, bool) else None, exposure_score)
    threat_class = classify_threat_exploitability(
        exploit_available if isinstance(exploit_available, bool) else None,
        exploitability_score,
        threat_activity,
    )

    # Determine eligibility and Remediation State honestly
    eligibility_status = "Eligible"
    remediation_state = "Remediable"
    ineligibility_reason: Optional[str] = None

    if is_already_remediated or (current_risk is not None and current_risk <= 0):
        eligibility_status = "Already Remediated"
        remediation_state = "Already Remediated"
        ineligibility_reason = "This risk is already marked as remediated/resolved and requires no new budget allocation."
    elif remediation_cost_inr is None or remediation_cost_inr <= 0:
        eligibility_status = "Data Insufficient"
        remediation_state = "Cost unavailable"
        ineligibility_reason = "This risk could not be included in the budget optimization because remediation cost data is unavailable."
        remediation_cost_inr = None
    elif (
        current_risk is None
        or expected_residual_risk is None
        or explicit_reduction is None
        or expected_residual_risk < 0
        or expected_residual_risk > current_risk
        or explicit_reduction <= 0
    ):
        eligibility_status = "Data Insufficient"
        remediation_state = "Risk reduction unavailable"
        ineligibility_reason = "Expected risk reduction could not be calculated because valid residual-risk or reduction information is unavailable."

    # Compute metrics when eligible
    risk_reduction = round(explicit_reduction, 2) if (explicit_reduction is not None and explicit_reduction >= 0 and eligibility_status == "Eligible") else None
    risk_reduction_pct = (
        round((risk_reduction / current_risk) * 100.0, 2)
        if (risk_reduction is not None and current_risk and current_risk > 0)
        else None
    )

    # Budget efficiency: risk reduction points per 1,00,000 INR (1 Lakh INR)
    budget_efficiency_per_lakh = (
        round((risk_reduction / remediation_cost_inr) * 100000.0, 4)
        if (risk_reduction is not None and remediation_cost_inr and remediation_cost_inr > 0)
        else None
    )

    if expected_eal_reduction_inr is None and eal_inr is not None and risk_reduction_pct is not None:
        expected_eal_reduction_inr = round(eal_inr * (risk_reduction_pct / 100.0), 2)

    # Traceability metadata
    traceability = {
        "source_type": raw.get("source_type", "CRISP Risk Register"),
        "cvss_source": "Vulnerability Telemetry" if cvss_score is not None else "Not Provided",
        "risk_score_source": "CRISP Deterministic Risk Model (v1)" if current_risk is not None else "Not Provided",
        "remediation_cost_source": raw.get("remediation_source", "Remediation & Investment Catalog") if remediation_cost_inr is not None else "Missing",
        "business_context_source": f"Asset Inventory ({raw.get('asset_name', 'Unlinked')})" if business_criticality is not None else "Default / Unspecified",
        "threat_intel_source": raw.get("threat_name", "CTI Feed") if threat_activity is not None else "Not Provided",
    }

    return {
        "risk_id": risk_id,
        "risk_name": risk_name,
        "asset_id": raw.get("asset_id"),
        "asset_name": raw.get("asset_name") or "Enterprise Asset",
        "vulnerability_id": raw.get("vulnerability_id"),
        "cve_id": raw.get("cve_id"),
        "vulnerability_name": raw.get("vulnerability_name") or risk_name,
        "threat_name": raw.get("threat_name"),
        "remediation_name": raw.get("remediation_name") or raw.get("remediation_option") or f"Remediate {risk_name}",
        "remediation_category": raw.get("remediation_category") or raw.get("category") or "Vulnerability Remediation",
        "cvss_score": cvss_score,
        "severity": severity_class,
        "business_importance": business_importance_class,
        "business_criticality": business_criticality,
        "exposure_classification": exposure_class,
        "exposure_score": exposure_score,
        "internet_exposed": internet_exposed if isinstance(internet_exposed, bool) else None,
        "threat_classification": threat_class,
        "exploitability_score": exploitability_score,
        "threat_activity": threat_activity,
        "control_effectiveness": control_effectiveness,
        "current_risk": round(current_risk, 2) if current_risk is not None else None,
        "expected_residual_risk": round(expected_residual_risk, 2) if (expected_residual_risk is not None and eligibility_status == "Eligible") else None,
        "risk_reduction": risk_reduction,
        "expected_risk_reduction_percent": risk_reduction_pct,
        "remediation_cost_inr": round(remediation_cost_inr, 2) if remediation_cost_inr is not None else None,
        "remediation_cost": convert_from_inr(remediation_cost_inr, display_currency),
        "eal_inr": round(eal_inr, 2) if eal_inr is not None else None,
        "eal": convert_from_inr(eal_inr, display_currency),
        "expected_eal_reduction_inr": round(expected_eal_reduction_inr, 2) if expected_eal_reduction_inr is not None else None,
        "expected_eal_reduction": convert_from_inr(expected_eal_reduction_inr, display_currency),
        "budget_efficiency_per_lakh_inr": budget_efficiency_per_lakh,
        "remediation_state": remediation_state,
        "eligibility_status": eligibility_status,
        "ineligibility_reason": ineligibility_reason,
        "traceability": traceability,
    }


def _portfolio_objective_key(combo: Tuple[Dict[str, Any], ...]) -> Tuple[float, float, int, float, float, Tuple[str, ...]]:
    """
    Deterministic multi-criteria portfolio objective with strict tie-breaking (Section 33):
    1. Maximize total modeled risk reduction
    2. Maximize total financial EAL reduction
    3. Maximize count of Critical & High severity risks remediated
    4. Maximize total business criticality score covered
    5. Minimize total remediation cost
    6. Deterministic lexicographical ordering of risk_ids
    """
    if not combo:
        return (0.0, 0.0, 0, 0.0, 0.0, ())
    total_reduction = round(sum(r["risk_reduction"] or 0.0 for r in combo), 6)
    total_eal_saved = round(sum(r.get("expected_eal_reduction_inr") or 0.0 for r in combo), 2)
    crit_high_count = sum(1 for r in combo if r.get("severity") in {"Critical", "High"})
    total_biz_crit = round(sum(r.get("business_criticality") or 50.0 for r in combo), 4)
    total_cost = round(sum(r["remediation_cost_inr"] or 0.0 for r in combo), 2)
    # Negate risk_id strings so smaller lexicographical IDs win ties when using '>' comparison
    sorted_ids = tuple(sorted(r["risk_id"] for r in combo))
    return (total_reduction, total_eal_saved, crit_high_count, total_biz_crit, -total_cost, sorted_ids)


def _is_better_key(
    candidate: Tuple[float, float, int, float, float, Tuple[str, ...]],
    current_best: Tuple[float, float, int, float, float, Tuple[str, ...]],
) -> bool:
    """Compare two portfolio keys deterministically; for step 6, lexicographically smaller tuple wins."""
    if candidate[:5] != current_best[:5]:
        return candidate[:5] > current_best[:5]
    if not current_best[5]:
        return bool(candidate[5])
    return candidate[5] < current_best[5]


def _solve_optimal_portfolio(eligible_risks: List[Dict[str, Any]], budget_inr: float) -> List[Dict[str, Any]]:
    """
    Find the optimal subset of eligible_risks within budget_inr.
    Uses exact branch-and-bound with efficiency upper-bound pruning for exact combinatorial optimization.
    """
    if budget_inr <= 0 or not eligible_risks:
        return []

    # Filter out items that individually exceed the total budget
    feasible = [r for r in eligible_risks if (r["remediation_cost_inr"] or 0.0) <= budget_inr]
    if not feasible:
        return []

    # If budget is >= sum of all feasible costs, all feasible positive-reduction items can be funded
    total_feasible_cost = sum(r["remediation_cost_inr"] or 0.0 for r in feasible)
    if total_feasible_cost <= budget_inr:
        return sorted(feasible, key=lambda r: (-(r["risk_reduction"] or 0.0), r["risk_id"]))

    # Sort by efficiency descending, then risk_reduction descending, then risk_id ascending for fast branch-and-bound
    ordered = sorted(
        feasible,
        key=lambda r: (
            -((r["risk_reduction"] or 0.0) / max(r["remediation_cost_inr"] or 1.0, 1.0)),
            -(r["risk_reduction"] or 0.0),
            r["risk_id"],
        ),
    )

    n = len(ordered)
    best_combo: List[Dict[str, Any]] = []
    best_key = _portfolio_objective_key(())

    # Precompute suffix remaining reduction for pruning
    suffix_reduction = [0.0] * (n + 1)
    for i in range(n - 1, -1, -1):
        suffix_reduction[i] = suffix_reduction[i + 1] + (ordered[i]["risk_reduction"] or 0.0)

    def backtrack(idx: int, current_list: List[Dict[str, Any]], current_cost: float, current_red: float) -> None:
        nonlocal best_combo, best_key

        if current_list:
            cand_key = _portfolio_objective_key(tuple(current_list))
            if _is_better_key(cand_key, best_key):
                best_key = cand_key
                best_combo = list(current_list)

        if idx >= n:
            return

        # Fractional knapsack upper bound for pruning (with small epsilon so ties are still explored)
        rem_budget = budget_inr - current_cost
        if current_red + suffix_reduction[idx] + 1e-7 < best_key[0]:
            return

        # Compute fractional bound from idx onwards
        bound_red = current_red
        temp_budget = rem_budget
        for j in range(idx, n):
            c = ordered[j]["remediation_cost_inr"] or 0.0
            red = ordered[j]["risk_reduction"] or 0.0
            if c <= temp_budget:
                temp_budget -= c
                bound_red += red
            else:
                if c > 0:
                    bound_red += red * (temp_budget / c)
                break

        if bound_red + 1e-7 < best_key[0]:
            return

        # Branch 1: Include ordered[idx]
        item = ordered[idx]
        item_cost = item["remediation_cost_inr"] or 0.0
        if current_cost + item_cost <= budget_inr + 1e-9:
            current_list.append(item)
            backtrack(idx + 1, current_list, current_cost + item_cost, current_red + (item["risk_reduction"] or 0.0))
            current_list.pop()

        # Branch 2: Exclude ordered[idx]
        backtrack(idx + 1, current_list, current_cost, current_red)

    backtrack(0, [], 0.0, 0.0)
    return sorted(best_combo, key=lambda r: (-(r["risk_reduction"] or 0.0), r["risk_id"]))


def load_crisp_risks_from_db(db: "Session", organization_id: str = "org_default") -> Tuple[List[Dict[str, Any]], str]:
    """
    Load risks from the latest uploaded AnalysisSnapshot if present,
    or from the CRISP database Risk + Asset + Vulnerability + Threat + Investment tables.
    """
    from backend.app.models.analysis_snapshot import AnalysisSnapshot
    from backend.app.models.asset import Asset
    from backend.app.models.investment import Investment
    from backend.app.models.risk import Risk
    from backend.app.models.threat import Threat
    from backend.app.models.vulnerability import Vulnerability

    snapshot = db.query(AnalysisSnapshot).order_by(AnalysisSnapshot.id.desc()).first()
    if snapshot and isinstance(snapshot.result, dict):
        valid_records = snapshot.result.get("valid_records")
        if isinstance(valid_records, list) and len(valid_records) > 0:
            enriched = []
            for r in valid_records:
                item = dict(r)
                item["source_type"] = f"Uploaded Dataset ({', '.join(snapshot.source_files or ['dataset'])})"
                enriched.append(item)
            return enriched, f"Uploaded Dataset Snapshot #{snapshot.id}"

    # If no uploaded dataset snapshot exists, do not return random or seed risks
    return [], "No dataset uploaded"


def run_budget_optimization(
    available_budget: float,
    currency: str = "INR",
    raw_risks: Optional[Iterable[Dict[str, Any]]] = None,
    dataset_source: str = "CRISP Risk Register",
) -> Dict[str, Any]:
    """
    Core authoritative budget optimization pipeline.
    Validates budget, normalizes currency, profiles and classifies every risk,
    deduplicates, runs combinatorial portfolio optimization, and constructs
    full explainable output.
    """
    budget_info = normalize_currency(available_budget, currency)
    display_currency = budget_info["entered_currency"]
    budget_inr = budget_info["normalized_amount_inr"]

    raw_list = list(raw_risks or [])

    # Compute cache key from canonical input
    cache_payload = json.dumps(
        {
            "b": budget_inr,
            "c": display_currency,
            "src": dataset_source,
            "r": raw_list,
        },
        sort_keys=True,
        default=str,
    )
    cache_key = hashlib.sha256(cache_payload.encode("utf-8")).hexdigest()
    if cache_key in _OPTIMIZATION_CACHE:
        return _OPTIMIZATION_CACHE[cache_key]

    warnings: List[str] = []

    if not raw_list:
        empty_res = {
            "status": "no_data",
            "dataset_source": dataset_source,
            "budget": budget_info,
            "recommended_investment": 0.0,
            "recommended_investment_inr": 0.0,
            "remaining_budget": budget_info["entered_amount"],
            "remaining_budget_inr": budget_inr,
            "total_eligible_remediation_cost": 0.0,
            "budget_constraint_active": False,
            "selected_count": 0,
            "deferred_count": 0,
            "data_insufficient_count": 0,
            "already_remediated_count": 0,
            "total_current_risk": 0.0,
            "total_post_remediation_risk": 0.0,
            "total_risk_reduction": 0.0,
            "overall_risk_reduction_percent": 0.0,
            "total_current_eal": 0.0,
            "total_eal_reduction": 0.0,
            "selected_risks": [],
            "deferred_risks": [],
            "data_insufficient_risks": [],
            "already_remediated_risks": [],
            "all_risk_allocations": [],
            "category_breakdown": [],
            "classification_summary": {
                "by_severity": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0},
                "by_state": {"Selected": 0, "Deferred": 0, "Data Insufficient": 0, "Already Remediated": 0},
                "by_exposure": {},
                "by_business_importance": {},
            },
            "explanation": {
                "headline": "No risk data available for optimization.",
                "summary": "CRISP requires eligible risk and remediation records before a budget allocation can be calculated.",
                "details": [],
                "unused_budget_reason": None,
            },
            "warnings": ["No risk records were found in the current dataset."],
        }
        return empty_res

    # Deduplicate risks by risk_id deterministically
    seen_ids = set()
    deduped_raw = []
    duplicate_count = 0
    for item in raw_list:
        rid = str(item.get("risk_id") or item.get("id") or "").strip()
        if not rid:
            rid = f"anon_{len(deduped_raw) + 1}"
            item = dict(item, risk_id=rid)
        if rid in seen_ids:
            duplicate_count += 1
            continue
        seen_ids.add(rid)
        deduped_raw.append(item)

    if duplicate_count > 0:
        warnings.append(f"{duplicate_count} duplicate risk record(s) were detected and deduplicated by risk ID.")

    profiled = [evaluate_and_profile_risk(r, display_currency=display_currency) for r in deduped_raw]

    eligible = [r for r in profiled if r["eligibility_status"] == "Eligible"]
    data_insufficient = [r for r in profiled if r["eligibility_status"] == "Data Insufficient"]
    already_remediated = [r for r in profiled if r["eligibility_status"] == "Already Remediated"]

    missing_cost_count = sum(1 for r in data_insufficient if r["remediation_state"] == "Cost unavailable")
    missing_red_count = sum(1 for r in data_insufficient if r["remediation_state"] == "Risk reduction unavailable")

    if missing_cost_count > 0:
        warnings.append(
            f"{missing_cost_count} risk(s) could not be considered because remediation cost data is missing or invalid."
        )
    if missing_red_count > 0:
        warnings.append(
            f"Expected risk reduction could not be calculated for {missing_red_count} risk(s) because residual-risk information is unavailable."
        )
    if already_remediated:
        warnings.append(
            f"{len(already_remediated)} risk(s) are already marked as remediated and were excluded from new spending."
        )

    # Run combinatorial portfolio optimization on eligible risks
    selected_raw = _solve_optimal_portfolio(eligible, budget_inr)
    selected_ids = {r["risk_id"] for r in selected_raw}

    recommended_inr = round(sum(r["remediation_cost_inr"] or 0.0 for r in selected_raw), 2)
    remaining_inr = round(max(0.0, budget_inr - recommended_inr), 2)
    total_eligible_cost_inr = round(sum(r["remediation_cost_inr"] or 0.0 for r in eligible), 2)

    recommended_display = convert_from_inr(recommended_inr, display_currency) or 0.0
    remaining_display = round(max(0.0, budget_info["entered_amount"] - recommended_display), 2)

    # Annotate Selected, Deferred, Data Insufficient, Already Remediated
    selected_risks: List[Dict[str, Any]] = []
    deferred_risks: List[Dict[str, Any]] = []

    for r in selected_raw:
        item = dict(r)
        item["optimization_state"] = "Selected for Remediation"
        item["allocated_budget_inr"] = item["remediation_cost_inr"]
        item["allocated_budget"] = item["remediation_cost"]
        item["allocation_share_percent"] = (
            round((item["remediation_cost_inr"] / recommended_inr) * 100.0, 1) if recommended_inr > 0 else 0.0
        )
        item["post_optimization_risk"] = item["expected_residual_risk"]
        item["decision_reason"] = (
            f"Selected: Reduces modeled risk by {item['risk_reduction']} pts "
            f"({item['expected_risk_reduction_percent']}%) on {item['business_importance']} asset."
        )
        selected_risks.append(item)

    for r in eligible:
        if r["risk_id"] in selected_ids:
            continue
        item = dict(r)
        item["optimization_state"] = "Deferred"
        item["allocated_budget_inr"] = 0.0
        item["allocated_budget"] = 0.0
        item["allocation_share_percent"] = 0.0
        item["post_optimization_risk"] = item["current_risk"]

        cost_inr = item["remediation_cost_inr"] or 0.0
        if budget_inr == 0:
            reason = "Budget constraint: Available budget is zero; all eligible remediations are deferred."
        elif cost_inr > budget_inr:
            reason = (
                f"Budget constraint: Remediation cost ({budget_info['currency_symbol']}{item['remediation_cost']:,.2f}) "
                f"exceeds total available budget ({budget_info['currency_symbol']}{budget_info['entered_amount']:,.2f})."
            )
        elif cost_inr > remaining_inr and selected_risks:
            reason = (
                "Lower portfolio value than selected combination: Available budget achieved higher total risk reduction "
                "by funding the selected portfolio combination."
            )
        else:
            reason = "Deferred under current portfolio optimization constraints."

        item["decision_reason"] = reason
        deferred_risks.append(item)

    annotated_insufficient: List[Dict[str, Any]] = []
    for r in data_insufficient:
        item = dict(r)
        item["optimization_state"] = "Data Insufficient"
        item["allocated_budget_inr"] = 0.0
        item["allocated_budget"] = 0.0
        item["allocation_share_percent"] = 0.0
        item["post_optimization_risk"] = item["current_risk"]
        item["decision_reason"] = item["ineligibility_reason"] or "Insufficient data for optimization."
        annotated_insufficient.append(item)

    annotated_remediated: List[Dict[str, Any]] = []
    for r in already_remediated:
        item = dict(r)
        item["optimization_state"] = "Already Remediated"
        item["allocated_budget_inr"] = 0.0
        item["allocated_budget"] = 0.0
        item["allocation_share_percent"] = 0.0
        item["post_optimization_risk"] = item["current_risk"] or 0.0
        item["decision_reason"] = item["ineligibility_reason"] or "Already remediated; no new spend required."
        annotated_remediated.append(item)

    all_allocations = selected_risks + deferred_risks + annotated_insufficient + annotated_remediated

    # Portfolio-level risk metrics across active (non-already-remediated) risks with valid current_risk
    active_with_risk = [r for r in (selected_risks + deferred_risks + annotated_insufficient) if r["current_risk"] is not None]
    total_current_risk = round(sum(r["current_risk"] for r in active_with_risk), 2)
    total_post_risk = round(
        sum(
            (r["expected_residual_risk"] if r["optimization_state"] == "Selected for Remediation" and r["expected_residual_risk"] is not None else r["current_risk"])
            for r in active_with_risk
        ),
        2,
    )
    total_risk_reduction = round(max(0.0, total_current_risk - total_post_risk), 2)
    overall_reduction_pct = (
        round((total_risk_reduction / total_current_risk) * 100.0, 2) if total_current_risk > 0 else 0.0
    )

    total_current_eal_inr = round(sum(r["eal_inr"] or 0.0 for r in active_with_risk), 2)
    total_eal_reduction_inr = round(sum(r["expected_eal_reduction_inr"] or 0.0 for r in selected_risks), 2)

    # Category Breakdown
    cat_map: Dict[str, Dict[str, Any]] = {}
    for r in selected_risks:
        cat = r["remediation_category"] or "Vulnerability Remediation"
        if cat not in cat_map:
            cat_map[cat] = {
                "category": cat,
                "allocated_inr": 0.0,
                "risk_count": 0,
                "risk_reduction": 0.0,
            }
        cat_map[cat]["allocated_inr"] = round(cat_map[cat]["allocated_inr"] + (r["allocated_budget_inr"] or 0.0), 2)
        cat_map[cat]["risk_count"] += 1
        cat_map[cat]["risk_reduction"] = round(cat_map[cat]["risk_reduction"] + (r["risk_reduction"] or 0.0), 2)

    category_breakdown = []
    for cat_item in sorted(cat_map.values(), key=lambda x: -x["allocated_inr"]):
        alloc_disp = convert_from_inr(cat_item["allocated_inr"], display_currency) or 0.0
        share_of_allocated = round((cat_item["allocated_inr"] / recommended_inr) * 100.0, 1) if recommended_inr > 0 else 0.0
        share_of_budget = round((cat_item["allocated_inr"] / budget_inr) * 100.0, 1) if budget_inr > 0 else 0.0
        category_breakdown.append({
            "category": cat_item["category"],
            "allocated": alloc_disp,
            "allocated_inr": cat_item["allocated_inr"],
            "risk_count": cat_item["risk_count"],
            "risk_reduction": cat_item["risk_reduction"],
            "share_of_allocated_percent": share_of_allocated,
            "share_of_total_budget_percent": share_of_budget,
        })

    # Classification Summaries
    by_severity = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    by_exposure: Dict[str, int] = {}
    by_importance: Dict[str, int] = {}

    for r in profiled:
        sev = r["severity"]
        if sev in by_severity:
            by_severity[sev] += 1
        exp = r["exposure_classification"]
        by_exposure[exp] = by_exposure.get(exp, 0) + 1
        imp = r["business_importance"]
        by_importance[imp] = by_importance.get(imp, 0) + 1

    budget_constraint_active = len(deferred_risks) > 0 and budget_inr < total_eligible_cost_inr

    # Build factual explanation
    explanation_details: List[str] = []
    unused_budget_reason: Optional[str] = None

    if budget_inr == 0:
        headline = "Zero budget supplied — all eligible remediations deferred."
        summary = (
            f"With an available budget of {budget_info['currency_symbol']}0, no remediations can be funded. "
            f"All {len(deferred_risks)} eligible risk(s) remain untreated at a total modeled risk of {total_current_risk}."
        )
    elif not eligible:
        headline = "No eligible risks could be optimized."
        summary = "None of the available risk records contained both valid remediation costs and valid risk-reduction data."
    elif len(selected_risks) == 0 and len(deferred_risks) > 0:
        min_cost_risk = min(deferred_risks, key=lambda x: x["remediation_cost"] or float("inf"))
        headline = "Budget Constraint Active — available budget is below the lowest eligible remediation cost."
        summary = (
            f"The entered budget ({budget_info['currency_symbol']}{budget_info['entered_amount']:,.2f}) is lower than "
            f"the minimum individual remediation cost ({budget_info['currency_symbol']}{min_cost_risk['remediation_cost']:,.2f} "
            f"for {min_cost_risk['risk_name']})."
        )
        unused_budget_reason = (
            f"All {budget_info['currency_symbol']}{remaining_display:,.2f} remains unallocated because every eligible remediation "
            f"costs more than the available budget."
        )
    else:
        headline = (
            f"Selected {len(selected_risks)} of {len(eligible)} eligible remediation(s) to achieve "
            f"{overall_reduction_pct}% overall portfolio risk reduction."
        )
        summary = (
            f"The optimizer evaluated all feasible remediation combinations within your "
            f"{budget_info['currency_symbol']}{budget_info['entered_amount']:,.2f} {display_currency} budget and selected the portfolio "
            f"that maximizes total modeled risk reduction ({total_risk_reduction} points reduced, from {total_current_risk} to {total_post_risk})."
        )

        # Check if a higher-CVSS or expensive risk was deferred in favor of a combination
        if deferred_risks and len(selected_risks) >= 2:
            max_def = max(deferred_risks, key=lambda x: (x["cvss_score"] or 0.0, x["remediation_cost_inr"] or 0.0))
            if (max_def["remediation_cost_inr"] or 0.0) <= budget_inr and (max_def["risk_reduction"] or 0.0) < total_risk_reduction:
                explanation_details.append(
                    f"Portfolio Combination Advantage: Rather than spending {budget_info['currency_symbol']}{max_def['remediation_cost']:,.2f} "
                    f"on single risk '{max_def['risk_name']}' (CVSS {max_def['cvss_score'] or 'N/A'}, reduction {max_def['risk_reduction']} pts), "
                    f"funding the selected combination of {len(selected_risks)} risks achieves {total_risk_reduction} pts of total risk reduction."
                )

        if remaining_inr > 0:
            if not deferred_risks:
                unused_budget_reason = (
                    f"{budget_info['currency_symbol']}{remaining_display:,.2f} remains unallocated because all {len(selected_risks)} eligible "
                    f"remediations with verified risk reduction have been fully funded. CRISP does not force spending beyond justified remediations."
                )
            else:
                min_deferred_cost = min(r["remediation_cost"] or float("inf") for r in deferred_risks)
                unused_budget_reason = (
                    f"{budget_info['currency_symbol']}{remaining_display:,.2f} remains unallocated because the lowest-cost remaining deferred "
                    f"remediation requires {budget_info['currency_symbol']}{min_deferred_cost:,.2f}."
                )

    result = {
        "status": "ok",
        "dataset_source": dataset_source,
        "budget": budget_info,
        "recommended_investment": recommended_display,
        "recommended_investment_inr": recommended_inr,
        "remaining_budget": remaining_display,
        "remaining_budget_inr": remaining_inr,
        "total_eligible_remediation_cost": convert_from_inr(total_eligible_cost_inr, display_currency) or 0.0,
        "total_eligible_remediation_cost_inr": total_eligible_cost_inr,
        "budget_constraint_active": budget_constraint_active,
        "selected_count": len(selected_risks),
        "deferred_count": len(deferred_risks),
        "data_insufficient_count": len(annotated_insufficient),
        "already_remediated_count": len(annotated_remediated),
        "total_current_risk": total_current_risk,
        "total_post_remediation_risk": total_post_risk,
        "total_risk_reduction": total_risk_reduction,
        "overall_risk_reduction_percent": overall_reduction_pct,
        "total_current_eal": convert_from_inr(total_current_eal_inr, display_currency) or 0.0,
        "total_eal_reduction": convert_from_inr(total_eal_reduction_inr, display_currency) or 0.0,
        "selected_risks": selected_risks,
        "deferred_risks": deferred_risks,
        "data_insufficient_risks": annotated_insufficient,
        "already_remediated_risks": annotated_remediated,
        "all_risk_allocations": all_allocations,
        "category_breakdown": category_breakdown,
        "classification_summary": {
            "by_severity": by_severity,
            "by_state": {
                "Selected": len(selected_risks),
                "Deferred": len(deferred_risks),
                "Data Insufficient": len(annotated_insufficient),
                "Already Remediated": len(annotated_remediated),
            },
            "by_exposure": by_exposure,
            "by_business_importance": by_importance,
        },
        "explanation": {
            "headline": headline,
            "summary": summary,
            "details": explanation_details,
            "unused_budget_reason": unused_budget_reason,
        },
        "warnings": warnings,
    }

    _OPTIMIZATION_CACHE[cache_key] = result
    return result
