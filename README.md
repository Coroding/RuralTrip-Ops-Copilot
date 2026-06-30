# 村游灵感地图｜江浙沪乡村文旅路线与内容生成工具

这是一个面向求职作品集展示的 AI 产品 Demo。它不是单纯展示“我做了一个 RAG 知识库”，而是演示：为了避免 AI 乡村游推荐停留在无依据生成，我将江浙沪乡村文旅资料拆成村庄案例卡和规划方法卡，构建 RAG 证据层，让用户输入旅行偏好后，系统能够检索相似案例，并基于案例生成路线建议、地点卡片和内容草稿。

## 项目重点

- 产品场景：江浙沪周末乡村游、轻内容创作者、规划/文旅调研用户。
- 核心链路：用户需求 → RAG 检索乡村案例 → 推荐依据 → 路线卡 → 小红书攻略 / 地图视频脚本。
- 展示页面：`product_demo.html`，可直接双击打开；本地 API 启动后显示真实 RAG 检索结果。
- 证据层：案例来源、村庄气质、适合人群、主要活动、风险提示和 confidence 会在前端卡片中显式展示。

## 知识包路径

```text
data\jiangzhehu_rag_knowledge_pack
```

该目录已包含：

- `data_cards/`：村庄案例卡
- `knowledge_cards/`：方法卡、产品规则、Badcase、指标知识卡
- `rag_schema.md`
- `knowledge_index.csv`
- `village_case_index.csv`
- `eval/eval_questions.json`

## 安装依赖

在 Windows 终端中执行：

```bat
cd /d "E:\W-项目学习\江浙沪乡村文旅项目agent"

py -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt
```

依赖包含：

- `chromadb`
- `sentence-transformers`
- `langchain-text-splitters`
- `fastapi`
- `uvicorn`
- `python-frontmatter`
- `pandas`
- `pydantic`

## 构建向量库

```bat
python rag\build_vector_db.py
```

脚本会递归读取 `data\jiangzhehu_rag_knowledge_pack` 下的 Markdown 文件，解析 YAML front matter，用 `RecursiveCharacterTextSplitter` 切分正文，并写入：

```text
rag\chroma_db
```

collection 名称：

```text
village_travel_knowledge
```

为了保证作品集录屏和离线演示稳定，脚本默认使用 `local-hash-fallback` 本地向量兜底，不会卡在模型下载上。需要启用 `sentence-transformers` 语义模型时，先设置环境变量再重建：

```bat
set RAG_USE_SENTENCE_TRANSFORMERS=1
set RAG_DOWNLOAD_MODELS=1
python rag\build_vector_db.py
```

启用模型后会优先使用 `BAAI/bge-m3`，如果加载失败会依次尝试：

```text
shibing624/text2vec-base-chinese
sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

## 命令行检索

```bat
python rag\query_rag.py "上海出发，有水、有咖啡、适合拍照、不太商业化的一日游"
```

输出会展示 Top 5 结果，包括村庄、区域、类型、适合人群、主要活动、标签、风险、来源、confidence 和内容片段，适合截图放入作品集。

## 启动 API

```bat
uvicorn rag.rag_api:app --reload --host 127.0.0.1 --port 8000
```

接口：

```text
GET  /api/rag/search?q=上海出发，有水，有咖啡&top_k=5
POST /api/demo/generate
```

浏览器验证：

```text
http://127.0.0.1:8000/api/rag/search?q=上海出发，有水，有咖啡
```

## 打开产品 Demo 页面

直接双击：

```text
product_demo.html
```

如果 API 未启动，Demo 区会显示友好提示：

```text
请先启动本地 RAG API：uvicorn rag.rag_api:app --reload --host 127.0.0.1 --port 8000
```

如果 API 已启动，点击“生成村游路线”会调用：

```text
POST http://127.0.0.1:8000/api/demo/generate
```

页面会展示：

- 检索到的相似案例
- 推荐摘要
- 上午 / 中午 / 下午 / 傍晚路线
- 小红书标题、图文大纲、拍照清单、地图视频脚本开头
- RAG 推荐依据和风险提醒

## 批量评估

```bat
python rag\run_eval.py
```

报告输出到：

```text
outputs\rag_test_report.md
```

## 页面展示重点

`product_demo.html` 的重点不是技术测试，而是产品思考：

- 用户是谁
- 痛点是什么
- 为什么做江浙沪乡村文旅垂直场景
- 为什么先做“灵感到路线”
- 为什么需要 RAG 证据层
- AI 可能出什么错
- 怎么兜底
- 怎么验证产品价值

## 常见问题

**1. 构建向量库时模型下载很慢怎么办？**  
`BAAI/bge-m3` 较大，首次运行可能需要下载。脚本已提供 fallback 模型；如果网络受限，建议提前配置 Hugging Face 镜像或手动下载模型缓存。

**2. API 返回 503 怎么办？**  
通常是还没有执行 `python rag\build_vector_db.py`，或 `rag\chroma_db` 中没有 `village_travel_knowledge` collection。

**3. 双击 HTML 后点击按钮报错怎么办？**  
先确认 API 已启动：

```bat
uvicorn rag.rag_api:app --reload --host 127.0.0.1 --port 8000
```

**4. 页面为什么不直接调用大模型？**  
这个 MVP 重点是验证“有证据的推荐”和作品集展示链路，因此 `POST /api/demo/generate` 先基于 Top 3 检索结果做规则化生成，不调用付费 API。

**5. 是否删除或改写了原有 HTML/Figma 导出？**  
没有。已有 `index.html`、`dist/`、`src/` 等原型文件保留，本次只新增 RAG 后端、`product_demo.html`、测试和说明文件。
