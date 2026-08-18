"""
Unit tests for BetterBee RAG pipeline components:
- Parsers & page metadata preservation
- Chunker splitting with exact metadata
- Search schemas
"""

import pytest
from app.rag.parser import TextParser
from app.rag.chunker import Chunker
from app.schemas.search import SearchChunkMatch


def test_text_parser_metadata():
    parser = TextParser()
    raw_bytes = b"Hello BetterBee World! Testing private AI workspace."
    text, meta = parser.parse(raw_bytes)

    assert "Hello BetterBee" in text
    assert len(meta) == 1
    assert meta[0]["page_number"] == 1
    assert meta[0]["text"] == text


def test_chunker_metadata_preservation():
    chunker = Chunker(chunk_size=50, chunk_overlap=10)
    page_metadata = [
        {"page_number": 1, "text": "This is page one of our confidential report."},
        {"page_number": 2, "text": "This is page two detailing financials and balance sheets."},
    ]
    full_text = "\n\n".join([p["text"] for p in page_metadata])
    chunks = chunker.split_text(full_text, page_metadata)

    assert len(chunks) >= 2
    # Ensure page numbers are correctly attached
    page_numbers = [c["metadata"].get("page_number") for c in chunks]
    assert 1 in page_numbers
    assert 2 in page_numbers
    for c in chunks:
        assert "content" in c
        assert "chunk_index" in c


def test_search_chunk_match_schema():
    match = SearchChunkMatch(
        chunk_id="chunk-001-uuid-or-str",
        content="Test content chunk snippet",
        score=0.985,
        metadata={"page_number": 3, "filename": "financials.pdf"},
    )
    assert match.chunk_id == "chunk-001-uuid-or-str"
    assert match.score == 0.985


def test_reciprocal_rank_fusion():
    from app.rag.hybrid import reciprocal_rank_fusion
    from app.rag.interfaces.vectorstore import SearchResult

    res1 = SearchResult(id="1", document="Termination clause requires 60 days notice", metadata={}, score=0.9)
    res2 = SearchResult(id="2", document="Financial balance sheet with capital expenditure", metadata={}, score=0.8)
    res3 = SearchResult(id="3", document="Termination penalty equals 50 percent fee", metadata={}, score=0.7)

    fused = reciprocal_rank_fusion(
        vector_results=[res1, res2, res3],
        all_chunks=[res1, res2, res3],
        query="termination notice 60 days",
        top_k=2,
    )

    assert len(fused) == 2
    # Document 1 matches both vector and BM25 keywords "termination notice 60 days", so it should be rank 1
    assert fused[0].id == "1"
    assert "rrf_score" in fused[0].metadata


def test_parent_child_chunking():
    chunker = Chunker(chunk_size=40, chunk_overlap=5)
    page_metadata = [
        {"page_number": 1, "text": "Paragraph A introduces section one. Paragraph B elaborates on subsection two. Paragraph C concludes the overview."},
    ]
    chunks = chunker.split_text(page_metadata[0]["text"], page_metadata)
    assert len(chunks) > 1
    # Check that parent_content is present and larger than child chunk
    for c in chunks:
        assert "parent_content" in c["metadata"]
        assert len(c["metadata"]["parent_content"]) >= len(c["content"])

