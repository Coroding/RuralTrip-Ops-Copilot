你是一个资深全栈工程师和RAG原型工程师。请基于当前文件夹中的 data_cards 和 knowledge_cards 构建本地向量RAG库。

技术建议：Python + Chroma PersistentClient + sentence-transformers BAAI/bge-m3 + FastAPI。

要求：
1. 读取所有Markdown文件，解析YAML front matter作为metadata。
2. 建立两个collection：village_case_cards 和 planning_knowledge_cards，或一个collection但保留doc_type metadata。
3. 使用RecursiveCharacterTextSplitter切分正文，chunk_size 700，chunk_overlap 120。
4. 创建 rag/build_vector_db.py、rag/query_rag.py、rag/rag_api.py。
5. API支持 GET /api/rag/search?q=xxx&top_k=5，并返回村庄名称、类型、适合人群、活动、风险、来源页码和正文摘要。
6. 将检索结果接入我的HTML原型，新增“推荐依据 / 案例库检索结果”模块。
7. 不要删除原有HTML和Figma导出文件。
