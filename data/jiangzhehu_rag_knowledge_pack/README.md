# 江浙沪乡村文旅RAG知识包

本知识包服务于你的“村游灵感地图 / 江浙沪乡村文旅路线与内容生成工具”。

## 内容
- data_cards：33 个乡村/片区案例卡
- knowledge_cards：10 个规划方法、产品规则、RAG入库、Badcase与指标知识卡
- templates：输出模板
- eval：RAG测试问题
- rag_schema.md：向量库字段与检索策略

## 使用方式
1. 将 data_cards 和 knowledge_cards 作为RAG知识库原始文件。
2. 优先按Markdown文件入库，不建议直接把365页PDF全文切块入库。
3. 用metadata区分 village_case_card 和 knowledge_card。
4. 前端展示时，把检索到的案例作为“推荐依据”，而不是隐藏在后台。

## 推荐入库顺序
1. 先入库 high confidence 案例。
2. 再加入 medium confidence 案例。
3. low confidence 案例建议后续人工补全后再作为正式推荐结果。

## 文件来源
主要依据上传的《青年引领助振兴、知行合一求真知——暨乡村振兴博士团引领的长三角地区青年入乡调研和乡村共创实践探索》PDF整理。
