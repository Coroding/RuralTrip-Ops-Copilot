# DeepSeek 接入说明

本项目不要把 DeepSeek API key 写进前端代码。请通过本地 Node 代理调用：

```powershell
$env:DEEPSEEK_API_KEY="你的 DeepSeek API key"
npm run build:standalone
npm run serve:ai
```

然后打开：

```text
http://127.0.0.1:8787/
```

接口：

```http
POST /api/deepseek/chat
Content-Type: application/json
```

请求示例：

```json
{
  "model": "deepseek-v4-flash",
  "messages": [
    { "role": "system", "content": "你是乡村商业规划助手。" },
    { "role": "user", "content": "生成花卉精油项目建议。" }
  ]
}
```

前端已在“报告输出”页面加入 DeepSeek 智能补充按钮。直接双击打开 `dist/index.html` 只能看静态页面；需要 AI 能力时，请使用上面的 `serve:ai` 方式启动。
