"""
BetterBee — Query Transformation & Multi-Query Expansion.

Transforms incoming user questions into optimized search variations.
Offloads computation to Groq API (0 MB local RAM footprint).
"""

import json
import re
from typing import Any

import structlog

from app.rag.interfaces.llm import LLMProvider

logger = structlog.get_logger(__name__)


class QueryTransformer:
    """Generates expanded search queries and query reformulations for Advanced RAG."""

    def __init__(self, llm_provider: LLMProvider) -> None:
        self.llm = llm_provider

    async def expand_query(self, query: str, max_queries: int = 3) -> list[str]:
        """
        Generates 2-3 focused alternative search queries for the user question.
        Includes the original query as the primary entry.
        """
        # For short or already specific queries under 4 words, return original to save API calls
        words = query.strip().split()
        if len(words) < 4:
            return [query]

        prompt = (
            "You are an AI search query optimizer for an enterprise document search engine.\n"
            "Given the user's question, generate 2 different search queries that capture alternative "
            "phrasings, synonyms, and specific technical keywords.\n"
            "Respond ONLY with a JSON array of strings, e.g. [\"query 1\", \"query 2\"].\n\n"
            f"User Question: {query}"
        )

        try:
            response_text = await self.llm.generate(
                messages=[
                    {"role": "system", "content": "You output strictly JSON arrays of search strings."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )

            # Extract JSON array from response
            match = re.search(r"\[.*\]", response_text, re.DOTALL)
            if match:
                expanded = json.loads(match.group(0))
                if isinstance(expanded, list):
                    clean_queries = [str(q).strip() for q in expanded if str(q).strip()]
                    # Combine original query + generated queries (deduplicated)
                    combined = [query]
                    for q in clean_queries:
                        if q.lower() != query.lower() and q not in combined:
                            combined.append(q)
                    return combined[:max_queries]
        except Exception as e:
            logger.warning("Query expansion failed, falling back to original query", error=str(e))

        return [query]
