from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.database import get_db
from backend.app.models.vulnerability import Vulnerability
from backend.app.schemas.vulnerability import VulnerabilityCreate, VulnerabilityResponse

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities"])

@router.get("", response_model=List[VulnerabilityResponse])
def get_vulnerabilities(
    asset_id: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Vulnerability)
    if asset_id:
        query = query.filter(Vulnerability.asset_id == asset_id)
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    return query.all()

@router.post("", response_model=VulnerabilityResponse)
def create_vulnerability(vuln_in: VulnerabilityCreate, db: Session = Depends(get_db)):
    vuln_id = f"vuln_{abs(hash(vuln_in.name)) % 10000000}"
    db_vuln = Vulnerability(
        id=vuln_id,
        asset_id=vuln_in.asset_id,
        cve_id=vuln_in.cve_id,
        name=vuln_in.name,
        description=vuln_in.description,
        cvss_score=vuln_in.cvss_score,
        exploitability_score=vuln_in.exploitability_score,
        severity=vuln_in.severity,
        patch_available=vuln_in.patch_available,
        exploit_available=vuln_in.exploit_available,
        status=vuln_in.status,
    )
    db.add(db_vuln)
    db.commit()
    db.refresh(db_vuln)
    return db_vuln

@router.get("/{id}", response_model=VulnerabilityResponse)
def get_vulnerability_by_id(id: str, db: Session = Depends(get_db)):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == id).first()
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vuln
