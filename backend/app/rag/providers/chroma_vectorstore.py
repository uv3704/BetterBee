"""
BetterBee — ChromaDB Vector Store Provider.
"""

from typing import Any

import chromadb
import structlog

from app.rag.interfaces.vectorstore import SearchResult, VectorStoreProvider

logger = structlog.get_logger(__name__)


class ChromaVectorStore(VectorStoreProvider):
    """
    Persistent ChromaDB vector database client.
    Runs locally embedded inside FastAPI/Celery processes.
    """

    def __init__(self, persist_dir: str, collection_prefix: str) -> None:
        self.persist_dir = persist_dir
        self.collection_prefix = collection_prefix
        # Initialize persistent client
        self.client = chromadb.PersistentClient(path=persist_dir)
        logger.info(
            "ChromaDB persistent client initialized",
            persist_dir=persist_dir,
            prefix=collection_prefix,
        )

    def _get_collection(self, collection_name: str) -> Any:
        """Get or create collection with prefix."""
        # Chroma collection names must be 3-63 chars, start/end with alphanumeric, no consecutive dots
        clean_name = f"{self.collection_prefix}{collection_name}".replace("-", "_")
        return self.client.get_or_create_collection(name=clean_name)

    async def add_documents(
        self,
        collection_name: str,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        try:
            collection = self._get_collection(collection_name)
            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            logger.debug(
                "Added documents to ChromaDB",
                count=len(ids),
                collection=collection_name,
            )
        except Exception as e:
            logger.error("Failed to add documents to ChromaDB", error=str(e))
            from app.core.exceptions import ProviderError
            raise ProviderError("ChromaDB", str(e))

    async def search(
        self,
        collection_name: str,
        query_embedding: list[float],
        top_k: int,
        filters: dict[str, Any] | None = None,
    ) -> list[SearchResult]:
        try:
            collection = self._get_collection(collection_name)

            # Format filters for ChromaDB
            # e.g., if filter is {"document_id": "uuid"}, Chroma accepts it directly as dict
            # For multiple filters: {"$and": [{"prop1": "val1"}, {"prop2": "val2"}]}
            where_clause = filters if filters else None

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_clause,
            )

            search_results = []
            if results and results["ids"] and len(results["ids"][0]) > 0:
                ids = results["ids"][0]
                docs = results["documents"][0] if results["documents"] else []
                metadatas = results["metadatas"][0] if results["metadatas"] else []
                distances = results["distances"][0] if results["distances"] else []

                for i in range(len(ids)):
                    # ChromaDB returns distance. Distance = 1 - cosine_similarity (commonly).
                    # We convert to a relevance score where higher is better.
                    dist = distances[i] if i < len(distances) else 0.5
                    score = max(0.0, 1.0 - dist)

                    search_results.append(
                        SearchResult(
                            id=ids[i],
                            document=docs[i] if i < len(docs) else "",
                            metadata=metadatas[i] if i < len(metadatas) else {},
                            score=score,
                        )
                    )

            return search_results
        except Exception as e:
            logger.error("ChromaDB search failed", error=str(e))
            from app.core.exceptions import ProviderError
            raise ProviderError("ChromaDB", str(e))

    async def delete(self, collection_name: str, document_id: str) -> None:
        try:
            collection = self._get_collection(collection_name)
            collection.delete(where={"document_id": document_id})
            logger.info(
                "Deleted document chunks from ChromaDB",
                document_id=document_id,
                collection=collection_name,
            )
        except Exception as e:
            logger.error("Failed to delete document from ChromaDB", error=str(e))
            from app.core.exceptions import ProviderError
            raise ProviderError("ChromaDB", str(e))

    async def delete_collection(self, collection_name: str) -> None:
        try:
            clean_name = f"{self.collection_prefix}{collection_name}".replace("-", "_")
            self.client.delete_collection(name=clean_name)
            logger.info("Deleted ChromaDB collection", collection=clean_name)
        except Exception as e:
            logger.warning("Could not delete ChromaDB collection (may not exist)", error=str(e))
