---
id: "knowledge_01"
doc_type: "knowledge_card"
title: "RAG入库结构：村庄案例卡字段规范"
tags:
  - "RAG"
  - "知识库"
  - "案例卡"
  - "字段规范"
source: "结合项目PDF案例组织结构与RAG工程实践"
use_for:
  - "retrieval_context"
  - "product_reasoning"
  - "prompt_context"
---
# RAG入库结构：村庄案例卡字段规范

## 核心原则
不要把完整PDF直接切块作为唯一知识源。乡村文旅推荐需要“地点-人群-业态-机制-风险”的结构化证据，因此每个村庄应拆成独立案例卡。

## 推荐字段
- village：村庄名称
- region/province：区域与省份
- case_type：村庄气质类型
- mechanism：赋能机制或青年入乡机制
- suitable_users：适合用户
- activities：主要玩法/业态
- tags：检索标签
- source_pages：来源页码
- confidence：置信度，高/中/低
- risks：风险与不确定信息

## 检索价值
结构化字段用于精准过滤，正文用于语义检索。推荐系统可先按地点、活动、人群过滤，再用向量相似度排序。
