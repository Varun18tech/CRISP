# Aegis-Quant REST API Reference

Base URL: `/api/v1`

## System & Health
### `GET /health`
Returns system health status.
- **Response**: `{"status": "ok"}`

---

## Assets
### `GET /assets`
Returns list of organizational assets. Supports query filtering: `search`, `asset_type`, `criticality`.
### `POST /assets`
Creates a new organizational asset.
### `GET /assets/{id}`
Returns asset details.
### `PUT /assets/{id}`
Updates an asset.
### `DELETE /assets/{id}`
Deletes an asset.

---

## Vulnerabilities
### `GET /vulnerabilities`
Returns list of CVE flaws. Supports filtering by `asset_id` and `severity`.
### `POST /vulnerabilities`
Registers a new CVE vulnerability.
### `GET /vulnerabilities/{id}`
Returns vulnerability record.

---

## Threat Intelligence
### `GET /threats`
Returns list of monitored threat actors and syndicates.
### `POST /threats`
Registers a new threat actor.

---

## Security Controls
### `GET /controls`
Returns deployed defensive countermeasures with measured effectiveness and coverage.
### `POST /controls`
Registers a new security control.
### `PUT /controls/{id}`
Updates control effectiveness, coverage, or operational status.

---

## Risk Engine & Quantification
### `GET /risks`
Returns all organizational risks ranked deterministically by composite priority score, residual exposure, and EAL.
### `POST /risks/calculate`
Executes authoritative risk calculation using the mathematical engine.
- **Request Body**:
  ```json
  {
    "asset_id": "ast_payment_api",
    "vulnerability_id": "vuln_rce",
    "threat_id": "tht_ext_apt"
  }
  ```
- **Response**: Risk record with `likelihood`, `impact`, `inherent_risk`, `control_effectiveness`, `residual_risk`, `annual_frequency`, `loss_magnitude`, `eal`, `risk_level`, `calculation_version`.
### `GET /risks/{id}`
Returns in-depth risk analysis for a specific record.
### `POST /risks/{id}/recalculate`
Triggers server-side recalculation of risk parameters against latest control effectiveness and telemetry.

---

## Capital & Investment Optimization
### `GET /investments`
Returns proposed and approved security capital allocations.
### `POST /investments`
Registers a new security investment initiative.
### `POST /investments/optimize`
Runs scenario comparison between selected initiatives (Option A vs. Option B), projecting risk reduction, residual EAL, and estimated financial ROI.

---

## Executive Analytics
### `GET /analytics/overview`
Returns high-level KPI aggregates: `total_eal`, `inherent_eal`, `eal_reduction`, `average_residual_risk`, `critical_risks_count`, `risk_density`.

---

## AI Narrative Layer
### `POST /ai/risk-summary`
Generates an explainable natural language risk summary, consequences, and recommendations labeled as AI-generated.
### `POST /ai/recommendation`
Generates decision-support explanations comparing investment options.
