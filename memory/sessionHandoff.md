# Session Handoff - 2026-03-20

## Summary

Sabretooth `main` is clean and pushed, the live YouAndINotAI stack is repaired end to end, crossfire is up on 9020, the isolated date-app SupportClaw is on 9020 so T5500 is free again, and the active OpenClaw configs on Sabretooth, 9020, and T5500 are now self-hosted only for model inference.

## Accomplishments

- Restored production API routing by replacing the stale worker adapter with a direct `/api/v1/*` proxy
- Restored backend JWT env compatibility by accepting legacy `SECRET_KEY`
- Added missing runtime dependencies required for live backend startup
- Rebuilt the frontend and redeployed Pages
- Deployed the backend from T5500 to Cloud Run and confirmed healthy live responses
- Fixed `.github/workflows/deploy-gcr.yml` and verified successful workflow run `23308309685`
- Refreshed continuity env backups under `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`
- Added a vault safeguard note keeping continuity files out of OpenClaw runtime paths
- Installed Python 3.12 on 9020
- Installed crossfire backend/frontend dependencies on 9020
- Brought up crossfire backend on `:8000` and frontend on `:5173` on 9020
- Added `/api/health` alias for crossfire backend compatibility
- Reset the drifted `C:\ANTIGRAVITY` repos on both 9020 and T5500 back to `origin/main` after archiving their prior histories
- Moved isolated SupportClaw off T5500 and onto 9020 at `C:\SUPPORTCLAW-9020`
- Repointed Sabretooth support runtime to `http://192.168.0.5:18895`
- Stopped the temporary T5500 support container so that node can stay available for heavier media/video workloads
- Cleaned repo clutter by moving local news/runtime debris out of `C:\ANTIGRAVITY` and redirecting the news bot runtime to `C:\Users\joshl\Documents\ANTIGRAVITY-RUNTIME`
- Switched Sabretooth OpenClaw to Ollama-only model routing with `nomic-embed-text` memory search
- Scrubbed 9020 and T5500 OpenClaw configs down to self-hosted/local-only model baselines

## Local / Live Validation

- `npm run build` in `C:\ANTIGRAVITY\youandinotai` — PASS
- `uv run --python 3.12 --with-requirements requirements.txt pytest -q` in `C:\ANTIGRAVITY\youandinotai-api` — `67 passed`
- `https://youandinotai.com/api/v1/health` — healthy JSON
- `gh run list --workflow deploy-gcr.yml --limit 1` — latest run success
- `http://localhost:8000/api/health` on 9020 — `{"status":"ok"}`
- `http://localhost:5173` on 9020 — Vite HTML app shell
- `http://192.168.0.5:18895/health` from Sabretooth — isolated 9020 SupportClaw healthy
- `http://192.168.0.15:18895/health` from Sabretooth — offline after T5500 support shutdown
- `http://127.0.0.1:18789/healthz` on Sabretooth — live after Ollama-only config cutover

## Important Current Truth

- `origin/main` now includes the March 19 production repair commits
- The live continuity vault path on Sabretooth is `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`
- `ENVwhen ai loses.env` and `UNIVERSAL-NODE.env` cover every populated live `.env` key
- OpenClaw and Ollama remain healthy on Sabretooth
- Sabretooth OpenClaw now uses local `qwen2.5:7b` primary, local `qwen2.5:3b` fallback, and `nomic-embed-text` memory search with no cloud model providers
- 9020 now carries crossfire, marketing, and the isolated support gateway
- T5500 no longer carries support and is available for heavier media/build workloads
- The unlocked `C:\Users\joshl\OneDrive\Personal Vault` path still does not resolve as a real folder on this machine
- Old DAO/platform repos and briefs remain recovery-library inputs only; live reuse must be ported intentionally into `C:\ANTIGRAVITY` and is now guided by `C:\ANTIGRAVITY\briefings\DAO-RECOVERY-CANDIDATES.md`
- The approved sandbox repo for all future unapproved or experimental work is `https://github.com/Trollz1004/Sandbox-REPO-NEW-CODE-NOTHING-NEW-GOES-ON-ANTIGRAVITY.git`

## Pending Items

1. Keep vault continuity files synchronized after any future secret or deployment change.
2. Do not route the continuity vault through OpenClaw config, mounts, or runtime access.
3. Convert the 9020 crossfire runtime into scheduled startup if reboot persistence is required.
