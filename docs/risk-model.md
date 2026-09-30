# Aegis-Quant Risk Model Specification

## 1. Overview
Aegis-Quant quantifies cyber risk through a multi-tiered, explainable mathematical model that transforms raw vulnerabilities, threat activity, asset criticality, and security control efficacy into business-oriented financial metrics.

## 2. Inherent Likelihood Model
Likelihood is calculated on a normalized 0–100 scale:
$$\text{Likelihood} = 0.30 \cdot E + 0.25 \cdot T + 0.20 \cdot X + 0.15 \cdot V + 0.10 \cdot H$$

Where:
- $E$ = Exploitability Score (0–100)
- $T$ = Threat Activity Level (0–100)
- $X$ = Exposure / Internet-facing status (0–100)
- $V$ = Vulnerability Severity / CVSS normalized (0–100)
- $H$ = Historical Incident Frequency (0–100)

## 3. Business Impact Model
Impact is calculated on a normalized 0–100 scale:
$$\text{Impact} = 0.30 \cdot F + 0.25 \cdot S + 0.20 \cdot C + 0.15 \cdot R + 0.10 \cdot A$$

Where:
- $F$ = Financial Impact (0–100)
- $S$ = Data Sensitivity (0–100)
- $C$ = Business Criticality (0–100)
- $R$ = Regulatory / Compliance Impact (0–100)
- $A$ = Availability Impact (0–100)

## 4. Risk Exposure (Inherent Risk)
$$\text{Inherent Risk} = \frac{\text{Likelihood} \times \text{Impact}}{100}$$
Result: $0 \le \text{Inherent Risk} \le 100$.

## 5. Security Controls & Residual Risk
Implemented security controls (WAF, EDR, MFA, Encryption, Backups, etc.) mitigate risk based on their combined effectiveness ($\text{Eff}$) and coverage ($\text{Cov}$):
$$\text{Control Reduction} = \frac{\text{Eff} \times \text{Cov}}{100}$$
$$\text{Residual Risk} = \text{Inherent Risk} \times \left(1 - \frac{\text{Control Reduction}}{100}\right)$$

> **Rule:** Inherent Risk is never overwritten when calculating Residual Risk. Both values are preserved.

## 6. Expected Annual Loss (EAL)
Financial risk is quantified as:
$$\text{EAL} = \text{Annualized Incident Frequency} \times \text{Expected Loss Per Incident}$$
Supported Currencies: INR (₹), USD ($).

## 7. Risk Classification Matrix
| Score Range | Classification | Action Priority |
|---|---|---|
| 0 – 20 | Low | Monitor during routine cycles |
| >20 – 40 | Moderate | Prioritize in scheduled patch sprint |
| >40 – 60 | High | Requires targeted mitigation plan within 14 days |
| >60 – 80 | Very High | Urgent remediation required within 72 hours |
| >80 – 100 | Critical | Executive notification & immediate intervention |
