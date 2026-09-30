from abc import ABC, abstractmethod
from typing import Dict, Any, List

class AIProvider(ABC):
    """
    Abstract Base Class for pluggable AI Providers (Mock, OpenAI, Anthropic, Gemini).
    Complies with Section 2.5 of ANTIGRAVITY_INSTRUCTIONS.md.
    """

    @abstractmethod
    async def generate_risk_summary(self, risk_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates an explainable risk summary, primary drivers, business consequences,
        and recommended remediation actions without altering numerical calculations.
        """
        pass

    @abstractmethod
    async def generate_investment_narrative(self, investment_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates decision-support explanation comparing investment options.
        """
        pass

    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Interactive conversational intelligence grounded in real organization assets,
        deterministic risk formulas, EAL loss metrics, and ROSI capital optimization.
        """
        pass

