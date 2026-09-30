from backend.app.ai.provider import AIProvider
from backend.app.ai.mock_provider import MockAIProvider
from backend.app.ai.bedrock_provider import BedrockAIProvider
from backend.app.core.config import settings

def get_ai_provider() -> AIProvider:
    """
    Factory function returning the configured AIProvider.
    Uses Amazon Bedrock (Claude 3.5 Sonnet) by default or when configured.
    """
    if settings.AI_PROVIDER in ("bedrock", "claude", "anthropic") or getattr(settings, "BEDROCK_MODEL_ID", None):
        return BedrockAIProvider()

    if settings.AI_PROVIDER == "mock":
        return MockAIProvider()

    return BedrockAIProvider()

__all__ = ["AIProvider", "MockAIProvider", "BedrockAIProvider", "get_ai_provider"]
