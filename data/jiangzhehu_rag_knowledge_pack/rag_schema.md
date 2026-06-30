# RAG知识库Schema建议

## Collection 1: village_case_cards
用于村庄推荐、路线生成、地点卡片、内容生成。

## Collection 2: planning_knowledge_cards
用于规划逻辑、青年入乡机制、路线原则、Badcase兜底。

## Chunk建议
- 案例卡：chunk_size 700-900，overlap 100-150。
- 方法卡：按二级标题切分，chunk_size 500-800。

## Metadata建议
id, doc_type, village, region, province, case_type, mechanism, suitable_users, activities, tags, source_pages, confidence, use_for。

## 检索策略
1. 如果用户问“去哪玩”，优先检索village_case_cards。
2. 如果用户问“为什么推荐/规划逻辑”，同时检索knowledge_cards。
3. 如果用户问“生成攻略/视频脚本”，检索village_case_cards + content_generation_principles。
4. 如果用户问“乡村机制/青年入乡”，检索village_case_cards + mechanism knowledge cards。
