# GORDON-MEMORY.md
# Persistent context for Gordon (Docker AI assistant) across all sessions.
# Updated: 2026-07-07
# Repo: https://github.com/Trollz1004/ANTIGRAVITY

---

## User Identity
- **Handle**: Trollz1004
- **Project**: ANTIGRAVITY — T5500 OPUS, YouAndINotAI platform, Nous Hermes orchestration
- **OS**: Windows (C:\ANTIGRAVITY project root)
- **Repo**: https://github.com/Trollz1004/ANTIGRAVITY (we own this)
- **Hermes Workspace Repo**: https://github.com/outsourc-e/hermes-workspace (cloned to ./hermes)
- **Hermes Agent**: nousresearch/hermes-agent:latest (pulled from GHCR)

---

## Hard Preferences (Never Violate)
- **No login required** — main server platform, local deployment, no auth barriers
- **Auto-start on power loss / restart** — every service uses `restart: unless-stopped`; Task Scheduler on Windows, systemd on Linux
- **Docker Compose** — primary and only deployment method
- **Single bootstrap file** — `BOOTSTRAP.bat` in repo root is the one file to rule them all
- **No unnecessary prompts** — scripts run silently, log to `./logs/`
- **Hermes on port 3000** (Workspace UI), **8642** (Agent Gateway), **9119** (Dashboard)
- **OpenClaw/WhatsApp bridge** uses `--profile openclaw` (requires `./openclaw/` repo + `.env`)
- **Cloudflare tunnel** uses `--profile cloudflare` (requires `CLOUDFLARE_TUNNEL_TOKEN`)

---

## Infrastructure Files (Source of Truth)

| File | Purpose |
|------|---------|
| `BOOTSTRAP.bat` | **THE** boot file — Docker wait, env check, `docker-compose up -d`, health poll |
| `docker-compose.yml` | Full stack definition (version 3.9) |
| `.env.docker.example` | Template — copy to `.env.docker`, add LLM key |
| `START-DOCKER-STACK.bat` | Manual interactive launcher with profile args |
| `scripts/AUTOSTART-DOCKER-BOOT.bat` | Legacy boot entry (superseded by BOOTSTRAP.bat) |
| `scripts/SETUP-AUTOSTART.ps1` | Registers BOOTSTRAP.bat as Task Scheduler SYSTEM task |
| `scripts/antigravity-docker.service` | Linux systemd unit |
| `hermes/Dockerfile` | Hermes Workspace build (multi-stage, node:22-slim) |
| `hermes/package.json` | Workspace deps (v2.3.0) |
| `GORDON-MEMORY.md` | This file — pushed to repo on every session |
| `DOCKER-STACK-README.md` | Full deployment guide |

---

## Docker Compose Services & Profiles

### Core (always start)
| Service | Port | Image |
|---------|------|-------|
| hermes-agent | 127.0.0.1:8642 | nousresearch/hermes-agent:latest |
| hermes-dashboard | 127.0.0.1:9119 | nousresearch/hermes-agent:latest |
| hermes-workspace | 127.0.0.1:3000 | built from ./hermes/Dockerfile |
| redis | 6379 | redis:alpine |
| qdrant | 6333/6334 | qdrant/qdrant |
| date-service | 127.0.0.1:8888 | node:22-alpine (inline server) |

### Optional profiles
| Profile flag | Services |
|-------------|---------|
| `--profile openclaw` | openclaw (:3200), whatsapp-bridge (requires `./openclaw/`) |
| `--profile cloudflare` | cloudflare-tunnel (requires `CLOUDFLARE_TUNNEL_TOKEN`) |
| `--profile wrangler` | wrangler-dev (:8787) |

---

## How to Register BOOTSTRAP.bat (One-Time, Admin)

**Windows — one-liner (PowerShell as admin):**
```powershell
schtasks /create /tn "ANTIGRAVITY-Bootstrap" /tr "C:\ANTIGRAVITY\BOOTSTRAP.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f
```

**Or full setup script:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\scripts\SETUP-AUTOSTART.ps1
```

**Linux:**
```bash
sudo cp scripts/antigravity-docker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable antigravity-docker
sudo systemctl start antigravity-docker
```

---

## First-Time Setup (After Clone)
```bash
# 1. Copy env template
copy .env.docker.example .env.docker

# 2. Edit .env.docker — add at least one LLM key:
#    OPENAI_API_KEY=sk-...
#    OR OPENROUTER_API_KEY=sk-or-v1-...
#    OR GOOGLE_API_KEY=AIza...

# 3. Register bootstrap task (Windows, admin PowerShell)
schtasks /create /tn "ANTIGRAVITY-Bootstrap" /tr "C:\ANTIGRAVITY\BOOTSTRAP.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f

# 4. Run now to test
BOOTSTRAP.bat

# 5. Verify
#    http://localhost:3000  — Hermes Workspace UI
#    http://localhost:8642/health  — Hermes Agent
#    http://localhost:9119/api/status  — Hermes Dashboard
```

---

## Known Fixes Applied This Session
- `openclaw` and `whatsapp-bridge` moved to `--profile openclaw` (they need `./openclaw/` build context + `.env` which may not exist on fresh clone)
- `CLOUDFLARE_TUNNEL_TOKEN` uses `:-` default fallback so compose config doesn't fail when unset
- `version: '3.9'` attr generates a harmless warning in Compose v2 — acceptable, will not break anything
- BOOTSTRAP.bat written via PowerShell `WriteAllText` with ASCII encoding to avoid BOM/encoding issues on Windows

---

## Emergency Recovery
```bash
# Full reset (keeps volumes)
docker-compose down --remove-orphans
BOOTSTRAP.bat

# Nuclear reset (wipes volumes — loses Hermes sessions/config)
docker-compose down -v
BOOTSTRAP.bat
```

---

## Volumes (Persistent Data)
| Volume | Contains |
|--------|---------|
| `hermes-data` | Hermes Agent config, sessions, skills, memory, credentials |
| `hermes-workspace-data` | Workspace UI cache |
| `openclaw_wwebjs` | WhatsApp auth state |
| `openclaw_wwebjs_cache` | WhatsApp media cache |
| `./qdrant-data` | Vector DB storage (bind mount) |

---

## Session Log

### 2026-07-07 — Session 2
- Built `BOOTSTRAP.bat` — single boot file, handles Docker wait, env check, compose up, health poll
- Fixed `docker-compose.yml`: openclaw/whatsapp moved to `--profile openclaw`, CLOUDFLARE_TUNNEL_TOKEN default added
- Confirmed BOOTSTRAP runs clean (Docker ready, compose up triggers Hermes Workspace build)
- Updated GORDON-MEMORY.md with full state
- Pushed to main, branch deleted

### 2026-07-07 — Session 1
- Cloned hermes-workspace v2.3.0 into `./hermes/`
- Created unified docker-compose.yml with Hermes Agent + Dashboard + Workspace + Redis + Qdrant
- Created START-DOCKER-STACK.bat, SETUP-AUTOSTART.ps1, antigravity-docker.service
- Merged feat/hermes-docker-integration → main, deleted branch
