# PROJECT STATE — LIVE BASELINE

**Last Updated:** 2026-03-18

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
| Worktree | Clean on March 18, 2026 |
| Frontend | Cloudflare Pages |
| Backend | FastAPI + PostgreSQL |
| Payments | Square |
| OpenClaw | Local Sabretooth gateway on `127.0.0.1:18789` |
| Ollama | Local on `127.0.0.1:11434` |

## Product Truth

- **YouAndINotAI** is the primary active product in this repo.
- **Cloudflare Pages** frontend deploy succeeded on March 18, 2026.
- **Backend test suite** passed with `61` tests on March 18, 2026.
- **Privacy / video / double-date** flows are present in both backend and frontend code.

## Operational Truth

- Sabretooth is the authoritative live node and current command post.
- The OpenClaw scheduled task calls `C:\Users\joshl\.openclaw\gateway.cmd`.
- Personal Vault remains the continuity backup location for `.env`-class secrets and memory snapshots.
- `chat.txt` currently lives at `C:\ANTIGRAVITY\chat.txt` and is intentionally ignored by git.

## Known Gaps

1. `CLOUDFLARE_API_TOKEN` in `.env` still fails verify and needs a real replacement token.
2. Square webhook signature recovery is still incomplete.
3. Docker is not available in the current Sabretooth shell.
