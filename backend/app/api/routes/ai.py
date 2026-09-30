from fastapi import APIRouter, Depends, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.app.ai import get_ai_provider

router = APIRouter(prefix="/ai", tags=["AI Explainability & Synthesis"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict[str, Any]] = None

@router.post("/risk-summary")
async def generate_risk_summary(risk_context: Dict[str, Any] = Body(...)):
    provider = get_ai_provider()
    return await provider.generate_risk_summary(risk_context)

@router.post("/recommendation")
async def generate_recommendation(investment_context: Dict[str, Any] = Body(...)):
    provider = get_ai_provider()
    return await provider.generate_investment_narrative(investment_context)

@router.post("/chat")
async def ai_chat(req: ChatRequest):
    provider = get_ai_provider()
    msg_dicts = [{"role": m.role, "content": m.content} for m in req.messages]
    return await provider.chat(msg_dicts, req.context)

