from sqlalchemy import Column, String, Numeric, Text, DateTime, func
from backend.app.db.database import Base

class Threat(Base):
    __tablename__ = "threats"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    threat_type = Column(String(100), nullable=False)
    activity_level = Column(Numeric(5, 2), nullable=False, default=50.00)
    source = Column(String(255), nullable=True)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
