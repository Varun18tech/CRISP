from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = "Security Analyst"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization_id: str
    organization_name: str

@router.post("/login", response_model=UserResponse)
def login(req: LoginRequest):
    return UserResponse(
        id="user_analyst",
        email=req.email,
        full_name="Priya Sharma",
        role=req.role or "Security Analyst",
        organization_id="org_default",
        organization_name="CyberAegis Financial Global",
    )

@router.get("/me", response_model=UserResponse)
def get_current_user():
    return UserResponse(
        id="user_analyst",
        email="priya.sharma@cyberaegis.com",
        full_name="Priya Sharma",
        role="Security Analyst",
        organization_id="org_default",
        organization_name="CyberAegis Financial Global",
    )
