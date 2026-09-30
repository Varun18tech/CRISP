from sqlalchemy import Column, String, Numeric, Text, DateTime, func
from backend.app.db.database import Base

class Control(Base):
    __tablename__ = "controls"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    control_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    effectiveness = Column(Numeric(5, 2), nullable=False, default=70.00)
    coverage = Column(Numeric(5, 2), nullable=False, default=80.00)
    status = Column(String(50), nullable=False, default="Operational")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
