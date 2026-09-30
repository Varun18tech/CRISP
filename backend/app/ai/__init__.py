from backend.app.ai.provider import AIProvider
from backend.app.ai.mock_provider import MockAIProvider
from backend.app.core.config import settings

def get_ai_provider() -> AIProvider:
    """
    Factory function returning the configured AIProvider.
    Defaults to MockAIProvider when AI_PROVIDER is 'mock' or credentials are not supplied.
    """
    if settings.AI_PROVIDER == "mock" or not settings.AI_API_KEY:
        return MockAIProvider()
    
    # Extensible for OpenAI / Anthropic / Gemini
    return MockAIProvider()

__all__ = ["AIProvider", "MockAIProvider", "get_ai_provider"]
