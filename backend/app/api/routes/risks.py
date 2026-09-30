from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.db.database import get_db
from backend.app.models.risk import Risk
from backend.app.schemas.risk import RiskCalculateRequest, RiskResponse, RiskRankingResponse
from backend.app.services.risk_service import RiskService

router = APIRouter(prefix="/risks", tags=["Risks"])

@router.get("", response_model=List[Dict[str, Any]])
def get_ranked_risks(organization_id: str = "org_default", db: Session = Depends(get_db)):
    return RiskService.get_ranked_risks(db, organization_id)

@router.post("/calculate", response_model=RiskResponse)
def calculate_risk(req: RiskCalculateRequest, db: Session = Depends(get_db)):
    risk = RiskService.calculate_and_save_risk(db, req)
    return risk

@router.get("/{id}", response_model=Dict[str, Any])
def get_risk_by_id(id: str, db: Session = Depends(get_db)):
    ranked = RiskService.get_ranked_risks(db)
    match = next((r for r in ranked if r["id"] == id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Risk record not found")
    return match

@router.post("/{id}/recalculate", response_model=Dict[str, Any])
def recalculate_risk(id: str, db: Session = Depends(get_db)):
    risk = db.query(Risk).filter(Risk.id == id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk record not found")
    
    req = RiskCalculateRequest(
        asset_id=risk.asset_id,
        vulnerability_id=risk.vulnerability_id,
        threat_id=risk.threat_id,
        organization_id=risk.organization_id,
    )
    updated = RiskService.calculate_and_save_risk(db, req)
    return {"status": "recalculated", "risk_id": updated.id, "residual_risk": updated.residual_risk, "eal": updated.eal}
