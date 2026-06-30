import tempfile
from pathlib import Path
import unittest

from rag.rag_core import (
    DemoRequest,
    build_demo_response,
    detect_doc_type,
    load_markdown_document,
    normalize_metadata,
    rerank_results,
    stable_chunk_id,
)


class RagCoreTests(unittest.TestCase):
    def test_detect_doc_type_from_path(self):
        self.assertEqual(detect_doc_type(Path("data_cards/jijiadun.md")), "village_case")
        self.assertEqual(detect_doc_type(Path("knowledge_cards/method_01.md")), "method_card")
        self.assertEqual(detect_doc_type(Path("rag_schema.md")), "schema")
        self.assertEqual(detect_doc_type(Path("village_case_index.csv")), "index")
        self.assertEqual(detect_doc_type(Path("notes/other.md")), "unknown")

    def test_load_markdown_document_extracts_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            md_path = Path(tmp) / "data_cards" / "sample.md"
            md_path.parent.mkdir()
            md_path.write_text(
                """---
village: "计家墩村"
region: "苏州昆山锦溪"
activities:
  - "咖啡"
  - "皮划艇"
tags:
  - "水乡"
confidence: "high"
---
# 计家墩村｜乡村文旅案例卡

适合上海周末出发的水乡体验。
""",
                encoding="utf-8",
            )

            document = load_markdown_document(md_path, Path(tmp))

        self.assertEqual(document["metadata"]["village"], "计家墩村")
        self.assertEqual(document["metadata"]["title"], "计家墩村｜乡村文旅案例卡")
        self.assertEqual(document["metadata"]["doc_type"], "village_case")
        self.assertEqual(document["metadata"]["activities"], "咖啡, 皮划艇")
        self.assertIn("适合上海周末出发", document["content"])

    def test_normalize_metadata_keeps_required_keys(self):
        metadata = normalize_metadata({"village": "岑卜村", "source_pages": "12-14"})

        for key in [
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
        ]:
            self.assertIn(key, metadata)
        self.assertEqual(metadata["source"], "12-14")

    def test_stable_chunk_id_uses_file_stem_and_index(self):
        self.assertEqual(stable_chunk_id(Path("data_cards/jijiadun.md"), 3), "jijiadun-0003")

    def test_rerank_results_prefers_matching_village_cases(self):
        method = {
            "rank": 1,
            "score_distance": 0.2,
            "title": "路线生成原则",
            "doc_type": "method_card",
            "content": "路线生成 用户旅程",
        }
        case = {
            "rank": 2,
            "score_distance": 0.4,
            "title": "荻港村｜乡村文旅案例卡",
            "village": "荻港村",
            "doc_type": "village_case",
            "activities": "咖啡, 水乡, 拍照",
            "tags": "江南水乡, 低商业化",
            "confidence": "high",
            "content": "适合上海出发的一日游。",
        }

        reranked = rerank_results("上海出发，有水、有咖啡、适合拍照", [method, case], 1)

        self.assertEqual(reranked[0]["village"], "荻港村")
        self.assertEqual(reranked[0]["rank"], 1)

    def test_build_demo_response_uses_retrieved_cases(self):
        request = DemoRequest(
            query="上海出发，有水、有咖啡、适合拍照的一日游",
            travel_style="轻松拍照",
            duration="一日游",
            departure="上海",
            content_goal="小红书图文",
        )
        results = [
            {
                "rank": 1,
                "title": "计家墩村｜乡村文旅案例卡",
                "village": "计家墩村",
                "region": "苏州昆山锦溪",
                "type": "理想村+民宿+数字游民型",
                "audience": "上海周末度假用户, 宠物友好用户",
                "activities": "特色民宿, 咖啡, 皮划艇",
                "tags": "水乡, 理想村, 数字游民",
                "risk": "避免只呈现滤镜化田园",
                "source": "119-125",
                "confidence": "high",
                "doc_type": "village_case",
                "content": "计家墩是乡村生活共创集群。",
                "score_distance": 0.12,
            }
        ]

        response = build_demo_response(request, results)

        self.assertEqual(response["retrieved_cases"][0]["village"], "计家墩村")
        self.assertIn("计家墩村", response["recommendation_summary"])
        self.assertGreaterEqual(len(response["route_plan"]), 4)
        self.assertEqual(len(response["content_draft"]["xiaohongshu_titles"]), 3)
        self.assertIn("请二次确认", " ".join(response["risk_notes"]))


if __name__ == "__main__":
    unittest.main()
