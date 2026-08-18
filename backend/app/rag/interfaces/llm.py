"""
BetterBee — LLM Provider Interface.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import NamedTuple


class ModelInfo(NamedTuple):
    provider: str
    model_name: str
    max_tokens: int


class LLMProvider(ABC):
    """Abstract interface defining the operations a language model provider must implement."""

    @abstractmethod
    async def generate(self, messages: list[dict[str, str]], **kwargs) -> str:
        """
        Send a chat completion request to the model and return the text response.

        Args:
            messages: List of chat messages, e.g. [{"role": "user", "content": "..."}]
            kwargs: Optional model parameters (temperature, max_tokens, etc.)
        """
        pass

    @abstractmethod
    def stream(self, messages: list[dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        """
        Send a chat completion request and yield response text fragments in real-time.

        Args:
            messages: List of chat messages
            kwargs: Optional model parameters
        """
        pass

    @abstractmethod
    def get_model_info(self) -> ModelInfo:
        """Return metadata about the current active model (max context size, names, etc.)."""
        pass
