from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.query_rag import search
from rag.rag_core import DemoRequest, build_demo_response


class DemoGenerateRequest(BaseModel):
    query: str
    travel_style: str = "轻松拍照"
    duration: str = "一日游"
    departure: str = "上海"
    content_goal: str = "小红书图文"


app = FastAPI(title="村游灵感地图 RAG API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/rag/search")
def rag_search(q: str = Query(..., min_length=1), top_k: int = 5) -> dict[str, Any]:
    try:
        results = search(q, top_k)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"query": q, "top_k": top_k, "results": results}


@app.post("/api/demo/generate")
def demo_generate(payload: DemoGenerateRequest) -> dict[str, Any]:
    try:
        retrieved = search(payload.query, 3)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    request = DemoRequest(**payload.model_dump())
    return build_demo_response(request, retrieved)
