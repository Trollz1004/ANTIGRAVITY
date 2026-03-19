# Active Context - 2026-03-19

## Current Focus

- **Production date app is restored:** `https://youandinotai.com/api/v1/health` now returns healthy backend JSON again.
- **`origin/main` is caught up:** Sabretooth `main` at `346facc` is pushed and clean.
- **Cloud Run deploy path is repaired:** GitHub workflow `deploy-gcr.yml` now works, and workflow run `23308309685` succeeded.
- **Continuity vault is current:** the live continuity root is `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`.
- **9020 is now handling crossfire:** backend and frontend are running there so T5500 remains focused on YouAndINotAI/backend work.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **HEAD:** `346facc`
- **Worktree:** clean
- **Frontend validation:** `npm run build` passed
- **Backend validation:** `67 passed`
- **Live frontend/API:** `https://youandinotai.com/api/v1/health` returns healthy JSON
- **Cloud Run workflow:** latest run completed successfully on March 19, 2026
- **OpenClaw health:** `http://127.0.0.1:18789/healthz`
- **Ollama health:** `http://127.0.0.1:11434/api/tags`
- **9020 crossfire backend:** `http://localhost:8000/api/health` returns `{"status":"ok"}`
- **9020 crossfire frontend:** `http://localhost:5173` serves the Vite app shell

## Recently Finished

- Replaced the stale Cloudflare Pages worker adapter with a direct `/api/v1/*` proxy
- Restored backend JWT config compatibility via legacy `SECRET_KEY` alias support
- Added missing runtime dependencies required by the live backend
- Repaired GitHub Cloud Run deployment automation and verified a successful run
- Rebuilt and redeployed the frontend
- Synced the vault continuity env with the current live `.env`

## Current Risks / Open Items

1. **Continuity files now live in `Personal Vault-Sabretooth`, not the older `Personal Vault` path.**
2. **The `.env` Cloudflare token remains stale, but Wrangler OAuth is the real operational auth path.**
3. **Crossfire on 9020 is currently process-based; convert to scheduled startup if you want reboot persistence.**

## Rules To Preserve

1. Treat Sabretooth as the authoritative live repo and orchestration node.
2. Keep secrets in local `.env` or the Sabretooth continuity vault only.
3. Keep ENIGMA and OMEGA fully separated.
4. Keep the continuity vault out of `.openclaw` paths, mounts, and runtime config.
