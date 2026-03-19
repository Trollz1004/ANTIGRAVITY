# PROJECT STATE — LIVE BASELINE

**Last Updated:** 2026-03-19

This file is the short-form current state. For canonical repo truth, use:

- `C:\ANTIGRAVITY\AGENTS.md`
- `C:\ANTIGRAVITY\briefings\REPOSITORY_RECORD.md`
- `C:\ANTIGRAVITY\memory\activeContext.md`
- `C:\ANTIGRAVITY\briefings\LIVE-PAYMENT-SOURCE-OF-TRUTH.md`

## Current Live Repo

| Field | Value |
|-------|-------|
| Authoritative root | `C:\ANTIGRAVITY` |
| Branch | `main` |
| Head | `346facc` |
| Worktree | Clean on March 19, 2026 |
| Frontend | Cloudflare Pages |
| Backend | FastAPI + PostgreSQL on Cloud Run |
| Payments | Square |
| OpenClaw | Local Sabretooth gateway on `127.0.0.1:18789` |
| Ollama | Local on `127.0.0.1:11434` |

## Product Truth

- **YouAndINotAI** remains the primary active product in this repo.
- **Cloudflare Pages** frontend is live and again reaches the real backend through the fixed worker proxy.
- **Cloud Run backend** was restored on March 19, 2026 and now serves the correct FastAPI application.
- **Backend test suite** passed with `67` tests on March 19, 2026.
- **Crossfire on 9020** now runs with a local FastAPI backend on port `8000` and Vite frontend on port `5173`.

## Operational Truth

- Sabretooth is the authoritative live node and current command post.
- The continuity backup root on this machine is `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`.
- The continuity env backups fully cover the populated keys in the live `.env`.
- T5500 was used to execute the backend recovery deploy.
- 9020 is now the active node for crossfire and marketing workloads.

## Known Gaps

1. The stale `CLOUDFLARE_API_TOKEN` in `.env` remains documentation debt, but not a live deploy blocker.
2. Docker is not part of the current Sabretooth baseline.
3. `crossfire` on 9020 currently relies on detached processes rather than a service manager.
