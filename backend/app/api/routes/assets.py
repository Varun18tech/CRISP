from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.database import get_db
from backend.app.models.asset import Asset
from backend.app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=List[AssetResponse])
def get_assets(
    organization_id: str = "org_default",
    search: Optional[str] = None,
    asset_type: Optional[str] = None,
    criticality: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Asset).filter(Asset.organization_id == organization_id)
    if search:
        query = query.filter(Asset.name.ilike(f"%{search}%"))
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    if criticality:
        query = query.filter(Asset.criticality == criticality)
    return query.all()

@router.post("", response_model=AssetResponse)
def create_asset(asset_in: AssetCreate, db: Session = Depends(get_db)):
    asset_id = f"ast_{abs(hash(asset_in.name)) % 10000000}"
    db_asset = Asset(
        id=asset_id,
        organization_id=asset_in.organization_id or "org_default",
        name=asset_in.name,
        asset_type=asset_in.asset_type,
        description=asset_in.description,
        criticality=asset_in.criticality,
        business_value=asset_in.business_value,
        data_sensitivity=asset_in.data_sensitivity,
        internet_exposed=asset_in.internet_exposed,
        owner=asset_in.owner,
        environment=asset_in.environment,
        status=asset_in.status,
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.get("/{id}", response_model=AssetResponse)
def get_asset_by_id(id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.put("/{id}", response_model=AssetResponse)
def update_asset(id: str, asset_in: AssetUpdate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
        
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{id}")
def delete_asset(id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"status": "success", "message": f"Asset {id} deleted"}
