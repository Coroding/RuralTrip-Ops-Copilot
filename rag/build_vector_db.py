from __future__ import annotations

import shutil
from pathlib import Path

import chromadb

try:
    from rag.embeddings import SentenceTransformerEmbeddingFunction
    from rag.rag_core import (
        CHROMA_DB_DIR,
        COLLECTION_NAME,
        KNOWLEDGE_BASE_DIR,
        discover_markdown_files,
        load_markdown_document,
        stable_chunk_id,
    )
except ModuleNotFoundError:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from rag.embeddings import SentenceTransformerEmbeddingFunction  # type: ignore
    from rag.rag_core import (  # type: ignore
        CHROMA_DB_DIR,
        COLLECTION_NAME,
        KNOWLEDGE_BASE_DIR,
        discover_markdown_files,
        load_markdown_document,
        stable_chunk_id,
    )


def build_vector_db() -> tuple[int, int]:
    if CHROMA_DB_DIR.exists():
        shutil.rmtree(CHROMA_DB_DIR)
    CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
    embedding_function = SentenceTransformerEmbeddingFunction()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"},
    )

    documents = [load_markdown_document(path, KNOWLEDGE_BASE_DIR) for path in discover_markdown_files(KNOWLEDGE_BASE_DIR)]
    ids: list[str] = []
    chunks: list[str] = []
    metadatas: list[dict[str, str]] = []

    for document in documents:
        path = document["path"]
        text_chunks = split_text(document["content"])
        for index, chunk in enumerate(text_chunks):
            ids.append(stable_chunk_id(path, index))
            chunks.append(chunk)
            metadata = dict(document["metadata"])
            metadata["chunk_index"] = str(index)
            metadatas.append(metadata)

    if chunks:
        collection.upsert(ids=ids, documents=chunks, metadatas=metadatas)

    print(f"入库文件数: {len(documents)}")
    print(f"入库 chunk 数: {len(chunks)}")
    print(f"collection: {COLLECTION_NAME}")
    print(f"embedding model: {embedding_function.model_name}")
    print(f"数据库路径: {CHROMA_DB_DIR}")
    return len(documents), len(chunks)


def split_text(text: str, chunk_size: int = 850, chunk_overlap: int = 130) -> list[str]:
    if should_use_langchain_splitter():
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", "。", "；", "，", " ", ""],
        )
        return splitter.split_text(text)

    clean = text.strip()
    if not clean:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(clean):
        end = min(start + chunk_size, len(clean))
        if end < len(clean):
            breakpoints = [clean.rfind(sep, start, end) for sep in ("\n\n", "\n", "。", "；", "，", " ")]
            best = max(breakpoints)
            if best > start + chunk_size // 2:
                end = best + 1
        chunks.append(clean[start:end].strip())
        if end >= len(clean):
            break
        start = max(0, end - chunk_overlap)
    return [chunk for chunk in chunks if chunk]


def should_use_langchain_splitter() -> bool:
    import os

    return os.getenv("RAG_USE_LANGCHAIN_SPLITTER") == "1"


if __name__ == "__main__":
    build_vector_db()
