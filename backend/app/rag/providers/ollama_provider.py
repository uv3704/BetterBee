"""
BetterBee — Ollama LLM Provider.
"""

from collections.abc import AsyncGenerator

import structlog
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.rag.interfaces.llm import LLMProvider, ModelInfo

logger = structlog.get_logger(__name__)


class OllamaProvider(LLMProvider):
    """Local Ollama LLM Provider using langchain-ollama."""

    def __init__(self, model: str, base_url: str, **kwargs) -> None:
        self.model = model
        self.base_url = base_url
        self.client = ChatOllama(
            model=model,
            base_url=base_url,
            temperature=kwargs.get("temperature", 0.0),
            **kwargs,
        )
        logger.info("Ollama LLM provider initialized", model=model, base_url=base_url)

    def _convert_messages(self, messages: list[dict[str, str]]) -> list:
        """Convert standard dict messages to LangChain message classes."""
        lc_messages = []
        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
            else:
                lc_messages.append(HumanMessage(content=content))
        return lc_messages

    async def generate(self, messages: list[dict[str, str]], **kwargs) -> str:
        lc_messages = self._convert_messages(messages)
        try:
            # invoke is synchronous in some langchain versions, or async if we use ainvoke
            response = await self.client.ainvoke(lc_messages, **kwargs)
            return str(response.content)
        except Exception as e:
            logger.error("Ollama generation failed", error=str(e), model=self.model)
            from app.core.exceptions import ProviderError
            raise ProviderError("Ollama", str(e))

    async def stream(self, messages: list[dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        lc_messages = self._convert_messages(messages)
        try:
            async for chunk in self.client.astream(lc_messages, **kwargs):
                yield str(chunk.content)
        except Exception as e:
            logger.error("Ollama streaming failed", error=str(e), model=self.model)
            from app.core.exceptions import ProviderError
            raise ProviderError("Ollama", str(e))

    def get_model_info(self) -> ModelInfo:
        return ModelInfo(
            provider="ollama",
            model_name=self.model,
            max_tokens=4096,  # Standard context window size for smaller local models
        )
