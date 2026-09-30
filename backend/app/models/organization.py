from sqlalchemy import Column, String, DateTime, func
from backend.app.db.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(64), primary_key=True, index=True)
    organization_id = Column(String(64), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Security Analyst")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
