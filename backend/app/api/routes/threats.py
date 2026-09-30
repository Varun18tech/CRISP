from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.database import get_db
from backend.app.models.threat import Threat
from backend.app.schemas.threat import ThreatCreate, ThreatResponse

router = APIRouter(prefix="/threats", tags=["Threats"])

@router.get("", response_model=List[ThreatResponse])
def get_threats(organization_id: str = "org_default", db: Session = Depends(get_db)):
    return db.query(Threat).filter(Threat.organization_id == organization_id).all()

@router.post("", response_model=ThreatResponse)
def create_threat(threat_in: ThreatCreate, db: Session = Depends(get_db)):
    threat_id = f"tht_{abs(hash(threat_in.name)) % 10000000}"
    db_threat = Threat(
        id=threat_id,
        organization_id=threat_in.organization_id or "org_default",
        name=threat_in.name,
        description=threat_in.description,
        threat_type=threat_in.threat_type,
        activity_level=threat_in.activity_level,
        source=threat_in.source,
    )
    db.add(db_threat)
    db.commit()
    db.refresh(db_threat)
    return db_threat
