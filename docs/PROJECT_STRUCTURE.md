# Project Structure

```text
.
├─ config/                 DeepSeek prompt templates
├─ data/examples/          Example project context data
├─ docs/                   Project docs and setup notes
├─ scripts/                Build helper scripts
├─ src/                    React + Tailwind frontend
├─ dist/                   Generated build output
├─ server.js               Local backend proxy for DeepSeek
├─ start.bat               One-click Windows launcher
└─ start.ps1               PowerShell launcher used by start.bat
```

`dist/` and `node_modules/` are generated folders. Edit source files under `src/`, prompt templates under `config/`, and docs under `docs/`.
