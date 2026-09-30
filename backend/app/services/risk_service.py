from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.risk import Risk
from backend.app.models.asset import Asset
from backend.app.models.vulnerability import Vulnerability
from backend.app.models.threat import Threat
from backend.app.models.control import Control
from backend.app.schemas.risk import RiskCalculateRequest
from backend.app.risk_engine import (
    calculate_likelihood,
    calculate_impact,
    calculate_exposure,
    classify_risk_level,
    calculate_residual_risk,
    calculate_eal,
    rank_risks,
    calculate_composite_control_effectiveness,
    default_risk_config
)

class RiskService:
    @staticmethod
    def calculate_and_save_risk(db: Session, req: RiskCalculateRequest) -> Risk:
        # 1. Fetch contextual entities
        asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
        vuln = db.query(Vulnerability).filter(Vulnerability.id == req.vulnerability_id).first()
        threat = db.query(Threat).filter(Threat.id == req.threat_id).first()

        # 2. Derive Likelihood factors (allow overrides if provided)
        exploitability = req.exploitability if req.exploitability is not None else (float(vuln.exploitability_score) if vuln else 50.0)
        threat_activity = req.threat_activity if req.threat_activity is not None else (float(threat.activity_level) if threat else 50.0)
        exposure = req.exposure if req.exposure is not None else (100.0 if (asset and asset.internet_exposed) else 30.0)
        vuln_severity = req.vuln_severity if req.vuln_severity is not None else ((float(vuln.cvss_score) * 10.0) if vuln else 50.0)
        historical_incidents = req.historical_incidents if req.historical_incidents is not None else 50.0

        likelihood = calculate_likelihood(
            exploitability=exploitability,
            threat_activity=threat_activity,
            exposure=exposure,
            vuln_severity=vuln_severity,
            historical_incidents=historical_incidents,
        )

        # 3. Derive Impact factors
        financial_impact = req.financial_impact if req.financial_impact is not None else 70.0
        data_sensitivity = req.data_sensitivity if req.data_sensitivity is not None else (float(asset.data_sensitivity) if asset else 50.0)
        crit_map = {"Critical": 100.0, "High": 80.0, "Medium": 50.0, "Low": 25.0}
        business_criticality = req.business_criticality if req.business_criticality is not None else (crit_map.get(asset.criticality if asset else "Medium", 50.0))
        regulatory_impact = req.regulatory_impact if req.regulatory_impact is not None else (85.0 if data_sensitivity > 75 else 40.0)
        availability_impact = req.availability_impact if req.availability_impact is not None else (90.0 if (asset and asset.criticality == "Critical") else 50.0)

        impact = calculate_impact(
            financial_impact=financial_impact,
            data_sensitivity=data_sensitivity,
            business_criticality=business_criticality,
            regulatory_impact=regulatory_impact,
            availability_impact=availability_impact,
        )

        # 4. Inherent Risk Exposure
        inherent_risk = calculate_exposure(likelihood, impact)

        # 5. Controls Adjustment
        controls_to_apply = []
        if req.control_ids:
            controls_to_apply = db.query(Control).filter(Control.id.in_(req.control_ids)).all()
        else:
            controls_to_apply = db.query(Control).filter(Control.organization_id == req.organization_id).all()

        ctl_dicts = [{"effectiveness": float(c.effectiveness), "coverage": float(c.coverage)} for c in controls_to_apply]
        control_eff = calculate_composite_control_effectiveness(ctl_dicts) if ctl_dicts else 0.0

        _, residual_risk = calculate_residual_risk(inherent_risk, control_eff)

        # 6. Expected Annual Loss (EAL)
        annual_freq = req.annual_frequency if req.annual_frequency is not None else 0.25
        loss_mag = req.loss_magnitude if req.loss_magnitude is not None else (float(asset.business_value) * 0.4 if asset else 5000000.0)
        eal = calculate_eal(annual_freq, loss_mag)

        # 7. Classification
        risk_level = classify_risk_level(residual_risk)

        # 8. Upsert Risk Record
        risk_id = f"rsk_{req.asset_id}_{req.vulnerability_id}"
        existing = db.query(Risk).filter(Risk.id == risk_id).first()
        if not existing:
            existing = Risk(
                id=risk_id,
                organization_id=req.organization_id or "org_default",
                asset_id=req.asset_id,
                vulnerability_id=req.vulnerability_id,
                threat_id=req.threat_id,
            )
            db.add(existing)

        existing.likelihood = likelihood
        existing.impact = impact
        existing.inherent_risk = inherent_risk
        existing.control_effectiveness = control_eff
        existing.residual_risk = residual_risk
        existing.annual_frequency = annual_freq
        existing.loss_magnitude = loss_mag
        existing.eal = eal
        existing.risk_level = risk_level
        existing.risk_status = "Active"
        existing.calculation_version = default_risk_config.version

        db.commit()
        db.refresh(existing)
        return existing

    @staticmethod
    def get_ranked_risks(db: Session, organization_id: str = "org_default") -> List[Dict[str, Any]]:
        db_risks = db.query(Risk).filter(Risk.organization_id == organization_id).all()
        risks_data = []
        for r in db_risks:
            asset = db.query(Asset).filter(Asset.id == r.asset_id).first()
            vuln = db.query(Vulnerability).filter(Vulnerability.id == r.vulnerability_id).first()
            threat = db.query(Threat).filter(Threat.id == r.threat_id).first()

            risks_data.append({
                "id": r.id,
                "organization_id": r.organization_id,
                "asset_id": r.asset_id,
                "asset_name": asset.name if asset else r.asset_id,
                "criticality": asset.criticality if asset else "Medium",
                "vulnerability_id": r.vulnerability_id,
                "vulnerability_name": vuln.name if vuln else r.vulnerability_id,
                "threat_id": r.threat_id,
                "threat_name": threat.name if threat else r.threat_id,
                "likelihood": float(r.likelihood),
                "impact": float(r.impact),
                "inherent_risk": float(r.inherent_risk),
                "control_effectiveness": float(r.control_effectiveness),
                "residual_risk": float(r.residual_risk),
                "annual_frequency": float(r.annual_frequency),
                "loss_magnitude": float(r.loss_magnitude),
                "eal": float(r.eal),
                "risk_level": r.risk_level,
                "risk_status": r.risk_status,
                "calculation_version": r.calculation_version,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            })

        return rank_risks(risks_data)
