# RuralTrip Ops Copilot CloudBase Deployment

This repository is a Vite static frontend. CloudBase deployment builds the app and uploads `dist`.

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- CloudBase target path: `/ruraltrip-ops-copilot`
- Workflow: `.github/workflows/deploy-cloudbase.yml`

Required GitHub Actions secrets:

- `TCB_SECRET_ID`
- `TCB_SECRET_KEY`
- `TCB_ENV_ID`

Manual trigger:

```bash
gh workflow run "Deploy RuralTrip Ops Copilot to CloudBase" -R Coroding/RuralTrip-Ops-Copilot --ref main
```

Expected CloudBase URL:

```text
https://<your-cloudbase-static-domain>/ruraltrip-ops-copilot/
```
