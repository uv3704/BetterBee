"""
BetterBee — Advanced RAG Workspace Retriever.

Performs:
1. Multi-query vector embedding and retrieval across ChromaDB.
2. BM25 sparse keyword ranking.
3. Reciprocal Rank Fusion (RRF) combining dense + sparse search results.
"""

import asyncio
import uuid

import structlog

from app.rag.hybrid import reciprocal_rank_fusion
from app.rag.interfaces.embeddings import EmbeddingProvider
from app.rag.interfaces.vectorstore import SearchResult, VectorStoreProvider

logger = structlog.get_logger(__name__)


class WorkspaceRetriever:
    """Retrieves document chunks using Hybrid Dense Vector + BM25 with RRF."""

    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_store_provider: VectorStoreProvider,
    ) -> None:
        self.embeddings = embedding_provider
        self.vector_store = vector_store_provider

    async def retrieve(
        self,
        query: str,
        workspace_id: uuid.UUID,
        top_k: int = 20,
        expanded_queries: list[str] | None = None,
    ) -> list[SearchResult]:
        """
        Embed queries, perform vector retrieval, and fuse with BM25 keyword rankings.
        """
        queries_to_search = expanded_queries or [query]
        collection_name = str(workspace_id)

        log = logger.bind(
            workspace_id=str(workspace_id),
            query_count=len(queries_to_search),
        )
        log.debug("Initiating Advanced RAG hybrid retrieval")

        # 1. Multi-Query Vector Search in Parallel
        async def _search_single_query(q: str) -> list[SearchResult]:
            try:
                q_vec = await self.embeddings.embed_text(q)
                return await self.vector_store.search(
                    collection_name=collection_name,
                    query_embedding=q_vec,
                    top_k=top_k,
                )
            except Exception as e:
                logger.warning("Single query vector search failed", query=q, error=str(e))
                return []

        search_tasks = [_search_single_query(q) for q in queries_to_search]
        search_results_list = await asyncio.gather(*search_tasks)

        # 2. Merge & Deduplicate Vector Candidates
        seen_ids: set[str] = set()
        deduped_vector_candidates: list[SearchResult] = []

        for sub_results in search_results_list:
            for res in sub_results:
                if res.id not in seen_ids:
                    seen_ids.add(res.id)
                    deduped_vector_candidates.append(res)

        if not deduped_vector_candidates:
            return []

        # 3. Perform BM25 + Vector Hybrid Reciprocal Rank Fusion (RRF)
        fused_results = reciprocal_rank_fusion(
            vector_results=deduped_vector_candidates,
            all_chunks=deduped_vector_candidates,
            query=query,
            top_k=top_k,
        )

        log.debug(
            "Advanced RAG hybrid retrieval complete",
            initial_candidates=len(deduped_vector_candidates),
            fused_output=len(fused_results),
        )
        return fused_results
