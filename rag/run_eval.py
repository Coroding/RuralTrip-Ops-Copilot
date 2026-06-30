from __future__ import annotations

import json
from pathlib import Path

try:
    from rag.query_rag import search
    from rag.rag_core import KNOWLEDGE_BASE_DIR, PROJECT_ROOT
except ModuleNotFoundError:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1]))
    from rag.query_rag import search  # type: ignore
    from rag.rag_core import KNOWLEDGE_BASE_DIR, PROJECT_ROOT  # type: ignore


DEFAULT_QUESTIONS = [
    "上海出发，有水、有咖啡、适合拍照、不太商业化的一日游",
    "适合数字游民、远程办公、疗愈放空的江浙沪乡村",
    "适合带孩子、宠物友好、亲子活动的一日乡村游",
    "适合做地图叙事短视频的乡村路线，有村咖、民宿和水乡空间",
    "有乡村美学、民宿、咖啡和设计感的村庄",
    "想找一个适合规划专业学生做乡村调研和空间观察的村庄",
]


def load_eval_questions() -> list[str]:
    eval_path = KNOWLEDGE_BASE_DIR / "eval" / "eval_questions.json"
    if not eval_path.exists():
        eval_path.parent.mkdir(parents=True, exist_ok=True)
        eval_path.write_text(json.dumps(DEFAULT_QUESTIONS, ensure_ascii=False, indent=2), encoding="utf-8")
        return DEFAULT_QUESTIONS
    raw = json.loads(eval_path.read_text(encoding="utf-8-sig"))
    if raw and isinstance(raw[0], dict):
        return [item["query"] for item in raw if item.get("query")]
    return [str(item) for item in raw]


def run_eval() -> Path:
    questions = load_eval_questions()
    report_lines = ["# RAG 检索测试报告", ""]
    for index, query in enumerate(questions, start=1):
        report_lines.extend([f"## Query {index}", "", f"用户需求：{query}", ""])
        try:
            results = search(query, 3)
        except Exception as exc:
            report_lines.extend([f"检索失败：{exc}", ""])
            continue
        for item in results:
            report_lines.extend(
                [
                    f"### Top {item['rank']}",
                    "",
                    f"村庄：{item.get('village') or item.get('title')}",
                    f"类型：{item.get('type') or item.get('doc_type')}",
                    f"匹配理由：{item.get('match_reason')}",
                    f"来源：{item.get('source') or '-'}",
                    f"置信度：{item.get('confidence') or '-'}",
                    "",
                ]
            )

    output_dir = PROJECT_ROOT / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "rag_test_report.md"
    report_path.write_text("\n".join(report_lines), encoding="utf-8")
    print(f"已保存测试报告: {report_path}")
    return report_path


if __name__ == "__main__":
    run_eval()
