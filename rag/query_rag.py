from __future__ import annotations

import argparse
from pathlib import Path

import chromadb

try:
    from rag.embeddings import SentenceTransformerEmbeddingFunction
    from rag.rag_core import CHROMA_DB_DIR, COLLECTION_NAME, rerank_results, result_from_chroma
except ModuleNotFoundError:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from rag.embeddings import SentenceTransformerEmbeddingFunction  # type: ignore
    from rag.rag_core import CHROMA_DB_DIR, COLLECTION_NAME, rerank_results, result_from_chroma  # type: ignore


def search(query: str, top_k: int = 5) -> list[dict]:
    if not CHROMA_DB_DIR.exists():
        raise RuntimeError("未找到 rag/chroma_db，请先运行 python rag\\build_vector_db.py")

    client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
    collection = client.get_collection(
        name=COLLECTION_NAME,
        embedding_function=SentenceTransformerEmbeddingFunction(),
    )
    n_results = min(collection.count(), max(top_k * 6, top_k))
    response = collection.query(query_texts=[query], n_results=n_results)
    docs = response.get("documents", [[]])[0]
    metadatas = response.get("metadatas", [[]])[0]
    distances = response.get("distances", [[]])[0]
    results = [
        result_from_chroma(rank=index + 1, document=doc, metadata=metadata, distance=distance)
        for index, (doc, metadata, distance) in enumerate(zip(docs, metadatas, distances))
    ]
    return rerank_results(query, results, top_k)


def print_results(query: str, results: list[dict]) -> None:
    print(f"\n村游灵感地图｜RAG 检索结果")
    print(f"用户需求: {query}")
    print("=" * 72)
    for item in results:
        print(f"\nTop {item['rank']} | distance: {item.get('score_distance')}")
        print(f"标题: {item.get('title')}")
        print(f"村庄: {item.get('village') or '-'}")
        print(f"区域: {item.get('region') or '-'}")
        print(f"类型: {item.get('type') or '-'}")
        print(f"适合人群: {item.get('audience') or '-'}")
        print(f"主要活动: {item.get('activities') or '-'}")
        print(f"标签: {item.get('tags') or '-'}")
        print(f"风险提醒: {item.get('risk') or '-'}")
        print(f"来源: {item.get('source') or '-'}")
        print(f"confidence: {item.get('confidence') or '-'}")
        print(f"匹配理由: {item.get('match_reason')}")
        print(f"内容片段: {item.get('content')}")
        print("-" * 72)


def main() -> None:
    parser = argparse.ArgumentParser(description="查询江浙沪乡村文旅 RAG 案例库")
    parser.add_argument("query", help="用户输入的村游需求")
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()
    print_results(args.query, search(args.query, args.top_k))


if __name__ == "__main__":
    main()
