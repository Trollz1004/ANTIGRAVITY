# Active Context - 2026-03-23

## Current Focus

- **Production date app is restored:** `https://youandinotai.com/api/v1/health` returns healthy backend JSON and beta-access auth is live again.
- **`origin/main` is caught up:** Sabretooth `main` is pushed and clean.
- **Node lanes are isolated:** Claude Dispatch stays on Sabretooth `E:`, 9020 owns the `D:` sandbox lane, and T5500 owns the `E:\ANTIGRAVITY-CLAWBOTS` Manus lane.
- **Continuity vault is current:** the live continuity root is `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth`.
- **Current sandbox validation focus:** T5500 now has the new Manus dashboard scaffold installed, built, and locally serving on port `3000`.
- **Manus provider stack:** OpenAI is now connected alongside Anthropic, Gemini, Perplexity, and Grok on the Manus account lane.
- **March 23 public hardening is pushed:** `README.md`, `_deploy/onlinerecycle/*`, and `antigravity` source hardening are on `origin/main` commit `14aee75`, and 9020/T5500 repo mirrors were fast-forwarded cleanly.
- **Cloudflare secret path is current:** a no-expiry Cloudflare API token was rotated on 2026-03-23 into local Sabretooth `.env` and mirrored into GitHub repo secrets; claws should use env/secret-manager lookup only.

## Verified State

- **Repo root:** `C:\ANTIGRAVITY`
- **Branch:** `main`
- **HEAD:** see git for current commit
- **Worktree:** clean
- **Frontend validation:** `npm run build` passed
- **Backend validation:** targeted auth/lovebot suite `22 passed`
- **Live frontend/API:** `https://youandinotai.com/api/v1/health` returns healthy JSON
- **Cloud Run workflow:** latest run completed successfully on March 19, 2026
- **OpenClaw health:** `http://127.0.0.1:18789/healthz`
- **Ollama health:** `http://127.0.0.1:11434/api/tags`
- **9020 crossfire backend:** `http://localhost:8000/api/health` returns `{"status":"ok"}`
- **9020 crossfire frontend:** `http://localhost:5173` serves the Vite app shell
- **T5500 Manus dashboard validation:** install/check/build passed after importing the updated scaffold zip, and `node dist/index.js` served local HTTP `200`
- **Cloudflare deploy status:** repo changes are pushed, but live Pages redeploy is still blocked by Cloudflare-specific issues rather than repo drift

## Recently Finished

- Replaced the stale Cloudflare Pages worker adapter with a direct `/api/v1/*` proxy
- Restored backend JWT config compatibility via legacy `SECRET_KEY` alias support
- Added missing runtime dependencies required by the live backend
- Repaired GitHub Cloud Run deployment automation and verified a successful run
- Rebuilt and redeployed the frontend
- Synced the vault continuity env with the current live `.env`
- Disabled stale 9020 task relaunch points after populating the node sandbox lane
- Imported the updated Manus dashboard scaffold on T5500 and validated install/check/build/runtime
- Pushed the March 23 public-surface hardening pass and synced 9020/T5500 `C:\ANTIGRAVITY` worktrees to `14aee75`
- Confirmed the current manual Pages-trigger workflow is not enough because the Cloudflare direct deployment endpoint now expects a `manifest` body

## Current Risks / Open Items

1. **Continuity files now live in `Personal Vault-Sabretooth`, not the older `Personal Vault` path.**
2. **Sabretooth Wrangler OAuth may still be stale, but the active Cloudflare API token is now rotated in local `.env` and GitHub secrets; keep claws using env/secret-manager access only and not hardcoded token values.**
3. **Crossfire on 9020 is currently process-based; convert to scheduled startup if you want reboot persistence.**
4. **T5500 Manus dashboard still emits analytics placeholder warnings until real values are supplied.**
5. **Cloudflare GitHub App builds are also failing on the hardened commit, so live Pages recovery now depends on Cloudflare build-log review or a corrected Wrangler-based deploy flow.**

## Rules To Preserve

1. Treat Sabretooth as the authoritative live repo and orchestration node.
2. Keep secrets in local `.env` or the Sabretooth continuity vault only.
3. Keep ENIGMA and OMEGA fully separated.
4. Keep the continuity vault out of `.openclaw` paths, mounts, and runtime config.
