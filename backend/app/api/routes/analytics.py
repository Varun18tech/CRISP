from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.db.database import get_db
from backend.app.models.risk import Risk
from backend.app.models.asset import Asset
from backend.app.models.control import Control
from backend.app.models.investment import Investment

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(organization_id: str = "org_default", db: Session = Depends(get_db)):
    risks = db.query(Risk).filter(Risk.organization_id == organization_id).all()
    assets = db.query(Asset).filter(Asset.organization_id == organization_id).all()
    controls = db.query(Control).filter(Control.organization_id == organization_id).all()
    investments = db.query(Investment).filter(Investment.organization_id == organization_id).all()

    total_eal = sum(float(r.eal) for r in risks)
    inherent_eal = sum(float(r.loss_magnitude) * float(r.annual_frequency) for r in risks)
    avg_residual_risk = (sum(float(r.residual_risk) for r in risks) / len(risks)) if risks else 0.0
    avg_inherent_risk = (sum(float(r.inherent_risk) for r in risks) / len(risks)) if risks else 0.0

    critical_risks = len([r for r in risks if r.risk_level in ["Critical", "Very High"]])
    total_invested = sum(float(i.cost) for i in investments)

    return {
        "total_eal": round(total_eal, 2),
        "inherent_eal": round(inherent_eal, 2),
        "eal_reduction": round(max(0.0, inherent_eal - total_eal), 2),
        "average_residual_risk": round(avg_residual_risk, 2),
        "average_inherent_risk": round(avg_inherent_risk, 2),
        "critical_risks_count": critical_risks,
        "total_assets_monitored": len(assets),
        "total_controls_deployed": len(controls),
        "total_security_investments": round(total_invested, 2),
        "risk_density": {
            "critical": len([r for r in risks if r.risk_level == "Critical"]),
            "very_high": len([r for r in risks if r.risk_level == "Very High"]),
            "high": len([r for r in risks if r.risk_level == "High"]),
            "moderate": len([r for r in risks if r.risk_level == "Moderate"]),
            "low": len([r for r in risks if r.risk_level == "Low"]),
        }
    }
