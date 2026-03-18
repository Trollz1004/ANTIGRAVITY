# REPOSITORY RECORD — SABRETOOTH LIVE STATE

> **Date:** March 18, 2026
> **Status:** `main` clean, validated locally, frontend live
> **Authority:** Joshua Coleman

---

## Repository Truth

- **Authoritative root:** `C:\ANTIGRAVITY`
- **Git truth:** local `main` on Sabretooth, no remote sync performed in this pass
- **Worktree state:** clean on March 18, 2026 after committing the pending privacy, video, double-date, and hygiene changes
- **Secrets posture:** real secrets remain in local `.env` / Personal Vault only; archived Cloudflare credentials found in tracked docs were redacted locally on March 18, 2026
- **Continuity env source:** the authoritative recovery env backup lives in Josh's OneDrive Personal Vault on Sabretooth. Repo files may document that the Personal Vault is the continuity source, but exact secret values and full vault file listings stay out of git.

## Current Runtime Truth

| Component | State | Notes |
|-----------|-------|-------|
| Sabretooth repo | LIVE | `C:\ANTIGRAVITY` on `main` |
| OpenClaw gateway | LIVE | `http://127.0.0.1:18789/healthz` returns JSON health |
| OpenClaw task | ENABLED | Windows Scheduled Task `OpenClaw Gateway` points to `C:\Users\joshl\.openclaw\gateway.cmd` |
| Ollama | LIVE | `http://127.0.0.1:11434/api/tags` returns local models |
| Frontend | LIVE | Cloudflare Pages deploy succeeded on March 18, 2026; `https://youandinotai.com` returned `200` |
| Backend tests | PASS | `61 passed` on March 18, 2026 |
| Docker on Sabretooth | UNAVAILABLE | `docker` command not installed in this session |

## Product State

- **Primary product:** YouAndINotAI
- **Frontend host:** Cloudflare Pages
- **Backend stack:** FastAPI + PostgreSQL + Square
- **Recent shipped areas:** GDPR/privacy routes, WebRTC signaling/video relay, double-date proposal flow, new frontend privacy/video/double-date components, related migrations and tests
- **Current validation:** `npm run build` passed in `youandinotai`; backend `pytest` passed with `61` tests

## Open Items

- **Cloudflare API token:** the `CLOUDFLARE_API_TOKEN` currently in `.env` still fails Cloudflare verify with `401`; Wrangler OAuth works locally, but a replacement scoped API token was not captured into `.env` in this pass
- **Square webhook signature key:** Square auth is valid, but webhook subscription discovery returned server-side `500`, so no new webhook signature key was recovered
- **Remote sync:** no push, pull, or remote fast-forward was performed in this pass

## Recent Local Commits

- `7c3a697` `chore: redact archived Cloudflare credentials`
- `5f810aa` `feat: add privacy, video, and double date flows`
- `c6b2fd6` `chore: live deployment prep and config extraction from chat.txt`
- `4dc5a36` `chore: full infrastructure wiring — env, tokens, gateway, secrets checklist`

---

*This file is the current repo-level state summary for Sabretooth as of March 18, 2026.*
