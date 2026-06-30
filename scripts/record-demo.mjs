import { spawn, execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, rmSync, renameSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(rootDir, "output");
const tempDir = join(outputDir, ".playwright-video");
const webmPath = join(outputDir, "demo.webm");
const mp4Path = join(outputDir, "demo.mp4");
const gifPath = join(outputDir, "demo.gif");
const port = process.env.DEMO_PORT || "8898";
const baseUrl = `http://127.0.0.1:${port}/`;
const videoSize = { width: 390, height: 820 };

mkdirSync(outputDir, { recursive: true });
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

for (const file of [webmPath, mp4Path, gifPath]) {
  rmSync(file, { force: true });
}

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const bundled = "C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";
    if (!existsSync(bundled)) {
      throw new Error("Playwright is not installed. Run: npm install -D playwright");
    }
    return await import(pathToFileURL(bundled).href);
  }
}

function npmCmd() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function nodeCmd() {
  return process.execPath;
}

function runBuild() {
  console.log("Building standalone demo...");
  const result = spawnSync(npmCmd(), ["run", "build:standalone"], {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`Build failed with exit code ${result.status ?? "unknown"}`);
  }
}

function startServer() {
  const server = spawn(nodeCmd(), ["server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: port,
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "demo-recording-placeholder"
    },
    stdio: "ignore",
    windowsHide: true
  });
  return server;
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await sleep(500);
  }
  throw new Error(`Local demo server did not become ready: ${baseUrl}`);
}

async function installCaptureMode(page) {
  await page.addInitScript(({ width, height }) => {
    const css = `
      html, body, #root {
        width: ${width}px !important;
        height: ${height}px !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: #fff !important;
      }
      #root > div {
        width: ${width}px !important;
        height: ${height}px !important;
        min-height: ${height}px !important;
        display: block !important;
        padding: 0 !important;
        background: #fff !important;
      }
      aside {
        position: fixed !important;
        left: -9999px !important;
        top: -9999px !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      section[aria-label] {
        width: ${width}px !important;
        height: ${height}px !important;
        margin: 0 !important;
      }
      .phone-frame {
        width: ${width}px !important;
        height: ${height}px !important;
        aspect-ratio: auto !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
      }
      .phone-screen {
        width: ${width}px !important;
        height: ${height}px !important;
        border: 0 !important;
        border-radius: 0 !important;
      }
      .bottom-nav {
        border-radius: 0 !important;
      }
      .screen-page {
        animation-duration: .42s !important;
      }
    `;
    const addStyle = () => {
      if (document.getElementById("demo-capture-style")) return;
      const style = document.createElement("style");
      style.id = "demo-capture-style";
      style.textContent = css;
      document.head.appendChild(style);
    };
    if (document.head) addStyle();
    document.addEventListener("DOMContentLoaded", addStyle, { once: true });
  }, videoSize);
}

async function mockDeepSeek(page) {
  await page.route("**/api/deepseek/chat", async (route) => {
    await sleep(900);
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        content: [
          "一、特色资源研判：村庄具备闲置土地、花卉种植基础、生态景观与院落空间，可形成轻资产启动的复合型乡村产业场景。",
          "二、产业建议：以花草精油生态产业园为主线，叠加研学体验、农文旅消费和村民共创工坊。",
          "三、改造建议：优先改造闲置院落为体验馆、共创教室和小型加工展示空间，保留乡土肌理并提升导视。",
          "四、基础设施优化：补齐停车、慢行步道、夜间照明、卫生间、数字导览与游客服务节点。",
          "五、运营建议：采用政府引导、村集体持股、运营团队托管的模式，按季度推出主题活动和课程产品。"
        ].join("\\n\\n"),
        usage: { prompt_tokens: 620, completion_tokens: 420 }
      })
    });
  });
}

async function frameBox(page) {
  return await page.locator(".phone-screen").boundingBox();
}

async function smoothMove(page, x, y, steps = 36) {
  await page.mouse.move(x, y, { steps });
}

async function smoothClick(page, target, options = {}) {
  const box = typeof target === "string"
    ? await page.locator(target).first().boundingBox()
    : await target.boundingBox();
  if (!box) throw new Error("Cannot click target; no bounding box.");
  const x = box.x + box.width * (options.xRatio ?? 0.5);
  const y = box.y + box.height * (options.yRatio ?? 0.5);
  await smoothMove(page, x, y, options.steps ?? 42);
  await sleep(options.before ?? 180);
  await page.mouse.down();
  await sleep(options.down ?? 90);
  await page.mouse.up();
  await sleep(options.after ?? 650);
}

async function clickAt(page, xRatio, yRatio, options = {}) {
  const box = await frameBox(page);
  const x = box.x + box.width * xRatio;
  const y = box.y + box.height * yRatio;
  await smoothMove(page, x, y, options.steps ?? 46);
  await sleep(options.before ?? 170);
  await page.mouse.down();
  await sleep(options.down ?? 90);
  await page.mouse.up();
  await sleep(options.after ?? 650);
}

async function scrollPhone(page, to, delay = 900) {
  await page.locator(".phone-content").evaluate((el, top) => {
    el.scrollTo({ top, behavior: "smooth" });
  }, to);
  await sleep(delay);
}

async function jump(page, index, settle = 900) {
  await page.evaluate((buttonIndex) => {
    document.querySelectorAll("aside button")[buttonIndex]?.click();
  }, index);
  await sleep(settle);
}

async function typeInto(page, inputIndex, value) {
  const input = page.locator("input").nth(inputIndex);
  await smoothClick(page, input, { after: 120 });
  await input.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type(value, { delay: 35 });
  await sleep(280);
}

async function recordDemo() {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    channel: "msedge",
    headless: false,
    args: ["--window-position=20,20"]
  });
  const context = await browser.newContext({
    viewport: videoSize,
    deviceScaleFactor: 1,
    recordVideo: { dir: tempDir, size: videoSize },
    reducedMotion: "no-preference"
  });
  const page = await context.newPage();
  await installCaptureMode(page);
  await mockDeepSeek(page);

  await page.goto(`${baseUrl}?screen=guide`, { waitUntil: "networkidle" });
  await page.locator(".phone-screen").waitFor({ state: "visible" });
  await sleep(1200);

  await smoothMove(page, 195, 720, 60);
  await sleep(500);
  await scrollPhone(page, 220, 800);
  await scrollPhone(page, 0, 700);
  await smoothClick(page, page.locator(".guide-bg button").last(), { after: 900 });

  await typeInto(page, 0, "嵊州三界镇竺新村");
  await typeInto(page, 1, "23.58ha 闲置土地");
  await typeInto(page, 3, "花草精油生态产业园");
  await scrollPhone(page, 520, 900);
  await clickAt(page, 0.5, 0.9, { after: 1000 });

  await scrollPhone(page, 420, 900);
  await clickAt(page, 0.5, 0.77, { after: 900 });

  await scrollPhone(page, 330, 900);
  await clickAt(page, 0.5, 0.78, { after: 1000 });

  await clickAt(page, 0.5, 0.63, { after: 900 });
  await scrollPhone(page, 280, 800);
  await clickAt(page, 0.5, 0.72, { after: 1000 });

  await clickAt(page, 0.82, 0.44, { after: 450 });
  await clickAt(page, 0.5, 0.58, { after: 2400 });
  await scrollPhone(page, 420, 1200);
  await scrollPhone(page, 900, 1200);
  await clickAt(page, 0.5, 0.91, { after: 900 });

  await clickAt(page, 0.27, 0.88, { after: 850 });
  await clickAt(page, 0.5, 0.88, { after: 1000 });

  await clickAt(page, 0.5, 0.58, { after: 1000 });
  await clickAt(page, 0.65, 0.79, { after: 500 });
  await clickAt(page, 0.32, 0.79, { after: 700 });

  await jump(page, 8);
  await clickAt(page, 0.63, 0.22, { after: 600 });
  await clickAt(page, 0.5, 0.32, { after: 900 });
  await scrollPhone(page, 460, 900);

  await jump(page, 9);
  await clickAt(page, 0.5, 0.36, { after: 600 });
  await page.keyboard.type("政策通知", { delay: 45 });
  await scrollPhone(page, 300, 800);

  await jump(page, 10);
  await clickAt(page, 0.48, 0.28, { after: 600 });
  await page.keyboard.type("乡村运营", { delay: 45 });
  await scrollPhone(page, 360, 900);

  await jump(page, 0);
  await sleep(1500);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const recorded = await video.path();
  copyFileSync(recorded, webmPath);
  return webmPath;
}

function findFfmpeg() {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const candidates = [
    join(rootDir, "node_modules", "@ffmpeg-installer", "win32-x64", "ffmpeg.exe"),
    join(rootDir, "node_modules", "ffmpeg-static", "ffmpeg.exe"),
    "ffmpeg"
  ];
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-version"], { stdio: "ignore", shell: candidate === "ffmpeg" });
    if (result.status === 0) return candidate;
  }
  return null;
}

function convertVideo() {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    console.warn("ffmpeg not found; kept WebM at output/demo.webm. Install ffmpeg to create MP4/GIF.");
    return false;
  }

  console.log("Converting WebM to MP4...");
  execFileSync(ffmpeg, [
    "-y",
    "-i", webmPath,
    "-movflags", "+faststart",
    "-pix_fmt", "yuv420p",
    "-vf", "fps=30,scale=390:-2",
    mp4Path
  ], { stdio: "inherit" });

  console.log("Exporting GIF preview...");
  execFileSync(ffmpeg, [
    "-y",
    "-i", mp4Path,
    "-vf", "fps=12,scale=260:-1:flags=lanczos",
    "-loop", "0",
    gifPath
  ], { stdio: "inherit" });
  return true;
}

let server;
try {
  runBuild();
  server = startServer();
  await waitForServer();
  console.log(`Recording demo from ${baseUrl}`);
  await recordDemo();
  const converted = convertVideo();
  console.log("");
  console.log(`WebM: ${webmPath}`);
  console.log(converted ? `MP4:  ${mp4Path}` : "MP4:  not created");
  console.log(converted ? `GIF:  ${gifPath}` : "GIF:  not created");
} finally {
  if (server && !server.killed) {
    server.kill();
  }
}
