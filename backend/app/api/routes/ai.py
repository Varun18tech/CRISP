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

@router.get("/status")
async def ai_status():
    from backend.app.core.config import settings
    return {
        "status": "online",
        "provider": "Amazon Bedrock",
        "model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
        "model_name": "Claude 3.5 Sonnet",
        "capabilities": [
            "Executive Cyber Risk Summaries",
            "Board of Directors Reports",
            "Risk Explainability & Narrative Driver Analysis",
            "Return on Security Investment (ROSI) Strategy",
            "Interactive Executive Intelligence Chat"
        ]
    }

@router.post("/executive-summary")
async def generate_executive_summary(context: Dict[str, Any] = Body(...)):
    provider = get_ai_provider()
    if hasattr(provider, "generate_executive_summary"):
        return await provider.generate_executive_summary(context)
    return await provider.generate_risk_summary(context)

@router.post("/board-report")
async def generate_board_report(context: Dict[str, Any] = Body(...)):
    provider = get_ai_provider()
    if hasattr(provider, "generate_board_report"):
        return await provider.generate_board_report(context)
    return await provider.generate_risk_summary(context)

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


