from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.models.analysis_snapshot import AnalysisSnapshot
from backend.app.schemas.portfolio import PortfolioOptimizationRequest, BudgetOptimizerRequest
from backend.app.services.portfolio_optimizer import optimize_portfolio
from backend.app.services.dataset_ingestion import parse_risk_dataset
from backend.app.services.budget_optimizer_service import (
    run_budget_optimization,
    load_crisp_risks_from_db,
    clear_optimizer_cache,
    SUPPORTED_CURRENCIES,
    evaluate_and_profile_risk,
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio Optimization"])


@router.post("/optimize")
def optimize(req: PortfolioOptimizationRequest):
    try:
        return optimize_portfolio([risk.model_dump() for risk in req.risks], req.available_budget)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/budget-optimizer/context")
def get_budget_optimizer_context(organization_id: str = "org_default", db: Session = Depends(get_db)):
    """Return available risk dataset summary and supported currencies before user enters budget."""
    raw_risks, source_name = load_crisp_risks_from_db(db, organization_id=organization_id)
    profiled = [evaluate_and_profile_risk(r, display_currency="INR") for r in raw_risks]
    eligible = [r for r in profiled if r["eligibility_status"] == "Eligible"]
    insufficient = [r for r in profiled if r["eligibility_status"] == "Data Insufficient"]
    remediated = [r for r in profiled if r["eligibility_status"] == "Already Remediated"]

    return {
        "status": "ready" if len(raw_risks) > 0 else "no_data",
        "dataset_source": source_name,
        "total_risks_available": len(profiled),
        "eligible_risks_count": len(eligible),
        "data_insufficient_count": len(insufficient),
        "already_remediated_count": len(remediated),
        "supported_currencies": [
            {"code": code, **info} for code, info in SUPPORTED_CURRENCIES.items()
        ],
    }


@router.post("/budget-optimizer")
def execute_budget_optimizer(req: BudgetOptimizerRequest, db: Session = Depends(get_db)):
    """
    Authoritative Budget-Constrained Cybersecurity Risk Remediation Optimizer endpoint.
    """
    try:
        if req.risks is not None:
            raw_risks = req.risks
            source_name = "Request Payload Dataset"
        else:
            raw_risks, source_name = load_crisp_risks_from_db(db, organization_id=req.organization_id)

        res = run_budget_optimization(
            available_budget=req.available_budget,
            currency=req.currency,
            raw_risks=raw_risks,
            dataset_source=source_name,
        )

        # Sync latest AnalysisSnapshot in database so /portfolio/latest reflects the optimization
        snapshot = db.query(AnalysisSnapshot).order_by(AnalysisSnapshot.id.desc()).first()
        if snapshot and isinstance(snapshot.result, dict):
            updated_result = dict(snapshot.result)
            updated_result["optimization"] = {
                "available_budget": res["budget"]["entered_amount"],
                "recommended_total_investment": res["recommended_investment"],
                "allocated_budget": res["recommended_investment"],
                "recommended_investment": res["recommended_investment"],
                "remaining_budget": res["remaining_budget"],
                "selected_risks": res["selected_risks"],
                "deferred_risks": res["deferred_risks"],
                "total_current_risk": res["total_current_risk"],
                "estimated_post_remediation_risk": res["total_post_remediation_risk"],
                "total_post_remediation_risk": res["total_post_remediation_risk"],
                "total_estimated_risk_reduction": res["total_risk_reduction"],
                "total_risk_reduction": res["total_risk_reduction"],
                "overall_risk_reduction_percent": res["overall_risk_reduction_percent"],
                "recommendation": res["explanation"]["summary"],
            }
            updated_result["budget_optimizer_result"] = res
            snapshot.result = updated_result
            db.commit()

        return res
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/upload")
async def upload_dataset(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    if not files:
        raise HTTPException(status_code=422, detail="select at least one dataset file")
    if len(files) > 10:
        raise HTTPException(status_code=422, detail="a maximum of 10 files can be uploaded at once")
    valid, errors, budgets, source_files = [], [], set(), []
    for file in files:
        if not file.filename:
            errors.append({"file": "unknown", "message": "file name is missing"})
            continue
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            errors.append({"file": file.filename, "message": "dataset exceeds the 5 MB upload limit"})
            continue
        try:
            records, record_errors, budget = parse_risk_dataset(contents, file.filename)
            valid.extend(records)
            errors.extend({"file": file.filename, **error} for error in record_errors)
            budgets.add(budget)
            source_files.append(file.filename)
        except ValueError as exc:
            errors.append({"file": file.filename, "message": str(exc)})
    if not valid:
        raise HTTPException(status_code=422, detail={"message": "no valid risk records found", "invalid_records": errors})
    if len(budgets) != 1:
        raise HTTPException(status_code=422, detail="available_budget must be identical across uploaded risk files")
    optimization = optimize_portfolio(valid, budgets.pop())
    result = {
        "source_files": source_files,
        "valid_records": valid,
        "invalid_records": errors,
        "valid_count": len(valid),
        "invalid_count": len(errors),
        "optimization": optimization,
    }
    snapshot = AnalysisSnapshot(source_files=source_files, result=result)
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    clear_optimizer_cache()
    return {"snapshot_id": snapshot.id, **result}


@router.get("/latest")
def latest_dataset_analysis(db: Session = Depends(get_db)):
    snapshot = db.query(AnalysisSnapshot).order_by(AnalysisSnapshot.id.desc()).first()
    if not snapshot:
        return {"status": "no_data", "message": "Upload a company dataset to begin CRISP analysis."}
    return {"status": snapshot.status, "snapshot_id": snapshot.id, "created_at": snapshot.created_at, **snapshot.result}
