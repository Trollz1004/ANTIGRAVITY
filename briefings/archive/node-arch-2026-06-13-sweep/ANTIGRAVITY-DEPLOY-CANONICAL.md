# ANTIGRAVITY_DEPLOY = the dating app (cross-node truth)

> **Authoritative. Pulled by every node. If you arrive in a session and see only `apps/youandinotai-frontend/` + `backend/fastapi-app/`, you are missing half the picture. Read this first.**

## The receipts

`C:\Antigravity\ANTIGRAVITY_DEPLOY\` is **not an orphan submodule**. It is the deployed full-stack dating-app product, sitting at the repo root as an embedded git repo. Remote: `Trollz1004/ANTIGRAVITY` (same origin). No `.gitmodules` entry yet — that is a registration cleanup, not a signal to delete.

**2026-03-18 launch status** (`ANTIGRAVITY_DEPLOY/LAUNCH-STATUS.md`) — **"Ready for Marketing: YES"**:

- Frontend (CF Pages): ✅ `youandinotai.com` → 200, title **"YouAndiNotAi | Verified Human Dating"**
- Backend (pytest): ✅ 63 passed, 0 failed
- Square Payments: ✅ Bot-Shield + Founding Member checkout 200
- Square Webhooks: ✅ wired with safe fallback
- OpenClaw Gateway: ✅ live on `127.0.0.1:18789`
- Ollama (qwen2.5:7b): ✅
- Cloudflare deploy: ✅ wrangler OAuth verified, Pages deploy succeeded
- .env complete: ✅
- Git: clean

## Production stack

`ANTIGRAVITY_DEPLOY/youandinotai-api/docker-compose.prod.yml` defines 5 services:

| Service | Image | Container | Purpose |
|---|---|---|---|
| `app` | built local | `uandinotai-app-prod` | FastAPI :8000, Square + Gemini + Postgres + Redis |
| `postgres` | `postgres:16-alpine` | `uandinotai-postgres-prod` | DB `uandinotai_dating` |
| `redis` | `redis:7-alpine` | `uandinotai-redis-prod` | Password-protected, AOF, LRU |
| `nginx` | `nginx:alpine` | `uandinotai-nginx-prod` | **SSL via Let's Encrypt** on :80+:443 |
| `backup` | `postgres:16-alpine` | `uandinotai-backup` | Daily `pg_dump`, 7-day retention |

T5500 portproxy bindings already in place for 5432/6333-6334/6379/3200. Docker engine is currently stopped — bring it up before `docker compose up -d`.

## Two architectures in conflict — known drift

| Arch | Where | Last canonical |
|---|---|---|
| **A. Self-hosted Docker on T5500** | `ANTIGRAVITY_DEPLOY/youandinotai-api/docker-compose.prod.yml` | 2026-03-18 (worked, funded) |
| **B. Cloudflare Pages + GCR Cloud Run** | `apps/youandinotai-frontend/` + `backend/fastapi-app/` + `CLAUDE.md` doctrine | In progress, not fully wired |

The apex `youandinotai.com` once served Arch A. It currently serves a static one-page landing ("A social platform for showing up", Founding Member CTA `square.link/u/cxwjcn0s`) — neither full Arch A nor full Arch B. The funnel still earns potential revenue; the product surface is gone.

## Do not

- Treat `ANTIGRAVITY_DEPLOY/` as orphan / propose `git rm --cached`.
- Propose rebuilding the dating app. The code exists; the deploy is defined; the gap is "which arch is canonical now" + DNS wiring — **Josh's decision**, not a Claude code task.
- Assume `youandinotai.com` returning HTTP 200 = "verified." Verify by *title* and *known CTA target* against this file.

## Recovery path (only if Josh greenlights — do not execute unprompted)

1. Start Docker Desktop Linux engine on T5500.
2. `cd C:\Antigravity\ANTIGRAVITY_DEPLOY\youandinotai-api && docker compose -f docker-compose.prod.yml --env-file ../.env up -d`
3. Verify `curl http://localhost:8000/api/v1/health`.
4. Either Cloudflare-proxy `youandinotai.com` → T5500 nginx, OR build the React frontend and push to the existing CF Pages project.
5. Verify "Verified Human Dating" title returns at apex.

#UntilNoKidInNeed
