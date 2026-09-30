import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

def test_api_suite():
    # Using TestClient with lifespan context
    with TestClient(app) as client:
        # 1. Health
        res = client.get("/api/v1/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}

        # 2. Assets
        res = client.get("/api/v1/assets")
        assert res.status_code == 200
        assets = res.json()
        assert len(assets) >= 1
        assert any(a["id"] == "ast_payment_api" for a in assets)

        # 3. Vulnerabilities
        res = client.get("/api/v1/vulnerabilities")
        assert res.status_code == 200
        vulns = res.json()
        assert len(vulns) >= 1

        # 4. Threats
        res = client.get("/api/v1/threats")
        assert res.status_code == 200
        threats = res.json()
        assert len(threats) >= 1

        # 5. Controls
        res = client.get("/api/v1/controls")
        assert res.status_code == 200
        controls = res.json()
        assert len(controls) >= 1

        # 6. Risks (Ranked list)
        res = client.get("/api/v1/risks")
        assert res.status_code == 200
        risks = res.json()
        assert len(risks) >= 1
        assert "residual_risk" in risks[0]
        assert "eal" in risks[0]

        # 7. Risk Calculation Endpoint
        calc_payload = {
            "asset_id": "ast_payment_api",
            "vulnerability_id": "vuln_rce",
            "threat_id": "tht_ext_apt",
            "exploitability": 90.0,
            "threat_activity": 80.0,
            "exposure": 100.0,
            "vuln_severity": 98.0,
            "historical_incidents": 70.0,
            "financial_impact": 90.0,
            "data_sensitivity": 95.0,
            "business_criticality": 100.0,
            "regulatory_impact": 80.0,
            "availability_impact": 70.0,
        }
        res = client.post("/api/v1/risks/calculate", json=calc_payload)
        assert res.status_code == 200
        calc_res = res.json()
        assert calc_res["likelihood"] >= 88.0
        assert calc_res["inherent_risk"] >= 78.0

        # 8. Investments
        res = client.get("/api/v1/investments")
        assert res.status_code == 200
        invs = res.json()
        assert len(invs) >= 1

        # 9. Investment Optimization
        opt_payload = {
            "investment_ids": ["inv_patch_rce", "inv_deploy_waf_rules"]
        }
        res = client.post("/api/v1/investments/optimize", json=opt_payload)
        assert res.status_code == 200
        opt_res = res.json()
        assert len(opt_res) == 2

        # 10. Analytics Overview
        res = client.get("/api/v1/analytics/overview")
        assert res.status_code == 200
        analytics = res.json()
        assert "total_eal" in analytics
        assert "risk_density" in analytics

        # 11. AI Risk Summary
        ai_payload = {
            "asset_name": "Payment Gateway API",
            "vulnerability_name": "RCE in Parsing Library",
            "threat_name": "Nation-State Actor",
            "residual_risk": 52.03,
            "eal": 14000000.0,
        }
        res = client.post("/api/v1/ai/risk-summary", json=ai_payload)
        assert res.status_code == 200
        ai_res = res.json()
        assert ai_res["is_ai_generated"] is True
        assert "summary" in ai_res
