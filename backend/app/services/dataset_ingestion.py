"""Safe, deterministic ingestion for tabular risk portfolio datasets."""
import csv
import io
import json
import re
from typing import Any, Dict, List, Tuple
from backend.app.services.portfolio_optimizer import normalize_risk

REQUIRED_COLUMNS = {"risk_id", "risk_name", "current_risk", "expected_residual_risk", "remediation_cost", "available_budget"}


def _read_rows(contents: bytes, filename: str) -> List[Dict[str, Any]]:
    """Read supported formats (CSV, TSV, JSON) with robust unquoted comma handling."""
    suffix = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix == "json":
        try:
            payload = json.loads(contents.decode("utf-8-sig"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("JSON dataset must be valid UTF-8 JSON") from exc
        if isinstance(payload, dict):
            payload = payload.get("risks", payload.get("data", []))
        if not isinstance(payload, list) or not all(isinstance(row, dict) for row in payload):
            raise ValueError("JSON dataset must contain a list of risk records")
        return payload
    if suffix not in {"csv", "tsv"}:
        raise ValueError("supported formats are CSV, TSV, and JSON")
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("dataset must be UTF-8 encoded") from exc

    delimiter = "\t" if suffix == "tsv" else ","
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        raise ValueError("dataset must include a header row")

    headers = [h.strip().strip('"') for h in lines[0].split(delimiter)]
    header_count = len(headers)
    rows: List[Dict[str, Any]] = []

    for line in lines[1:]:
        parts = [p.strip() for p in line.split(delimiter)]
        if len(parts) > header_count and delimiter == ",":
            # Handle unquoted commas inside remediation_action or description
            rem_idx = headers.index("remediation_action") if "remediation_action" in headers else -1
            if rem_idx != -1:
                right_count = header_count - 1 - rem_idx
                prefix = parts[:rem_idx]
                suffix_parts = parts[len(parts) - right_count:]
                middle = ", ".join(parts[rem_idx:len(parts) - right_count])
                parts = prefix + [middle] + suffix_parts
            else:
                prefix = parts[:header_count - 1]
                tail = ", ".join(parts[header_count - 1:])
                parts = prefix + [tail]

        row = {headers[i]: parts[i] if i < len(parts) else "" for i in range(header_count)}
        rows.append(row)

    return rows


def parse_risk_dataset(contents: bytes, filename: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], float]:
    rows = _read_rows(contents, filename)
    if not rows:
        raise ValueError("no records found in dataset")

    valid, errors, budgets = [], [], set()

    for line, row in enumerate(rows, start=2):
        try:
            # 1. Check / extract risk_id and risk_name
            risk_id = str(row.get("risk_id") or row.get("id") or row.get("cve_id") or f"RISK-{line-1}").strip()
            risk_name = str(row.get("risk_name") or row.get("title") or row.get("vulnerability") or row.get("name") or risk_id).strip()

            # 2. Check / extract available budget
            raw_budget = row.get("available_budget") or row.get("security_budget") or row.get("budget") or row.get("total_budget")
            if raw_budget is None or str(raw_budget).strip() == "":
                raise ValueError("missing available_budget or security_budget")
            budget = float(str(raw_budget).replace(",", "").strip())
            if budget < 0:
                raise ValueError("available_budget cannot be negative")
            budgets.add(budget)

            # 3. Check / extract remediation cost
            raw_cost = row.get("remediation_cost") or row.get("cost") or row.get("investment_cost")
            if raw_cost is None or str(raw_cost).strip() == "":
                raise ValueError("missing remediation_cost")
            rem_cost = float(str(raw_cost).replace(",", "").strip())
            if rem_cost < 0:
                raise ValueError("remediation_cost cannot be negative")

            # 4. Check / calculate current_risk
            raw_cur = row.get("current_risk") or row.get("residual_risk")
            if raw_cur is not None and str(raw_cur).strip() != "":
                current_risk = float(str(raw_cur).replace(",", "").strip())
            else:
                # Calculate from risk constituents using CRISP model
                e = float(row.get("exploitability") or 50.0)
                t = float(row.get("threat_activity") or 50.0)
                is_net = str(row.get("internet_exposed", "")).lower() == "true"
                x = float(row.get("exposure") or (90.0 if is_net else 40.0))
                cvss = float(row.get("cvss_score") or 5.0)
                v = min(100.0, cvss * 10.0)
                h = float(row.get("historical_incident_frequency") or row.get("historical_incidents") or 30.0)
                likelihood = 0.30 * e + 0.25 * t + 0.20 * x + 0.15 * v + 0.10 * h

                f = float(row.get("financial_impact") or 50.0)
                s = float(row.get("data_sensitivity") or 50.0)
                c = float(row.get("business_criticality") or 50.0)
                r = float(row.get("regulatory_impact") or 50.0)
                a = float(row.get("availability_impact") or 50.0)
                impact = 0.30 * f + 0.25 * s + 0.20 * c + 0.15 * r + 0.10 * a

                inh = (likelihood * impact) / 100.0
                ctl_eff = float(row.get("control_effectiveness") or 0.0)
                ctl_cov = float(row.get("control_coverage") or 100.0)
                eff_ctl = (ctl_eff * ctl_cov) / 100.0
                current_risk = round(max(0.0, inh * (1.0 - eff_ctl / 100.0)), 2)

            # 5. Check / calculate expected_residual_risk
            raw_res = row.get("expected_residual_risk") or row.get("post_remediation_risk")
            if raw_res is not None and str(raw_res).strip() != "":
                residual_risk = float(str(raw_res).replace(",", "").strip())
            elif row.get("remediation_effectiveness") not in (None, ""):
                rem_eff = float(str(row["remediation_effectiveness"]).replace(",", "").strip())
                residual_risk = round(max(0.0, current_risk * (1.0 - rem_eff / 100.0)), 2)
            elif row.get("expected_risk_reduction") not in (None, ""):
                red = float(str(row["expected_risk_reduction"]).replace(",", "").strip())
                residual_risk = round(max(0.0, current_risk - red), 2)
            else:
                residual_risk = round(max(0.0, current_risk * 0.25), 2)

            mapped_row = dict(row)
            mapped_row["risk_id"] = risk_id
            mapped_row["risk_name"] = risk_name
            mapped_row["current_risk"] = current_risk
            mapped_row["expected_residual_risk"] = residual_risk
            mapped_row["remediation_cost"] = rem_cost
            mapped_row["available_budget"] = budget
            if "remediation_action" in row:
                mapped_row["remediation_name"] = row["remediation_action"]

            normalized = normalize_risk(mapped_row)
            valid.append(normalized)
        except Exception as exc:
            errors.append({"line": line, "message": str(exc), "risk_id": row.get("risk_id")})

    if not valid:
        raise ValueError("no valid risk records found")
    if len(budgets) != 1:
        raise ValueError("available_budget must be the same for every dataset row")
    return valid, errors, budgets.pop()


def parse_risk_csv(contents: bytes) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], float]:
    """Compatibility wrapper for callers which upload a CSV file."""
    return parse_risk_dataset(contents, "dataset.csv")
