"""
BetterBee — Document Chunking.

Splits large extracted text into smaller, overlapping semantic chunks for vector embedding.
Preserves page/sheet/slide metadata during splitting.
"""

from typing import Any

import structlog
from langchain_core.documents import Document as LCDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class Chunker:
    """Handles splitting of text using LangChain's RecursiveCharacterTextSplitter."""

    def __init__(self, chunk_size: int | None = None, chunk_overlap: int | None = None) -> None:
        settings = get_settings()
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )
        logger.info(
            "Chunker initialized",
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )

    def split_text(
        self,
        text: str,
        page_metadata: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Splits raw text into metadata-aware chunks with Parent-Child context preservation.
        
        Each chunk contains:
        - `content`: Small-to-medium chunk for precise vector embedding.
        - `metadata.parent_content`: Broader surrounding section for full LLM synthesis.
        """
        lc_docs = []
        if page_metadata:
            for item in page_metadata:
                page_text = item.get("text", "")
                if not page_text.strip():
                    continue
                meta = {k: v for k, v in item.items() if k != "text"}
                lc_docs.append(LCDocument(page_content=page_text, metadata=meta))

        # Fallback if no page metadata or empty docs
        if not lc_docs and text.strip():
            lc_docs = [LCDocument(page_content=text, metadata={})]

        split_docs = self.splitter.split_documents(lc_docs)

        chunks = []
        total_docs = len(split_docs)

        for idx, doc in enumerate(split_docs):
            # Compute parent context window (preceding + current + following chunk)
            prev_content = split_docs[idx - 1].page_content if idx > 0 else ""
            next_content = split_docs[idx + 1].page_content if idx < total_docs - 1 else ""
            
            parent_parts = [p for p in [prev_content, doc.page_content, next_content] if p]
            parent_context = "\n\n".join(parent_parts)

            chunk_meta = {
                **doc.metadata,
                "parent_content": parent_context,
                "chunk_index": idx,
            }

            chunks.append({
                "chunk_index": idx,
                "content": doc.page_content,
                "token_count": len(doc.page_content.split()),
                "metadata": chunk_meta,
            })

        logger.debug("Document chunking complete with parent context", total_chunks=len(chunks))
        return chunks
