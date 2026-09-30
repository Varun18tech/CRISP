from sqlalchemy import Column, String, Numeric, Text, DateTime, func
from backend.app.db.database import Base

class Investment(Base):
    __tablename__ = "investments"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    cost = Column(Numeric(15, 2), nullable=False, default=0.00)
    implementation_time = Column(String(50), nullable=False, default="30 days")
    expected_likelihood_reduction = Column(Numeric(5, 2), nullable=False, default=0.00)
    expected_impact_reduction = Column(Numeric(5, 2), nullable=False, default=0.00)
    expected_risk_reduction = Column(Numeric(5, 2), nullable=False, default=0.00)
    expected_eal_reduction = Column(Numeric(15, 2), nullable=False, default=0.00)
    roi = Column(Numeric(6, 2), nullable=False, default=0.00)
    status = Column(String(50), nullable=False, default="Proposed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
