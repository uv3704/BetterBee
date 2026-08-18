"""
BetterBee — CrossEncoder Reranker Provider.
"""

from typing import Any

import structlog

from app.rag.interfaces.reranker import RankedResult, RerankerProvider

logger = structlog.get_logger(__name__)


class CrossEncoderReranker(RerankerProvider):
    """
    Local Cross-Encoder reranker using sentence-transformers.
    Improves RAG precision by re-scoring retrieved candidates against the query.
    """

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2") -> None:
        self.model_name = model_name
        self.model = None  # Lazy-loaded on first call to prevent startup delay
        logger.info("CrossEncoder reranker registered", model=model_name)

    def _lazy_load(self) -> None:
        """Load the model into memory if not already loaded."""
        if self.model is None:
            logger.info("Loading CrossEncoder model into memory...", model=self.model_name)
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(self.model_name)
            logger.info("CrossEncoder model loaded successfully")

    async def rerank(
        self,
        query: str,
        documents: list[str],
        metadatas: list[dict[str, Any]],
        top_k: int,
    ) -> list[RankedResult]:
        if not documents:
            return []

        try:
            self._lazy_load()
            assert self.model is not None

            # Prepare inputs: list of [query, document_text] pairs
            pairs = [[query, doc] for doc in documents]

            # Predict similarity scores
            # Note: predict() is synchronous, but fast enough for small batches (e.g. 20 chunks)
            scores = self.model.predict(pairs)

            # Combine, sort by score descending
            results = []
            for idx, (doc, meta, score) in enumerate(zip(documents, metadatas, scores)):
                results.append(
                    RankedResult(
                        index=idx,
                        document=doc,
                        metadata=meta,
                        score=float(score),
                    )
                )

            # Sort descending by score
            results.sort(key=lambda x: x.score, reverse=True)

            return results[:top_k]

        except Exception as e:
            logger.error("Reranking failed", error=str(e), model=self.model_name)
            from app.core.exceptions import ProviderError
            raise ProviderError("CrossEncoder Reranker", str(e))
