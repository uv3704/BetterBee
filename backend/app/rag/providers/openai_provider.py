"""
BetterBee — OpenAI LLM Provider.
"""

from collections.abc import AsyncGenerator

import structlog
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.rag.interfaces.llm import LLMProvider, ModelInfo

logger = structlog.get_logger(__name__)


class OpenAIProvider(LLMProvider):
    """Cloud OpenAI LLM Provider using langchain-openai."""

    def __init__(self, model: str, api_key: str | None, **kwargs) -> None:
        self.model = model
        self.client = ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=kwargs.get("temperature", 0.0),
            **kwargs,
        )
        logger.info("OpenAI LLM provider initialized", model=model)

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
            logger.error("OpenAI generation failed", error=str(e), model=self.model)
            from app.core.exceptions import ProviderError
            raise ProviderError("OpenAI", str(e))

    async def stream(self, messages: list[dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        lc_messages = self._convert_messages(messages)
        try:
            async for chunk in self.client.astream(lc_messages, **kwargs):
                yield str(chunk.content)
        except Exception as e:
            logger.error("OpenAI streaming failed", error=str(e), model=self.model)
            from app.core.exceptions import ProviderError
            raise ProviderError("OpenAI", str(e))

    def get_model_info(self) -> ModelInfo:
        return ModelInfo(
            provider="openai",
            model_name=self.model,
            max_tokens=8192,
        )
