"""
BetterBee — BM25 & Dense Vector Hybrid Search with Reciprocal Rank Fusion (RRF).

Combines dense semantic vector retrieval (ChromaDB) with sparse lexical BM25 keyword retrieval.
Maintains extremely low RAM overhead (<3MB) using rank_bm25 on tokenized text.
"""

import re
from typing import Any

import structlog
from rank_bm25 import BM25Okapi

from app.rag.interfaces.vectorstore import SearchResult

logger = structlog.get_logger(__name__)


def tokenize(text: str) -> list[str]:
    """Lightweight whitespace & alphanumeric tokenizer."""
    return re.findall(r"\w+", text.lower())


def reciprocal_rank_fusion(
    vector_results: list[SearchResult],
    all_chunks: list[SearchResult],
    query: str,
    top_k: int = 10,
    k: int = 60,
) -> list[SearchResult]:
    """
    Fuses dense vector results with BM25 sparse keyword rankings using Reciprocal Rank Fusion (RRF):
    RRF_score(d) = 1/(k + r_dense(d)) + 1/(k + r_sparse(d))
    
    Parameters:
    - vector_results: Chunks retrieved and ranked by ChromaDB cosine similarity.
    - all_chunks: Candidate chunks pool across the workspace.
    - query: User query text.
    - top_k: Number of fused results to return.
    - k: RRF smoothing constant (default 60).
    """
    if not all_chunks:
        return vector_results[:top_k]

    # 1. Prepare BM25 Corpus
    tokenized_corpus = [tokenize(c.document) for c in all_chunks]
    
    # Avoid zero-token edge cases
    if not any(tokenized_corpus):
        return vector_results[:top_k]

    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = tokenize(query)

    if not tokenized_query:
        return vector_results[:top_k]

    bm25_scores = bm25.get_scores(tokenized_query)

    # Sort chunks by BM25 score
    bm25_ranked_indices = sorted(
        range(len(all_chunks)), key=lambda i: bm25_scores[i], reverse=True
    )

    # 2. Build Rank Maps (1-indexed)
    bm25_ranks = {
        all_chunks[idx].id: rank + 1
        for rank, idx in enumerate(bm25_ranked_indices)
        if bm25_scores[idx] > 0  # only rank positive keyword matches
    }

    vector_ranks = {
        res.id: rank + 1 for rank, res in enumerate(vector_results)
    }

    # Combined candidate chunks map
    chunk_map: dict[str, SearchResult] = {c.id: c for c in all_chunks}
    for v in vector_results:
        chunk_map[v.id] = v

    # 3. Calculate RRF Score for each candidate chunk
    fused_scores: dict[str, float] = {}
    for chunk_id in chunk_map:
        v_rank = vector_ranks.get(chunk_id, 1000)
        b_rank = bm25_ranks.get(chunk_id, 1000)

        # RRF formula: 1/(k + r_vector) + 1/(k + r_bm25)
        score = (1.0 / (k + v_rank)) + (1.0 / (k + b_rank))
        fused_scores[chunk_id] = score

    # Sort descending by RRF score
    sorted_chunk_ids = sorted(
        fused_scores.keys(), key=lambda cid: fused_scores[cid], reverse=True
    )

    final_results: list[SearchResult] = []
    for cid in sorted_chunk_ids[:top_k]:
        original = chunk_map[cid]
        final_results.append(
            SearchResult(
                id=original.id,
                document=original.document,
                metadata={
                    **original.metadata,
                    "rrf_score": round(fused_scores[cid], 5),
                    "vector_rank": vector_ranks.get(cid),
                    "bm25_rank": bm25_ranks.get(cid),
                },
                score=fused_scores[cid],
            )
        )

    logger.debug(
        "Reciprocal Rank Fusion completed",
        vector_candidates=len(vector_results),
        bm25_candidates=len(bm25_ranks),
        fused_total=len(final_results),
    )

    return final_results
