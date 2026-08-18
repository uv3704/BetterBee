"""
BetterBee — Bypass Reranker.
"""

from typing import Any

import structlog

from app.rag.interfaces.reranker import RankedResult, RerankerProvider

logger = structlog.get_logger(__name__)


class BypassReranker(RerankerProvider):
    """
    Bypass Reranker that returns documents with their original retrieval rank.
    Uses 0MB RAM and completely avoids local model loading.
    """

    def __init__(self) -> None:
        logger.info("Bypass reranker registered (No ML models will be loaded)")

    async def rerank(
        self,
        query: str,
        documents: list[str],
        metadatas: list[dict[str, Any]],
        top_k: int,
    ) -> list[RankedResult]:
        if not documents:
            return []

        # Return the retrieved documents directly with a reciprocal rank score
        results = []
        for idx, (doc, meta) in enumerate(zip(documents, metadatas)):
            results.append(
                RankedResult(
                    index=idx,
                    document=doc,
                    metadata=meta,
                    score=1.0 / (idx + 1),  # simple reciprocal rank score
                )
            )

        return results[:top_k]
