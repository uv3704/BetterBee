"""
BetterBee — Reranker Provider Interface.
"""

from abc import ABC, abstractmethod
from typing import Any, NamedTuple


class RankedResult(NamedTuple):
    index: int
    document: str
    metadata: dict[str, Any]
    score: float


class RerankerProvider(ABC):
    """Abstract interface defining the operations a reranking model must implement."""

    @abstractmethod
    async def rerank(
        self,
        query: str,
        documents: list[str],
        metadatas: list[dict[str, Any]],
        top_k: int,
    ) -> list[RankedResult]:
        """
        Re-score and re-rank a set of retrieved documents against the original query.

        Args:
            query: The original search query
            documents: List of text snippets retrieved
            metadatas: List of corresponding metadata dicts
            top_k: Number of highest scoring results to return
        """
        pass
