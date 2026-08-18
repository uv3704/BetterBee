"""
BetterBee — RAG Provider Factories.

Centralized factory patterns to instantiate LLM, embedding, vector store,
and reranker providers based on active application configuration settings.
"""

import structlog

from app.core.config import get_settings
from app.rag.interfaces.embeddings import EmbeddingProvider
from app.rag.interfaces.llm import LLMProvider
from app.rag.interfaces.reranker import RerankerProvider
from app.rag.interfaces.vectorstore import VectorStoreProvider

logger = structlog.get_logger(__name__)


class LLMFactory:
    """Factory to create the active LLM Provider."""

    @staticmethod
    def create() -> LLMProvider:
        settings = get_settings()
        provider = settings.LLM_PROVIDER.lower()
        model = settings.LLM_MODEL

        logger.debug("Creating LLM provider", provider=provider, model=model)

        if provider == "ollama":
            from app.rag.providers.ollama_provider import OllamaProvider
            return OllamaProvider(
                model=model,
                base_url=settings.OLLAMA_BASE_URL,
            )
        elif provider == "groq":
            from app.rag.providers.groq_provider import GroqProvider
            return GroqProvider(
                model=model,
                api_key=settings.GROQ_API_KEY,
            )
        elif provider == "openai":
            from app.rag.providers.openai_provider import OpenAIProvider
            return OpenAIProvider(
                model=model,
                api_key=settings.OPENAI_API_KEY,
            )
        elif provider == "anthropic":
            from app.rag.providers.anthropic_provider import AnthropicProvider
            return AnthropicProvider(
                model=model,
                api_key=settings.ANTHROPIC_API_KEY,
            )
        elif provider == "gemini":
            from app.rag.providers.gemini_provider import GeminiProvider
            return GeminiProvider(
                model=model,
                api_key=settings.GOOGLE_API_KEY,
            )
        else:
            raise ValueError(f"Unknown LLM provider configuration: {provider}")


class EmbeddingFactory:
    """Factory to create the active Embedding Provider."""

    @staticmethod
    def create() -> EmbeddingProvider:
        settings = get_settings()
        provider = settings.EMBEDDING_PROVIDER.lower()
        model = settings.EMBEDDING_MODEL

        logger.debug("Creating embedding provider", provider=provider, model=model)

        if provider == "ollama":
            from app.rag.providers.ollama_embeddings import OllamaEmbeddingProvider
            return OllamaEmbeddingProvider(
                model=model,
                base_url=settings.OLLAMA_BASE_URL,
            )
        elif provider == "openai":
            from app.rag.providers.openai_embeddings import OpenAIEmbeddingProvider
            return OpenAIEmbeddingProvider(
                model=model,
                api_key=settings.OPENAI_API_KEY,
            )
        elif provider == "gemini":
            from app.rag.providers.gemini_embeddings import GeminiEmbeddingProvider
            return GeminiEmbeddingProvider(
                model=model,
                api_key=settings.GOOGLE_API_KEY,
            )
        elif provider in ("huggingface", "local", "sentence-transformers"):
            from app.rag.providers.huggingface_embeddings import HuggingFaceEmbeddingProvider
            return HuggingFaceEmbeddingProvider(
                model=model,
            )
        else:
            raise ValueError(f"Unknown embedding provider configuration: {provider}")


class VectorStoreFactory:
    """Factory to create the active VectorStore Provider."""

    @staticmethod
    def create() -> VectorStoreProvider:
        settings = get_settings()
        # Currently, ChromaDB is the primary persistent client vector store
        from app.rag.providers.chroma_vectorstore import ChromaVectorStore
        return ChromaVectorStore(
            persist_dir=settings.CHROMA_PERSIST_DIR,
            collection_prefix=settings.CHROMA_COLLECTION_PREFIX,
        )


class RerankerFactory:
    """Factory to create the active Reranker Provider."""

    @staticmethod
    def create() -> RerankerProvider:
        settings = get_settings()
        provider = getattr(settings, "RERANKER_PROVIDER", "cross-encoder").lower()

        if provider == "none":
            from app.rag.providers.bypass_reranker import BypassReranker
            return BypassReranker()

        # CrossEncoder is our default local lightweight reranker
        from app.rag.providers.cross_encoder_reranker import CrossEncoderReranker
        return CrossEncoderReranker()
