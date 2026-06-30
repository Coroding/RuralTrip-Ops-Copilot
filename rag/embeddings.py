from __future__ import annotations

import hashlib
import os
from typing import Iterable


MODEL_CANDIDATES = [
    "BAAI/bge-m3",
    "shibing624/text2vec-base-chinese",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
]


class HashEmbeddingFunction:
    def __init__(self, dimensions: int = 384):
        self.dimensions = dimensions
        self.model_name = "local-hash-fallback"

    def __call__(self, input: list[str]) -> list[list[float]]:
        return [self.embed(text) for text in input]

    def embed_query(self, input: list[str]) -> list[list[float]]:
        return self(input)

    def embed_documents(self, input: list[str]) -> list[list[float]]:
        return self(input)

    def name(self) -> str:
        return self.model_name

    def embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = [token for token in text if not token.isspace()]
        for token in tokens:
            digest = hashlib.md5(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "little") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign
        norm = sum(value * value for value in vector) ** 0.5 or 1.0
        return [value / norm for value in vector]


class SentenceTransformerEmbeddingFunction:
    def __init__(self, model_candidates: Iterable[str] = MODEL_CANDIDATES):
        use_models = os.getenv("RAG_USE_SENTENCE_TRANSFORMERS") == "1" or os.getenv("RAG_DOWNLOAD_MODELS") == "1"
        if os.getenv("RAG_USE_HASH_EMBEDDINGS") == "1" or not use_models:
            self.backend = HashEmbeddingFunction()
            self.model_name = self.backend.model_name
            return

        from sentence_transformers import SentenceTransformer

        configured = os.getenv("RAG_EMBEDDING_MODELS")
        candidates = [item.strip() for item in configured.split(",")] if configured else list(model_candidates)
        allow_download = os.getenv("RAG_DOWNLOAD_MODELS") == "1"
        last_error: Exception | None = None
        self.backend = None
        for model_name in candidates:
            try:
                self.model_name = model_name
                self.model = SentenceTransformer(model_name, local_files_only=not allow_download)
                break
            except Exception as exc:
                last_error = exc
        else:
            print(f"未能加载本地 sentence-transformers 模型，使用哈希兜底向量。原因: {last_error}")
            self.backend = HashEmbeddingFunction()
            self.model_name = self.backend.model_name

    def __call__(self, input: list[str]) -> list[list[float]]:
        if self.backend is not None:
            return self.backend(input)
        embeddings = self.model.encode(input, normalize_embeddings=True, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, input: list[str]) -> list[list[float]]:
        return self(input)

    def embed_documents(self, input: list[str]) -> list[list[float]]:
        return self(input)

    def name(self) -> str:
        return self.model_name
