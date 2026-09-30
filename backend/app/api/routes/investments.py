from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.database import get_db
from backend.app.models.investment import Investment
from backend.app.models.risk import Risk
from backend.app.schemas.investment import InvestmentCreate, InvestmentResponse, ScenarioOptimizationRequest, ScenarioComparisonResult
from backend.app.risk_engine.eal import calculate_investment_benefit

router = APIRouter(prefix="/investments", tags=["Investments"])

@router.get("", response_model=List[InvestmentResponse])
def get_investments(organization_id: str = "org_default", db: Session = Depends(get_db)):
    return db.query(Investment).filter(Investment.organization_id == organization_id).all()

@router.post("", response_model=InvestmentResponse)
def create_investment(inv_in: InvestmentCreate, db: Session = Depends(get_db)):
    inv_id = f"inv_{abs(hash(inv_in.name)) % 10000000}"
    db_inv = Investment(
        id=inv_id,
        organization_id=inv_in.organization_id or "org_default",
        name=inv_in.name,
        description=inv_in.description,
        category=inv_in.category,
        cost=inv_in.cost,
        implementation_time=inv_in.implementation_time,
        expected_likelihood_reduction=inv_in.expected_likelihood_reduction,
        expected_impact_reduction=inv_in.expected_impact_reduction,
        expected_risk_reduction=inv_in.expected_risk_reduction,
        expected_eal_reduction=inv_in.expected_eal_reduction,
        roi=inv_in.roi,
        status=inv_in.status,
    )
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return db_inv

@router.post("/optimize", response_model=List[ScenarioComparisonResult])
def optimize_investments(req: ScenarioOptimizationRequest, db: Session = Depends(get_db)):
    investments = db.query(Investment).filter(Investment.id.in_(req.investment_ids)).all()
    total_eal = sum(float(r.eal) for r in db.query(Risk).all()) or 36950000.0

    results = []
    for inv in investments:
        cost = float(inv.cost)
        eal_reduction = float(inv.expected_eal_reduction)
        benefit_data = calculate_investment_benefit(total_eal, max(0.0, total_eal - eal_reduction), cost)

        results.append(
            ScenarioComparisonResult(
                option_id=inv.id,
                name=inv.name,
                cost=cost,
                projected_risk_reduction=float(inv.expected_risk_reduction),
                projected_eal_reduction=eal_reduction,
                projected_residual_eal=benefit_data["projected_residual_eal"],
                roi=benefit_data["roi_percentage"],
            )
        )
    return results
