"""
BetterBee — Advanced RAG Ingestion & Query Pipeline.

Combines:
1. Multi-query expansion via LLM (0 MB RAM).
2. Dense vector + BM25 keyword hybrid search with Reciprocal Rank Fusion (RRF).
3. Parent-child context reconstruction (Small-to-Big retrieval).
4. Cross-encoder reranking.
5. Grounded streaming synthesis with verifiable citations and confidence scoring.
"""

import time
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import structlog

from app.prompts.answer import build_answer_prompt
from app.rag.interfaces.llm import LLMProvider
from app.rag.interfaces.reranker import RerankerProvider
from app.rag.query_transform import QueryTransformer
from app.rag.retriever import WorkspaceRetriever

logger = structlog.get_logger(__name__)


class RAGPipeline:
    """Orchestrates multi-query expansion, hybrid retrieval, small-to-big context, and LLM text generation."""

    def __init__(
        self,
        retriever: WorkspaceRetriever,
        reranker: RerankerProvider,
        llm_provider: LLMProvider,
    ) -> None:
        self.retriever = retriever
        self.reranker = reranker
        self.llm = llm_provider
        self.query_transformer = QueryTransformer(llm_provider)

    async def answer(
        self,
        query: str,
        workspace_id: uuid.UUID,
        chat_history: list[dict[str, str]],
        workspace_name: str = "Unknown",
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Runs the Advanced RAG query pipeline and yields events for streaming.

        Events yielded:
        - {"type": "token", "content": str}
        - {"type": "citations", "content": list[dict]}
        - {"type": "explain", "content": dict}
        """
        print(f"\n💬 Query\n"
              f"────────────────────────────\n"
              f"\"{query}\"")

        log = logger.bind(workspace_id=str(workspace_id), query=query)
        log.info("Starting Advanced RAG pipeline execution")

        t_start = time.perf_counter()

        # 1. Multi-Query Expansion Phase (Groq API, 0 MB local RAM)
        t0_expand = time.perf_counter()
        expanded_queries = await self.query_transformer.expand_query(query, max_queries=3)
        t_expansion = (time.perf_counter() - t0_expand) * 1000

        # 2. Hybrid Retrieval Phase (Dense Vector + BM25 with RRF)
        t0 = time.perf_counter()
        retrieved_results = await self.retriever.retrieve(
            query=query,
            workspace_id=workspace_id,
            top_k=20,
            expanded_queries=expanded_queries,
        )
        t_retrieval = (time.perf_counter() - t0) * 1000

        # Prepare retrieved chunk details for explainability
        retrieved_details = [
            {
                "id": r.id,
                "document": r.document,
                "score": r.score,
                "filename": r.metadata.get("filename", "Unknown"),
                "page_number": r.metadata.get("page_number"),
                "sheet_name": r.metadata.get("sheet_name"),
                "slide_number": r.metadata.get("slide_number"),
                "chunk_index": r.metadata.get("chunk_index"),
                "vector_rank": r.metadata.get("vector_rank"),
                "bm25_rank": r.metadata.get("bm25_rank"),
            }
            for r in retrieved_results
        ]

        if not retrieved_results:
            log.warning("No context chunks retrieved. Yielding final empty response.")
            yield {"type": "token", "content": "I could not find any documents related to your question in this workspace."}
            yield {
                "type": "explain",
                "content": {
                    "confidence": 0.0,
                    "retrieved_chunks": [],
                    "reranked_chunks": [],
                    "query_expansions": expanded_queries,
                    "latencies": {
                        "expansion_ms": round(t_expansion, 2),
                        "retrieval_ms": round(t_retrieval, 2),
                        "reranking_ms": 0.0,
                        "generation_ms": 0.0,
                    },
                    "model_info": self.llm.get_model_info()._asdict(),
                }
            }
            return

        # 3. Rerank Phase (Two-stage precision)
        t0 = time.perf_counter()
        candidate_texts = [r.document for r in retrieved_results]
        candidate_metadatas = [r.metadata for r in retrieved_results]

        reranked_results = await self.reranker.rerank(
            query=query,
            documents=candidate_texts,
            metadatas=candidate_metadatas,
            top_k=5,
        )
        t_reranking = (time.perf_counter() - t0) * 1000

        print(f"🔍 Hybrid Retrieval\n"
              f"────────────────────────────\n"
              f"Multi-Queries {len(expanded_queries)}\n"
              f"Candidates    {len(retrieved_results)}\n"
              f"Reranked      {len(reranked_results)}")

        # 4. Small-to-Big Context Reconstruction & Citations
        reranked_details = []
        context_parts = []
        citations = []

        for rank_idx, r in enumerate(reranked_results):
            orig_candidate = retrieved_results[r.index]
            meta = orig_candidate.metadata
            filename = meta.get("filename", "Unknown")

            # Small-to-Big Retrieval: Use parent section if available for richer LLM context
            llm_text = meta.get("parent_content") or r.document

            # Format coordinate references
            page_ref = ""
            if meta.get("page_number"):
                page_ref = f"page {meta['page_number']}"
            elif meta.get("sheet_name"):
                page_ref = f"sheet {meta['sheet_name']}"
            elif meta.get("slide_number"):
                page_ref = f"slide {meta['slide_number']}"

            # Format for LLM context injection
            context_parts.append(
                f"Source: [{filename}] {page_ref}\n"
                f"Content: {llm_text}\n"
            )

            # Store citation metadata
            citations.append({
                "filename": filename,
                "page_number": meta.get("page_number"),
                "sheet_name": meta.get("sheet_name"),
                "slide_number": meta.get("slide_number"),
                "content_preview": r.document[:200] + "...",
            })

            reranked_details.append({
                "id": orig_candidate.id,
                "document": r.document,
                "score": r.score,
                "filename": filename,
                "page_number": meta.get("page_number"),
                "sheet_name": meta.get("sheet_name"),
                "slide_number": meta.get("slide_number"),
                "chunk_index": meta.get("chunk_index"),
                "rank": rank_idx + 1,
            })

        # 5. Build prompt
        context_str = "\n\n".join(context_parts)
        prompt_messages = build_answer_prompt(
            query=query,
            context=context_str,
            chat_history=chat_history,
        )

        # 6. Stream response from LLM
        t0_gen = time.perf_counter()

        # Yield citations first
        yield {"type": "citations", "content": citations}

        full_response_text = ""
        async for token in self.llm.stream(prompt_messages):
            full_response_text += token
            yield {"type": "token", "content": token}

        t_generation = (time.perf_counter() - t0_gen) * 1000
        t_total = (time.perf_counter() - t_start) * 1000

        # Calculate grounding confidence
        if reranked_results:
            top_score = reranked_results[0].score
            # Normalize confidence percentage
            if top_score > 1.0:
                confidence = min(99.0, max(50.0, top_score))
            else:
                confidence = round(max(0.1, min(0.99, top_score)) * 100, 1)
        else:
            confidence = 0.0

        # 7. Yield Final Explainability Metadata
        explain_payload = {
            "confidence": confidence,
            "query_expansions": expanded_queries,
            "retrieved_chunks": retrieved_details,
            "reranked_chunks": reranked_details,
            "total_candidates": len(retrieved_results),
            "reranked_count": len(reranked_results),
            "latencies": {
                "expansion_ms": round(t_expansion, 2),
                "retrieval_ms": round(t_retrieval, 2),
                "reranking_ms": round(t_reranking, 2),
                "generation_ms": round(t_generation, 2),
                "total_ms": round(t_total, 2),
            },
            "model_info": self.llm.get_model_info()._asdict(),
        }

        yield {"type": "explain", "content": explain_payload}
        log.info("Advanced RAG pipeline complete", total_ms=t_total, confidence=confidence)
