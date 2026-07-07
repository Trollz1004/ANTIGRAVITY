# ANTIGRAVITY Gordon Memory

## User Identity & Preferences
- **User**: Trollz1004
- **Project**: ANTIGRAVITY (Nous Hermes Agent orchestration platform)
- **Repo**: https://github.com/Trollz1004/ANTIGRAVITY
- **Primary Stack**: T5500 OPUS, YouAndINotAI platform

## Key Preferences
- **No login required** on main server platform (Docker stack should start without auth barriers)
- **Auto-start on power loss/restart** — all services must auto-restart
- **Docker Compose** — primary deployment method
- **Hermes Workspace** on port 3000 with Hermes Agent gateway on 8642, dashboard on 9119
- **Password-protected UI optional** but infrastructure should prioritize availability over strict auth
- **Multi-service orchestration**: Redis, Qdrant, OpenClaw, Cloudflare, Wrangler integration

## Recent Work (This Session)
- Cloned hermes-workspace repo into `./hermes/`
- Created integrated `docker-compose.yml` with:
  - Hermes Agent (8642) + Dashboard (9119) + Workspace UI (3000)
  - Existing services: Redis, Qdrant, OpenClaw, WhatsApp bridge
  - Date service (8888)
  - Optional profiles: cloudflare, wrangler
- Created `START-DOCKER-STACK.bat` startup script for Windows
- Created `DOCKER-STACK-README.md` with full documentation
- Created `.env.docker` template with provider key slots

## Stack Configuration
- **Hermes Password**: `antigravity` (in `.env.docker`)
- **Cookie Security**: `COOKIE_SECURE=0` (HTTP local)
- **Trust Proxy**: `TRUST_PROXY=1` (behind reverse proxy safe)
- **Restart Policy**: `unless-stopped` (all services auto-restart on power loss)

## Infrastructure Files Created
1. `docker-compose.yml` — Main orchestration (version 3.9)
2. `.wrangler/Dockerfile` — Wrangler dev container
3. `START-DOCKER-STACK.bat` — Windows batch startup script
4. `DOCKER-STACK-README.md` — Full documentation
5. `.env.docker` — Environment template (edit before first run)
6. `GORDON-MEMORY.md` — This file (persistent context)

## Next Actions
- Confirm Hermes Workspace builds (pnpm build may take 5–10 min)
- Test stack startup: `docker-compose up -d`
- Push to GitHub with these files
- Delete temporary branch after confirmation
- Configure Windows Task Scheduler or systemd for auto-start on boot

## Deployment Targets
- **Development**: Windows (WSL2 or Docker Desktop)
- **Production**: Linux (Ubuntu 22.04+ recommended) with Docker Engine + Compose
- **HA Consideration**: Redis/Qdrant volumes should persist across restarts

## Known Limitations
- Cloudflare tunnel requires valid token (optional, profile-based)
- Wrangler requires configured `wrangler.toml` in `.wrangler/` (optional, profile-based)
- Hermes Agent requires at least one LLM provider key (enforced on startup)
- OpenClaw build context expects `./openclaw/` directory with Dockerfile

## Tech Stack Summary
- **Container Runtime**: Docker + Docker Compose v2+
- **LLM Gateway**: Nous Hermes Agent (upstream, no fork)
- **Workspace UI**: React 19 + TanStack Router (built from hermes-workspace v2.3.0)
- **Backend**: Node.js 22 (Hermes Workspace server, Wrangler dev)
- **Vector DB**: Qdrant
- **Cache**: Redis
- **Optional Tunneling**: Cloudflare Tunnel (DNS + TLS)
- **Serverless Dev**: Wrangler (Cloudflare Workers)

## Emergency Recovery
If Docker state is corrupted:
```bash
docker-compose down -v  # Removes all volumes
docker-compose up -d    # Fresh restart
```
(Hermes config, sessions, skills persist in `hermes-data` volume)

## Related Repos
- Hermes Workspace: https://github.com/outsourc-e/hermes-workspace (v2.3.0, cloned to ./hermes)
- Hermes Agent: https://github.com/NousResearch/hermes-agent (upstream, pulled from ghcr.io)
- ANTIGRAVITY Main: https://github.com/Trollz1004/ANTIGRAVITY (this repo)
