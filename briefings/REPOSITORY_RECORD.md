# REPOSITORY RECORD — SABRETOOTH LIVE STATE

> **Date:** March 19, 2026
> **Status:** `main` clean, `origin/main` updated, frontend and backend live
> **Authority:** Joshua Coleman

---

## Repository Truth

- **Authoritative root:** `C:\ANTIGRAVITY`
- **Git truth:** `main` on Sabretooth at `346facc`, pushed to `origin/main`
- **Worktree state:** clean after restoring the live API path, repairing the Cloud Run workflow, and revalidating the stack
- **Secrets posture:** secrets stay in local `.env` and the Sabretooth continuity vault only
- **Continuity vault root:** `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`
- **Continuity files:** `ENVwhen ai loses.env`, `UNIVERSAL-NODE.env`, `UNIVERSAL-NODE-MANIFEST.md`, `CODEX-MISSION-SAFEGUARD.md`

## Current Runtime Truth

| Component | State | Notes |
|-----------|-------|-------|
| Sabretooth repo | LIVE | `C:\ANTIGRAVITY` on `main` |
| Frontend | LIVE | `https://youandinotai.com/api/v1/health` returns healthy JSON |
| Backend | LIVE | Cloud Run service `dateapp-backend` in `us-east1` now serves the real FastAPI API |
| Backend revision | LIVE | Manual source deploy from T5500 restored production on March 19, 2026 |
| GitHub deploy workflow | PASS | `deploy-gcr.yml` fixed; workflow run `23308309685` succeeded |
| Backend tests | PASS | `67 passed` on March 19, 2026 |
| OpenClaw gateway | LIVE | `http://127.0.0.1:18789/healthz` |
| Ollama | LIVE | `http://127.0.0.1:11434/api/tags` |
| Continuity env backup | CURRENT | Vault backup covers every populated key from live `.env` |
| 9020 crossfire backend | LIVE | Python 3.12 installed; `http://localhost:8000/api/health` returns `{"status":"ok"}` |
| 9020 crossfire frontend | LIVE | Vite dev server responding on `http://localhost:5173` |

## Product State

- **Primary product:** YouAndINotAI
- **Frontend host:** Cloudflare Pages
- **Backend host:** Google Cloud Run
- **Backend stack:** FastAPI + PostgreSQL + Square
- **Live API contract restored:** Pages worker now proxies `/api/v1/*` directly to the Cloud Run backend without the stale adapter layer
- **Runtime config restored:** backend accepts the legacy `SECRET_KEY` env alias for JWT secret compatibility
- **Runtime deps restored:** missing scheduler/file runtime deps were added to `requirements.txt`

## Operational Notes

- **Cloudflare deploy auth:** Wrangler OAuth is the active deploy path; the stale `.env` API token is not the production auth mechanism
- **Cloud Run source deploy:** the repaired GitHub workflow now deploys from `youandinotai-api` source instead of the broken container path
- **T5500 role:** used for backend recovery and deploy execution when Sabretooth needed the live service restored
- **9020 node role:** crossfire and marketing workloads now run here so T5500 stays focused on the date app

## Current Open Items

1. **Vault continuity snapshots should stay in sync with any future real credential change.**
2. **The stale Cloudflare API token in `.env` is still informational debt, not an operational blocker.**
3. **If 9020 crossfire needs reboot persistence, convert the current detached processes into scheduled tasks or services.**

## Recent Pushed Commits

- `346facc` `fix: align cloud run workflow with source deploy`
- `0ac16cc` `fix: include scheduler runtime dependencies`
- `95fd3d5` `fix: restore cloud run api compatibility`

---

*This file is the repo-level state summary for Sabretooth as of March 19, 2026.*
