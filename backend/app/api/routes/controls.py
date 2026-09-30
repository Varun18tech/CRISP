from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.database import get_db
from backend.app.models.control import Control
from backend.app.schemas.control import ControlCreate, ControlUpdate, ControlResponse

router = APIRouter(prefix="/controls", tags=["Security Controls"])

@router.get("", response_model=List[ControlResponse])
def get_controls(organization_id: str = "org_default", db: Session = Depends(get_db)):
    return db.query(Control).filter(Control.organization_id == organization_id).all()

@router.post("", response_model=ControlResponse)
def create_control(control_in: ControlCreate, db: Session = Depends(get_db)):
    control_id = f"ctl_{abs(hash(control_in.name)) % 10000000}"
    db_control = Control(
        id=control_id,
        organization_id=control_in.organization_id or "org_default",
        name=control_in.name,
        control_type=control_in.control_type,
        description=control_in.description,
        effectiveness=control_in.effectiveness,
        coverage=control_in.coverage,
        status=control_in.status,
    )
    db.add(db_control)
    db.commit()
    db.refresh(db_control)
    return db_control

@router.put("/{id}", response_model=ControlResponse)
def update_control(id: str, control_in: ControlUpdate, db: Session = Depends(get_db)):
    control = db.query(Control).filter(Control.id == id).first()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    
    update_data = control_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(control, field, value)
        
    db.commit()
    db.refresh(control)
    return control
