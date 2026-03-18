# Active Context - 2026-03-18

## Current Focus

- **Clean Sabretooth baseline:** `C:\ANTIGRAVITY` on `main` is clean again after committing the pending privacy, video, double-date, deployment-prep, and security-redaction work.
- **Frontend is live:** Cloudflare Pages deploy succeeded on March 18, 2026 and `https://youandinotai.com` returned `200`.
- **OpenClaw is stable on Sabretooth:** the real gateway path is `C:\Users\joshl\.openclaw\gateway.cmd`, the scheduled task is enabled, and `http://127.0.0.1:18789/healthz` is the current health check.
- **Ollama remains the local baseline:** Sabretooth local models include `qwen2.5:7b` and `qwen2.5:3b` on `127.0.0.1:11434`.
- **Continuity copy updated:** repo memory is being refreshed to match March 18 truth and mirrored into Personal Vault with a dated snapshot.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **Worktree:** clean
- **Backend validation:** `61 passed`
- **Frontend validation:** `npm run build` passed
- **Scheduled task:** `OpenClaw Gateway` is enabled and points to `C:\Users\joshl\.openclaw\gateway.cmd`
- **Gateway health:** `http://127.0.0.1:18789/healthz` returns JSON live health
- **Ollama health:** `http://127.0.0.1:11434/api/tags` returns local models

## Recently Finished

- Added privacy/GDPR API routes and frontend dashboard wiring
- Added WebRTC signaling relay and frontend video chat component
- Added double-date proposal flow, migrations, and backend tests
- Created production `.env` from template + vault values with the required local overrides
- Repaired the missing OpenClaw gateway launcher and enabled the Windows scheduled task
- Deployed the frontend to Cloudflare Pages from Sabretooth
- Redacted archived Cloudflare credentials from tracked repo history/files

## Current Risks / Open Items

1. **Cloudflare API token in `.env` is still invalid.** Wrangler OAuth works locally, but the scoped API token value in `.env` still fails verify with `401`.
2. **Square webhook signature key is still unresolved.** Square access token is valid, but subscription discovery returned `500`, so no fresh signature key was recovered.
3. **Docker is unavailable on Sabretooth.** Container-based backend smoke tests cannot run here until Docker is installed or restored.

## Rules To Preserve

1. Treat Sabretooth as the authoritative live repo and orchestration node.
2. Keep secrets in local `.env` or Personal Vault only.
3. Keep ENIGMA and OMEGA fully separated.
4. Do not reintroduce hardcoded credentials into repo files.
