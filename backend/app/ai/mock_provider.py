from typing import Dict, Any, List
from backend.app.ai.provider import AIProvider

class MockAIProvider(AIProvider):
    """
    Deterministic Mock AI Provider for offline testing and development.
    Generates explainable, domain-grounded narratives labeled as AI-generated.
    """

    async def generate_risk_summary(self, risk_context: Dict[str, Any]) -> Dict[str, Any]:
        asset_name = risk_context.get("asset_name", "Critical Enterprise Asset")
        vuln_name = risk_context.get("vulnerability_name", "Identified Security Flaw")
        threat_name = risk_context.get("threat_name", "Adversarial Threat Vector")
        residual_risk = risk_context.get("residual_risk", 50.0)
        eal = risk_context.get("eal", 0.0)

        summary = (
            f"The asset '{asset_name}' is currently subjected to elevated risk exposure ({residual_risk}/100) "
            f"due to '{vuln_name}' under active interest by '{threat_name}'. Existing security controls reduce "
            f"loss probability but leave a significant residual loss profile."
        )

        consequences = (
            f"Exploitation could compromise core operational availability, resulting in an estimated "
            f"Expected Annual Loss (EAL) of ₹{eal:,.2f}. Secondary implications include regulatory audit findings, "
            f"customer data exposure penalties under DPDP, and potential service interruption."
        )

        recommendations = [
            f"Deploy emergency patch or hotfix targeting {vuln_name} across production clusters.",
            "Enforce strict egress inspection and isolate communication within a zero-trust network perimeter.",
            "Conduct validation tests to confirm existing defensive controls detect exploit payload staging.",
        ]

        executive_explanation = (
            f"This risk represents a top-tier operational liability for {asset_name}. Addressing this vulnerability "
            f"produces an immediate inflection in total organizational cyber exposure."
        )

        return {
            "is_ai_generated": True,
            "provider": "MockAIProvider (Deterministic v1)",
            "summary": summary,
            "consequences": consequences,
            "recommendations": recommendations,
            "executive_explanation": executive_explanation,
        }

    async def generate_investment_narrative(self, investment_context: Dict[str, Any]) -> Dict[str, Any]:
        opt_a = investment_context.get("option_a", {})
        opt_b = investment_context.get("option_b", {})

        return {
            "is_ai_generated": True,
            "provider": "MockAIProvider",
            "narrative": (
                f"Comparing {opt_a.get('name', 'Option A')} against {opt_b.get('name', 'Option B')}: "
                f"Option A targets immediate tactical remediation with higher percentage ROI, whereas "
                f"Option B establishes systemic defensive coverage yielding greater absolute loss reduction. "
                f"Selection should align with organizational capital constraints and immediate compliance deadlines."
            ),
        }

    async def chat(self, messages: List[Dict[str, str]], context: Dict[str, Any] = None) -> Dict[str, Any]:
        if not messages:
            return {
                "role": "assistant",
                "content": "Hello! I am Aegis-Quant AI, your cyber risk intelligence and capital quantification advisor. How can I assist your executive risk analysis today?",
                "suggestions": [
                    "What is our total organizational EAL liability?",
                    "Which risk is currently ranked #1 and why?",
                    "If we spend ₹800,000 on WAF, what is our projected ROSI?",
                    "Explain how Likelihood & Residual Risk are calculated"
                ],
                "citations": ["Aegis Deterministic Risk Model v1.0", "ISO/IEC 27005", "NIST SP 800-30"]
            }

        last_msg = messages[-1].get("content", "").strip().lower()
        context = context or {}

        # 1. Total EAL / Loss exposure
        if any(w in last_msg for w in ["total eal", "expected annual loss", "total loss", "liability", "aggregate"]):
            content = (
                "### 📊 Total Organizational Cyber Risk Exposure\n\n"
                "Across all **6 monitored enterprise risks**, the active portfolio metrics are:\n\n"
                "- **Total Residual EAL**: **₹36,950,000** annually\n"
                "- **Unmitigated Inherent EAL**: **₹45,450,000** annually\n"
                "- **Capital Preserved by Existing Controls**: **₹8,500,000 / year**\n"
                "- **Average Residual Risk Score**: **34.15 / 100** (Moderate Tier)\n\n"
                "#### Primary Financial Drivers:\n"
                "1. **Payment Processing Gateway API** (`ast_payment_api`): **₹14,000,000 EAL** (37.9% of portfolio)\n"
                "2. **Primary Customer Core Database** (`ast_cust_db`): **₹13,000,000 EAL** (35.2% of portfolio)\n"
                "3. **Customer Documents Storage** (`ast_cloud_storage`): **₹3,000,000 EAL** (8.1% of portfolio)\n\n"
                "> **Executive Takeaway**: Over **73% of your annual financial exposure** is concentrated in just two critical assets. Prioritizing remediation on these two systems will yield the steepest risk reduction curve."
            )
            suggestions = [
                "Which risk is currently ranked #1 and why?",
                "How can we reduce Payment Gateway EAL?",
                "Simulate a ₹1,000,000 security investment"
            ]

        # 2. Rank #1 risk / Top risk
        elif any(w in last_msg for w in ["rank #1", "top risk", "highest risk", "number one", "ranked 1", "most critical"]):
            content = (
                "### 🚨 Priority Rank #1: Payment Gateway API RCE Flaw\n\n"
                "The highest priority risk identified by the deterministic engine is **`rsk_payment_rce`**:\n\n"
                "| Factor | Rating | Details |\n"
                "| :--- | :--- | :--- |\n"
                "| **Asset** | `ast_payment_api` | Payment Processing Gateway API (Criticality: Critical, Value: ₹25.0M) |\n"
                "| **Vulnerability** | `vuln_rce` | Remote Code Execution in JSON Parsing Library (CVSS 9.8) |\n"
                "| **Threat Actor** | `tht_ext_apt` | Nation-State Financial Threat Actor (Activity: 85%) |\n"
                "| **Likelihood** | **89.70 / 100** | High exploitability (95%) and active exploit available |\n"
                "| **Impact** | **89.25 / 100** | Direct financial loss + DPDP regulatory fines |\n"
                "| **Inherent Exposure** | **80.05 / 100** | $(89.70 \\times 89.25) / 100$ |\n"
                "| **Control Efficacy** | **35.00%** | Web Application Firewall currently deployed |\n"
                "| **Residual Risk** | **52.03 / 100** | Very High Category |\n"
                "| **Expected Annual Loss**| **₹14,000,000 / yr** | Frequency: 0.35 events/yr $\\times$ ₹40M Loss Magnitude |\n\n"
                "#### Recommended Actions:\n"
                "1. Apply the vendor emergency security patch for CVE-2024-21413 within 24 hours.\n"
                "2. Deploy hardware-level microsegmentation to isolate payment database connectors.\n"
                "3. Upgrading control efficacy from 35% to 80% saves an estimated **₹6,300,000 annually**."
            )
            suggestions = [
                "What controls can mitigate this Payment Gateway risk?",
                "Simulate budget to fix Payment Gateway",
                "Show me Risk #2 (Customer Database)"
            ]

        # 3. Sliders / Profit / ROSI / Budget
        elif any(w in last_msg for w in ["rosi", "roi", "profit", "budget", "slider", "invest", "capital", "simulator"]):
            content = (
                "### 💰 Executive Profit & Capital Preservation Model\n\n"
                "Aegis-Quant quantifies cybersecurity spending as **capital preservation profit** using the standard ROSI equation:\n\n"
                "$$\\text{ROSI (\\%)} = \\left( \\frac{\\text{Annual Loss Prevented} - \\text{Investment Cost}}{\\text{Investment Cost}} \\right) \\times 100$$\n\n"
                "#### Example Simulation:\n"
                "- **Proposed Security Budget**: ₹800,000\n"
                "- **Target Control Efficacy**: 70% risk reduction\n"
                "- **Baseline Asset EAL**: ₹14,000,000\n"
                "- **Projected Post-Control EAL**: ₹4,200,000\n"
                "- **Annual Loss Prevented**: **₹9,800,000**\n"
                "- **Net Financial Profit (Preserved)**: ₹9,800,000 - ₹800,000 = **+₹9,000,000**\n"
                "- **Calculated ROSI**: **+1,125.0%**\n\n"
                "> **Executive Note**: You can test this interactively right now using the **Executive Profit Simulator** on the [Dashboard](/dashboard) and [Capital Allocation](/investments) pages!"
            )
            suggestions = [
                "Explain the difference between Inherent and Residual Risk",
                "What is our total organizational EAL liability?",
                "Which risk is currently ranked #1 and why?"
            ]

        # 4. Mathematical Formulas / Risk Engine
        elif any(w in last_msg for w in ["formula", "calculate", "engine", "algorithm", "math", "weights", "likelihood", "impact"]):
            content = (
                "### 🧮 Aegis-Quant Deterministic Risk Model\n\n"
                "Unlike AI hallucinations or subjective 1–5 qualitative heatmaps, all Aegis-Quant scores use **reproducible deterministic mathematics**:\n\n"
                "#### 1. Likelihood Formula (0–100 scale)\n"
                "$$L = 0.30E + 0.25T + 0.20X + 0.15V + 0.10H$$\n"
                "- $E$: Exploitability rating (CVSS & PoC existence)\n"
                "- $T$: Threat actor activity telemetry\n"
                "- $X$: Asset exposure factor (Internet-facing vs internal)\n"
                "- $V$: Vulnerability severity (CVSS base)\n"
                "- $H$: Historical incident frequency\n\n"
                "#### 2. Impact Formula (0–100 scale)\n"
                "$$I = 0.30F + 0.25S + 0.20C + 0.15R + 0.10A$$\n"
                "- $F$: Direct financial loss\n"
                "- $S$: Sensitive data classification\n"
                "- $C$: Operational business criticality\n"
                "- $R$: Regulatory fines (e.g. DPDP, GDPR, PCI-DSS)\n"
                "- $A$: System availability impact\n\n"
                "#### 3. Inherent Exposure & Residual Risk\n"
                "$$\\text{Inherent Exposure} = \\frac{L \\times I}{100}$$\n"
                "$$\\text{Residual Risk} = \\text{Inherent Risk} \\times \\left(1 - \\frac{\\text{Control Reduction}}{100}\\right)$$\n"
                "*Note: Inherent risk is permanently preserved for regulatory audit compliance.*"
            )
            suggestions = [
                "How is EAL calculated?",
                "Can I customize the factor weights in Settings?",
                "What is our total organizational EAL liability?"
            ]

        # 5. Remediation recommendations
        elif any(w in last_msg for w in ["remediat", "recommend", "action", "patch", "fix", "advice", "what should we do"]):
            content = (
                "### 🛡️ Top 3 High-Impact Security Remediation Priorities\n\n"
                "Based on current risk rankings and financial exposure curves, here are the top 3 recommended interventions:\n\n"
                "1. **Deploy Emergency Hotfix for CVE-2024-21413**\n"
                "   - **Target**: Payment Processing Gateway API (`ast_payment_api`)\n"
                "   - **Cost**: ₹150,000 (Testing & Staging)\n"
                "   - **EAL Saved**: **₹9,100,000** annually\n"
                "   - **Estimated ROSI**: **+5,966%**\n\n"
                "2. **Hardware-Enforced MFA (FIDO2) on Database Clusters**\n"
                "   - **Target**: Customer Core Database (`ast_cust_db`)\n"
                "   - **Cost**: ₹600,000\n"
                "   - **EAL Saved**: **₹5,850,000** annually\n"
                "   - **Estimated ROSI**: **+875%**\n\n"
                "3. **Automated Cloud Storage ACL Remediation**\n"
                "   - **Target**: S3/GCS Customer Bucket (`ast_cloud_storage`)\n"
                "   - **Cost**: ₹200,000\n"
                "   - **EAL Saved**: **₹1,800,000** annually\n"
                "   - **Estimated ROSI**: **+800%**\n\n"
                "Executing these 3 remediations reduces overall corporate EAL liability by **₹16,750,000 (45.3%)** for a total capital expenditure of less than ₹1,000,000."
            )
            suggestions = [
                "Show me the Executive Profit Simulator",
                "What is our total organizational EAL liability?",
                "Which risk is currently ranked #1 and why?"
            ]

        # 6. Default intelligent response
        else:
            content = (
                f"### 🛡️ Aegis-Quant Intelligence Response\n\n"
                f"Regarding your inquiry about **'{last_msg}'**:\n\n"
                f"Our deterministic quantification platform monitors 6 operational enterprise assets, evaluating "
                f"threat actors, vulnerabilities, and defensive controls in continuous real-time.\n\n"
                f"- **Current Portfolio State**: Active EAL liability is **₹36.95M** across Critical, High, and Moderate tiers.\n"
                f"- **Top Monitored System**: Payment Processing Gateway API (Residual Risk 52.03, EAL ₹14.0M).\n"
                f"- **Quantification Standard**: Risk calculations strictly adhere to NIST SP 800-30, FAIR quantitative frameworks, and ISO/IEC 27005 standards.\n\n"
                f"How would you like to explore this further?"
            )
            suggestions = [
                "What is our total organizational EAL liability?",
                "Which risk is currently ranked #1 and why?",
                "If we spend ₹800,000 on WAF, what is our projected ROSI?",
                "Explain how Likelihood & Residual Risk are calculated"
            ]

        return {
            "role": "assistant",
            "content": content,
            "suggestions": suggestions,
            "citations": ["Aegis Deterministic Risk Engine v1.0", "ISO/IEC 27005:2022", "NIST SP 800-30 Rev 1", "FAIR Standard for Cyber Risk Quantification"]
        }

