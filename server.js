import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { buildPlanningPrompt } from "./config/planningPrompt.js";

const rootDir = process.cwd();
const distDir = join(rootDir, "dist");
const port = Number(process.env.PORT || 8787);
const apiKey = process.env.DEEPSEEK_API_KEY;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function handleDeepSeek(req, res) {
  if (!apiKey) {
    sendJson(res, 500, {
      error: "DEEPSEEK_API_KEY is not set",
      hint: "Set DEEPSEEK_API_KEY before starting the server."
    });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const messages = body.projectContext
    ? [
        { role: "system", content: buildPlanningPrompt(body.projectContext) },
        { role: "user", content: body.userPrompt || "请根据项目上下文生成完整规划建议。" }
      ]
    : Array.isArray(body.messages)
      ? body.messages
      : [];
  if (!messages.length) {
    sendJson(res, 400, { error: "messages is required" });
    return;
  }

  const upstreamPayload = {
    model: body.model || "deepseek-v4-flash",
    messages,
    stream: false,
    temperature: body.temperature ?? 0.7
  };

  if (body.thinking) upstreamPayload.thinking = body.thinking;
  if (body.reasoning_effort) upstreamPayload.reasoning_effort = body.reasoning_effort;

  try {
    const upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(upstreamPayload)
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      sendJson(res, upstream.status, { error: "DeepSeek API error", detail: data });
      return;
    }
    sendJson(res, 200, {
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage,
      raw: data
    });
  } catch (error) {
    sendJson(res, 502, { error: "Failed to call DeepSeek API", detail: error.message });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname || "/");
  const cleanPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const requested = pathname === "/" ? "index.html" : cleanPath.replace(/^[/\\]/, "");
  const filePath = join(distDir, requested);
  const indexPath = join(distDir, "index.html");
  const finalPath = existsSync(filePath) ? filePath : indexPath;
  const ext = extname(finalPath);

  try {
    await readFile(finalPath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    createReadStream(finalPath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }
  if (req.url?.startsWith("/api/deepseek/chat") && req.method === "POST") {
    await handleDeepSeek(req, res);
    return;
  }
  await serveStatic(req, res);
}).listen(port, "127.0.0.1", () => {
  console.log(`Commercial planning app: http://127.0.0.1:${port}`);
  console.log(apiKey ? "DeepSeek API key loaded from environment." : "DEEPSEEK_API_KEY is not set.");
});
