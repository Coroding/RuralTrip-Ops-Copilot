from __future__ import annotations

import hashlib
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_BASE_DIR = PROJECT_ROOT / "data" / "jiangzhehu_rag_knowledge_pack"
CHROMA_DB_DIR = PROJECT_ROOT / "rag" / "chroma_db"
COLLECTION_NAME = "village_travel_knowledge"

REQUIRED_METADATA_KEYS = [
    "village",
    "region",
    "type",
    "audience",
    "activities",
    "tags",
    "risk",
    "source",
    "confidence",
    "doc_type",
    "source_path",
    "file_name",
    "title",
]


@dataclass
class DemoRequest:
    query: str
    travel_style: str = "轻松拍照"
    duration: str = "一日游"
    departure: str = "上海"
    content_goal: str = "小红书图文"


def detect_doc_type(path: Path) -> str:
    normalized = "/".join(path.parts).lower()
    name = path.name.lower()
    if "index" in name:
        return "index"
    if name == "rag_schema.md" or "schema" in name:
        return "schema"
    if "data_cards" in normalized or "village_cases" in normalized or "case" in name:
        return "village_case"
    if "knowledge_cards" in normalized or "method_cards" in normalized or name.startswith("method_"):
        return "method_card"
    return "unknown"


def normalize_doc_type(raw: Any, path: Path) -> str:
    value = stringify(raw).lower()
    if value in {"village_case", "village_case_card"}:
        return "village_case"
    if value in {"method_card", "knowledge_card"}:
        return "method_card"
    if value in {"schema", "index"}:
        return value
    return detect_doc_type(path)


def slugify(value: str) -> str:
    text = value.strip().lower()
    text = re.sub(r"[^0-9a-zA-Z\u4e00-\u9fff]+", "-", text)
    text = text.strip("-")
    return text or hashlib.md5(value.encode("utf-8")).hexdigest()[:10]


def stable_chunk_id(path: Path, chunk_index: int) -> str:
    return f"{slugify(path.stem)}-{chunk_index:04d}"


def stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        return ", ".join(stringify(item) for item in value if stringify(item))
    if isinstance(value, dict):
        return ", ".join(f"{key}: {stringify(item)}" for key, item in value.items())
    return str(value).strip()


def first_heading(content: str, fallback: str) -> str:
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("#").strip()
    return fallback


def extract_risk(content: str) -> str:
    patterns = [
        r"##\s*\d*\.?\s*风险提醒.*?\n(?P<body>.*?)(?:\n##|\Z)",
        r"##\s*Badcase.*?\n(?P<body>.*?)(?:\n##|\Z)",
    ]
    for pattern in patterns:
        match = re.search(pattern, content, flags=re.S)
        if match:
            text = re.sub(r"\s+", " ", match.group("body")).strip()
            return text[:220]
    return ""


def parse_front_matter(path: Path) -> tuple[dict[str, Any], str]:
    raw = path.read_text(encoding="utf-8-sig")
    if not raw.startswith("---"):
        return {}, raw

    parts = raw.split("---", 2)
    if len(parts) < 3:
        return {}, raw

    fm_text = parts[1]
    body = parts[2].lstrip("\r\n")

    try:
        import frontmatter

        post = frontmatter.loads(raw)
        return dict(post.metadata), post.content
    except Exception:
        return parse_simple_yaml(fm_text), body


def parse_simple_yaml(text: str) -> dict[str, Any]:
    metadata: dict[str, Any] = {}
    current_key: str | None = None
    for line in text.splitlines():
        if not line.strip():
            continue
        if line.lstrip().startswith("-") and current_key:
            item = line.split("-", 1)[1].strip().strip("\"'")
            existing = metadata.setdefault(current_key, [])
            if isinstance(existing, list):
                existing.append(item)
            continue
        if ":" in line and not line.startswith(" "):
            key, value = line.split(":", 1)
            current_key = key.strip()
            value = value.strip().strip("\"'")
            metadata[current_key] = value if value else []
    return metadata


def normalize_metadata(raw: dict[str, Any], path: Path | None = None, content: str = "") -> dict[str, str]:
    path = path or Path(stringify(raw.get("source_path") or raw.get("file_name") or "unknown.md"))
    doc_type = normalize_doc_type(raw.get("doc_type"), path)
    title = stringify(raw.get("title")) or first_heading(content, path.stem)
    source = stringify(raw.get("source")) or stringify(raw.get("source_pages"))

    normalized = {
        "village": stringify(raw.get("village")),
        "region": stringify(raw.get("region")),
        "type": stringify(raw.get("type") or raw.get("case_type")),
        "audience": stringify(raw.get("audience") or raw.get("suitable_users")),
        "activities": stringify(raw.get("activities")),
        "tags": stringify(raw.get("tags")),
        "risk": stringify(raw.get("risk")) or extract_risk(content),
        "source": source,
        "confidence": stringify(raw.get("confidence")),
        "doc_type": doc_type,
        "source_path": stringify(raw.get("source_path")) or str(path).replace("\\", "/"),
        "file_name": stringify(raw.get("file_name")) or path.name,
        "title": title,
    }
    return {key: normalized.get(key, "") for key in REQUIRED_METADATA_KEYS}


def load_markdown_document(path: Path, base_dir: Path = KNOWLEDGE_BASE_DIR) -> dict[str, Any]:
    metadata, content = parse_front_matter(path)
    try:
        source_path = path.relative_to(base_dir)
    except ValueError:
        source_path = path
    metadata["source_path"] = str(source_path).replace("\\", "/")
    metadata["file_name"] = path.name
    normalized = normalize_metadata(metadata, source_path, content)
    return {"path": path, "content": content.strip(), "metadata": normalized}


def discover_markdown_files(base_dir: Path = KNOWLEDGE_BASE_DIR) -> list[Path]:
    preferred_parts = ("data_cards", "village_cases", "knowledge_cards", "method_cards")
    files = sorted(base_dir.rglob("*.md"))
    preferred = [path for path in files if any(part in path.parts for part in preferred_parts)]
    support = [path for path in files if path.name in {"rag_schema.md", "README.md"} or "template" in path.parts]
    remaining = [path for path in files if path not in preferred and path not in support]
    return preferred + support + remaining


def summarize_content(content: str, limit: int = 220) -> str:
    text = re.sub(r"\s+", " ", content).strip()
    return text[:limit] + ("..." if len(text) > limit else "")


def result_from_chroma(
    rank: int,
    document: str,
    metadata: dict[str, Any],
    distance: float | None,
) -> dict[str, Any]:
    item = {key: stringify(metadata.get(key)) for key in REQUIRED_METADATA_KEYS}
    item.update(
        {
            "rank": rank,
            "score_distance": distance,
            "content": summarize_content(document, 360),
            "match_reason": make_match_reason(item),
        }
    )
    return item


def make_match_reason(item: dict[str, Any]) -> str:
    village = item.get("village") or item.get("title") or "该案例"
    pieces = []
    for key in ("type", "activities", "tags", "audience"):
        value = stringify(item.get(key))
        if value:
            pieces.append(value)
    if not pieces:
        return f"{village} 与输入需求在语义上相近，可作为推荐依据。"
    return f"{village} 覆盖了 {pieces[0]} 等线索，可支撑本次路线与内容生成。"


def keyword_overlap(query: str, item: dict[str, Any]) -> float:
    query_chars = {char for char in query if "\u4e00" <= char <= "\u9fff"}
    if not query_chars:
        return 0.0
    haystack = "".join(
        stringify(item.get(key))
        for key in ("title", "village", "region", "type", "audience", "activities", "tags", "content")
    )
    hit_count = sum(1 for char in query_chars if char in haystack)
    return hit_count / len(query_chars)


def rerank_results(query: str, results: list[dict[str, Any]], top_k: int) -> list[dict[str, Any]]:
    def sort_key(item: dict[str, Any]) -> tuple[float, int]:
        distance = item.get("score_distance")
        score = float(distance) if distance is not None else 1.0
        if item.get("doc_type") == "village_case" or item.get("village"):
            score -= 0.35
        if item.get("confidence") == "high":
            score -= 0.05
        score -= min(0.25, keyword_overlap(query, item) * 0.25)
        return score, int(item.get("rank") or 999)

    reranked = sorted(results, key=sort_key)[:top_k]
    for index, item in enumerate(reranked, start=1):
        item["rank"] = index
        item["match_reason"] = make_match_reason(item)
    return reranked


def make_case_card(item: dict[str, Any]) -> dict[str, Any]:
    card = {
        "rank": item.get("rank"),
        "score_distance": item.get("score_distance"),
        "title": item.get("title") or item.get("village") or "未命名案例",
        "village": item.get("village") or item.get("title") or "未命名案例",
        "region": item.get("region", ""),
        "type": item.get("type", ""),
        "audience": item.get("audience", ""),
        "activities": item.get("activities", ""),
        "tags": item.get("tags", ""),
        "risk": item.get("risk", ""),
        "source": item.get("source", ""),
        "confidence": item.get("confidence", ""),
        "doc_type": item.get("doc_type", ""),
        "content": item.get("content", ""),
        "match_reason": item.get("match_reason") or make_match_reason(item),
    }
    return card


def build_demo_response(request: DemoRequest, results: Iterable[dict[str, Any]]) -> dict[str, Any]:
    cases = [make_case_card(item) for item in list(results)[:3]]
    primary = cases[0] if cases else {}
    village = primary.get("village") or "候选村庄"
    activities = primary.get("activities") or "村咖、村庄漫步、地方体验"
    tags = primary.get("tags") or "江浙沪乡村游"
    risk = primary.get("risk") or "地点营业时间、活动档期和交通衔接建议出发前请二次确认。"

    if cases:
        names = "、".join(card["village"] for card in cases if card.get("village"))
        summary = (
            f"基于 RAG 检索到的 {len(cases)} 个相似案例，优先推荐 {village}。"
            f"它与“{request.travel_style} / {request.duration} / {request.content_goal}”的需求匹配，"
            f"可参考的证据案例包括：{names}。"
        )
    else:
        summary = "当前未检索到足够案例，建议先补充知识库或降低筛选条件。"

    route_plan = [
        {"time": "上午", "action": f"从{request.departure}出发，抵达{village}后先做村庄气质观察与水乡/田园空间漫步。"},
        {"time": "中午", "action": f"选择村咖、轻食或本地餐饮停留，把{activities}中的高匹配体验作为主要内容点。"},
        {"time": "下午", "action": f"围绕{tags}拍摄地点卡片素材，补充民宿、书房、营地或手作体验等可编辑节点。"},
        {"time": "傍晚", "action": "整理路线顺序、交通确认和发布素材，避免把单个打卡点包装成完整体验。"},
    ]

    content_draft = {
        "xiaohongshu_titles": [
            f"上海出发也能当天来回的{village}，水乡感和咖啡都有了",
            f"不想只去网红景点，我用案例库找到这条{request.duration}村游路线",
            f"{village}怎么拍怎么逛：一条适合{request.travel_style}的江浙沪村游",
        ],
        "outline": [
            "先说明出发地、适合人群和路线节奏",
            "用 3 个地点卡讲清楚村庄气质、主要业态和停留理由",
            "给出交通、时间、预算和二次确认提醒",
            "最后补充哪些人适合去，哪些期待不适合",
        ],
        "shooting_list": [
            "入口或村庄肌理的建立镜头",
            "水边、桥、巷道或田园空间的慢镜头",
            "村咖、民宿、书房、营地等业态细节",
            "同行人互动或独处放空镜头",
            "地图路线截屏与地点卡片封面",
        ],
        "map_video_script_opening": (
            f"如果你从{request.departure}出发，想找一个不是单纯打卡、又能讲出村庄气质的地方，"
            f"这条以{village}为核心的{request.duration}路线，可以从一个真实案例开始。"
        ),
    }

    risk_notes = [
        "请二次确认营业时间、活动档期、停车和公共交通衔接。",
        "低置信度或来源不足的案例不作为主推荐，只作为备选灵感。",
        risk,
    ]

    return {
        "query": request.query,
        "retrieved_cases": cases,
        "recommendation_summary": summary,
        "route_plan": route_plan,
        "content_draft": content_draft,
        "risk_notes": risk_notes,
    }


def demo_request_from_dict(payload: dict[str, Any]) -> DemoRequest:
    data = {field: payload.get(field, getattr(DemoRequest, field, "")) for field in asdict(DemoRequest(query="")).keys()}
    data["query"] = stringify(payload.get("query")) or "我想从上海出发，找一个有水、有咖啡、适合拍照、不太商业化的一日游村子"
    return DemoRequest(**data)
