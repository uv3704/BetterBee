"""
BetterBee — Groq LLM Provider.
"""

from collections.abc import AsyncGenerator

import structlog
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq

from app.rag.interfaces.llm import LLMProvider, ModelInfo

logger = structlog.get_logger(__name__)


class GroqProvider(LLMProvider):
    """Cloud Groq LLM Provider using langchain-groq."""

    def __init__(self, model: str, api_key: str | None, **kwargs) -> None:
        self.model = model
        self.client = ChatGroq(
            model=model,
            groq_api_key=api_key,
            temperature=kwargs.get("temperature", 0.0),
            **kwargs,
        )
        logger.info("Groq LLM provider initialized", model=model)

    def _convert_messages(self, messages: list[dict[str, str]]) -> list:
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
            response = await self.client.ainvoke(lc_messages, **kwargs)
            return str(response.content)
        except Exception as e:
            logger.error("Groq generation failed", error=str(e), model=self.model)
            from app.core.exceptions import ProviderError
            raise ProviderError("Groq", str(e))

    async def stream(self, messages: list[dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        lc_messages = self._convert_messages(messages)
        try:
            async for chunk in self.client.astream(lc_messages, **kwargs):
                yield str(chunk.content)
        except Exception as e:
            logger.error("Groq streaming failed", error=str(e), model=self.model)
            from app.core.exceptions import ProviderError
            raise ProviderError("Groq", str(e))

    def get_model_info(self) -> ModelInfo:
        return ModelInfo(
            provider="groq",
            model_name=self.model,
            max_tokens=8192,
        )
