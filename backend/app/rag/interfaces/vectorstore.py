"""
BetterBee — Vector Store Provider Interface.
"""

from abc import ABC, abstractmethod
from typing import Any, NamedTuple


class SearchResult(NamedTuple):
    id: str
    document: str
    metadata: dict[str, Any]
    score: float


class VectorStoreProvider(ABC):
    """Abstract interface defining operations for vector databases."""

    @abstractmethod
    async def add_documents(
        self,
        collection_name: str,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        """
        Add documents with corresponding pre-computed embeddings and metadata.
        """
        pass

    @abstractmethod
    async def search(
        self,
        collection_name: str,
        query_embedding: list[float],
        top_k: int,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        """
        Perform a semantic similarity search using a query vector.
        """
        pass

    @abstractmethod
    async def delete(self, collection_name: str, document_id: str) -> None:
        """
        Delete all chunks belonging to a specific document ID.
        """
        pass

    @abstractmethod
    async def delete_collection(self, collection_name: str) -> None:
        """
        Delete an entire vector collection.
        """
        pass
