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
| Head | `main` (see git for current commit) |
| Worktree | Clean on March 19, 2026 |
| Frontend | Cloudflare Pages |
| Backend | FastAPI + PostgreSQL on Cloud Run |
| Payments | Square |
| OpenClaw | Local Sabretooth gateway on `127.0.0.1:18789` with Ollama-only model routing |
| Ollama | Local on `127.0.0.1:11434` |

## Product Truth

- **YouAndINotAI** remains the primary active product in this repo.
- **Cloudflare Pages** frontend is live and again reaches the real backend through the fixed worker proxy.
- **Cloud Run backend** was restored on March 19, 2026 and now serves the correct FastAPI application.
- **Backend test suite** passed with `67` tests on March 19, 2026.
- **Crossfire on 9020** now runs with a local FastAPI backend on port `8000` and Vite frontend on port `5173`.
- **SupportClaw on 9020** now runs outside the repo at `C:\SUPPORTCLAW-9020` and answers on `http://192.168.0.5:18895`.

## Operational Truth

- Sabretooth is the authoritative live node and current command post.
- The continuity backup root on this machine is `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`.
- The continuity env backups fully cover the populated keys in the live `.env`.
- The live OpenClaw configs on Sabretooth, 9020, and T5500 are now self-hosted only for model inference.
- T5500 was used to execute the backend recovery deploy.
- 9020 is now the active node for crossfire, marketing workloads, and isolated date-app support.
- T5500 no longer carries the temporary support runtime and is free for heavier media/video workloads.
- Legacy DAO/platform repos are design recovery sources only, not live implementation truth; approved recovery candidates are tracked in `C:\ANTIGRAVITY\briefings\DAO-RECOVERY-CANDIDATES.md`.

## Known Gaps

1. The stale `CLOUDFLARE_API_TOKEN` in `.env` remains documentation debt, but not a live deploy blocker.
2. Docker is not part of the current Sabretooth baseline.
3. `crossfire` on 9020 still relies on detached processes rather than a service manager.
