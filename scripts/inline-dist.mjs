import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = fileURLToPath(new URL("../dist/", import.meta.url));
const assetsDir = join(distDir, "assets");

const cssFile = readdirSync(assetsDir).find((name) => name.endsWith(".css"));
const jsFile = readdirSync(assetsDir).find((name) => name.endsWith(".js"));

if (!cssFile || !jsFile) {
  throw new Error("Cannot find built CSS/JS files in dist/assets. Run npm run build first.");
}

const css = readFileSync(join(assetsDir, cssFile), "utf8");
const js = readFileSync(join(assetsDir, jsFile), "utf8");

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>智链青乡 商业规划</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
${js}
    </script>
  </body>
</html>
`;

writeFileSync(join(distDir, "standalone.html"), html, "utf8");
writeFileSync(join(distDir, "index.html"), html, "utf8");
console.log("Created dist/standalone.html and replaced dist/index.html");
