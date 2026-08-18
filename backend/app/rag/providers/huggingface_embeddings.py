"""
BetterBee — HuggingFace (SentenceTransformers) Memory-Optimized Embedding Provider.
"""

import gc
import structlog
import torch

from app.rag.interfaces.embeddings import EmbeddingProvider

logger = structlog.get_logger(__name__)


class HuggingFaceEmbeddingProvider(EmbeddingProvider):
    """Local HuggingFace Embedding Provider with strict memory constraints for cloud instances."""

    def __init__(self, model: str = "all-MiniLM-L6-v2") -> None:
        self.model_name = model
        self.model = None  # Lazy load to prevent startup memory spikes
        logger.info("HuggingFace embedding provider registered", model=model)

    def _lazy_load(self) -> None:
        if self.model is None:
            logger.info("Loading sentence-transformers model into memory...", model=self.model_name)
            # Restrict PyTorch thread pool & memory allocation overhead
            torch.set_num_threads(1)
            torch.set_grad_enabled(False)

            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(self.model_name, device="cpu")
            self.model.eval()
            logger.info("Sentence-transformers model loaded successfully in CPU eval mode")

    async def embed_text(self, text: str) -> list[float]:
        try:
            self._lazy_load()
            assert self.model is not None
            with torch.inference_mode():
                embedding = self.model.encode(
                    text,
                    convert_to_numpy=True,
                    show_progress_bar=False,
                    normalize_embeddings=True,
                )
            return embedding.tolist()
        except Exception as e:
            logger.error("HuggingFace embedding failed", error=str(e), model=self.model_name)
            from app.core.exceptions import ProviderError

            raise ProviderError("HuggingFace Embeddings", str(e))

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        try:
            self._lazy_load()
            assert self.model is not None
            # Process in small chunks to prevent peak RAM spikes on Render 512MB
            batch_size = 16
            all_embeddings = []
            with torch.inference_mode():
                for i in range(0, len(texts), batch_size):
                    chunk = texts[i : i + batch_size]
                    emb = self.model.encode(
                        chunk,
                        convert_to_numpy=True,
                        show_progress_bar=False,
                        normalize_embeddings=True,
                        batch_size=batch_size,
                    )
                    all_embeddings.extend(emb.tolist())
            gc.collect()
            return all_embeddings
        except Exception as e:
            logger.error("HuggingFace batch embedding failed", error=str(e), model=self.model_name)
            from app.core.exceptions import ProviderError

            raise ProviderError("HuggingFace Embeddings", str(e))

    def get_dimensions(self) -> int:
        self._lazy_load()
        assert self.model is not None
        return int(self.model.get_sentence_embedding_dimension())
