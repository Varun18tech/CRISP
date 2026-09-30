from sqlalchemy import Column, String, Numeric, Boolean, Text, DateTime, func
from backend.app.db.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    criticality = Column(String(50), nullable=False, default="High")
    business_value = Column(Numeric(15, 2), nullable=False, default=0.00)
    data_sensitivity = Column(Numeric(5, 2), nullable=False, default=50.00)
    internet_exposed = Column(Boolean, nullable=False, default=False)
    owner = Column(String(255), nullable=True)
    environment = Column(String(50), nullable=False, default="Production")
    status = Column(String(50), nullable=False, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
