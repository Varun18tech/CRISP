from sqlalchemy import Column, String, Numeric, DateTime, func, ForeignKey
from backend.app.db.database import Base

class Risk(Base):
    __tablename__ = "risks"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), nullable=False, index=True)
    asset_id = Column(String(64), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    vulnerability_id = Column(String(64), ForeignKey("vulnerabilities.id", ondelete="CASCADE"), nullable=False, index=True)
    threat_id = Column(String(64), ForeignKey("threats.id", ondelete="CASCADE"), nullable=False, index=True)

    likelihood = Column(Numeric(6, 2), nullable=False)
    impact = Column(Numeric(6, 2), nullable=False)
    inherent_risk = Column(Numeric(6, 2), nullable=False)

    control_effectiveness = Column(Numeric(6, 2), nullable=False, default=0.00)
    residual_risk = Column(Numeric(6, 2), nullable=False)

    annual_frequency = Column(Numeric(8, 4), nullable=False, default=0.10)
    loss_magnitude = Column(Numeric(15, 2), nullable=False, default=0.00)
    eal = Column(Numeric(15, 2), nullable=False, default=0.00)

    risk_level = Column(String(50), nullable=False)
    risk_status = Column(String(50), nullable=False, default="Active")

    calculation_version = Column(String(20), nullable=False, default="v1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
