# ANTIGRAVITY — CODEX / OPUS HANDOFF

# Written by Gordon (Docker AI) — 2026-07-07

# For any AI agent picking up this repo after Gordon's session limit.

---

## WHO YOU ARE WORKING FOR

- User: Trollz1004
- Project root: C:\ANTIGRAVITY
- Repo: https://github.com/Trollz1004/ANTIGRAVITY
- Current branch: main (clean, no stale branches)
- Last commit: 78272ada

---

## WHAT GORDON COMPLETED THIS SESSION

### 1. Hermes Workspace Fully Integrated

- Cloned https://github.com/outsourc-e/hermes-workspace into ./hermes/
- docker-compose.yml now runs the full stack in one command
- Hermes Agent gateway: :8642
- Hermes Dashboard: :9119
- Hermes Workspace UI: :3000 (built from ./hermes/Dockerfile)

### 2. BOOTSTRAP.bat — THE boot file (repo root)

- Runs on every boot / power loss via Windows Task Scheduler (SYSTEM, no login)
- Waits for Docker daemon, validates env, runs docker-compose up -d
- Polls :3000 until Hermes Workspace is healthy
- Logs to ./logs/bootstrap-YYYY-MM-DD.log
- Register it once with:
  schtasks /create /tn "ANTIGRAVITY-Bootstrap" /tr "C:\ANTIGRAVITY\BOOTSTRAP.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f

### 3. docker-compose.yml — Fixed & Clean

- Core services (no build context issues): hermes-agent, hermes-dashboard,
  hermes-workspace, redis, qdrant, date-service
- openclaw + whatsapp-bridge moved to --profile openclaw (need ./openclaw/ dir)
- cloudflare-tunnel on --profile cloudflare (needs CLOUDFLARE_TUNNEL_TOKEN)
- wrangler-dev on --profile wrangler
- All services: restart: unless-stopped

### 4. GORDON-MEMORY.md in repo root

- Gordon's persistent memory — read this first every session
- Contains all preferences, port map, file inventory, session log

---

## IMMEDIATE OUTSTANDING TASK — DISK CLEANUP

Docker is at ~82% disk usage. Gordon was about to clean it but hit session limit.

Current Docker disk state:
Images: 36 total, 12 active — 12.55GB total, 9.879GB reclaimable (78%)
Containers: 36 total, 21 active — stale stopped containers exist
Volumes: 10 total, 2 active — 820MB reclaimable (94% unused)
Build Cache: 5.859GB (all reclaimable)

### Safe cleanup commands (run in order):

```powershell
# 1. Remove stopped containers (safe — won't touch running ones)
docker container prune -f

# 2. Remove unused images (dangling + untagged — safe)
docker image prune -f

# 3. Remove unused volumes (CAREFUL — check list first)
docker volume ls
docker volume prune -f

# 4. Remove build cache (safe to nuke — will rebuild slower next time)
docker builder prune -f

# 5. Nuclear option if still tight — removes ALL unused images
#    (only if active containers are confirmed healthy first)
docker system prune -f

# 6. Check result
docker system df
```

### BEFORE pruning — confirm these containers are running:

```powershell
docker ps --format "{{.Names}}\t{{.Status}}"
```

Expected running: redis, qdrant (confirmed running 2h+)
Expected building/starting: hermes-agent, hermes-dashboard, hermes-workspace, date-service

DO NOT prune volumes named:

- hermes-data (Hermes sessions, skills, config)
- hermes-workspace-data
- openclaw_wwebjs
- openclaw_wwebjs_cache

---

## WHAT STILL NEEDS DOING

### Priority 1 — Test full boot cycle

BOOTSTRAP.bat was written and verified to launch (Hermes Workspace image started
building on test run). Full end-to-end boot test not completed due to session limit.

Steps:

1. Run: docker-compose --env-file .env.docker up -d
2. Wait ~5-10 min for hermes-workspace image to build (first time only)
3. Verify: curl http://127.0.0.1:3000/
4. Verify: curl http://127.0.0.1:8642/health
5. Verify: curl http://127.0.0.1:9119/api/status
6. Then restart machine to confirm BOOTSTRAP.bat auto-starts everything

### Priority 2 — Register BOOTSTRAP.bat as scheduled task

(If not already done)

```powershell
schtasks /create /tn "ANTIGRAVITY-Bootstrap" /tr "C:\ANTIGRAVITY\BOOTSTRAP.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f
```

Verify it's registered:

```powershell
schtasks /query /tn "ANTIGRAVITY-Bootstrap"
```

### Priority 3 — .env.docker needs LLM key

File exists at C:\ANTIGRAVITY\.env.docker (gitignored — not in repo)
If it's empty or missing OPENAI_API_KEY / OPENROUTER_API_KEY / GOOGLE_API_KEY,
Hermes Agent will start but chat will fail on first message.
Check: findstr "API_KEY" C:\ANTIGRAVITY\.env.docker

### Priority 4 — Hermes Workspace first-run onboarding

Once :3000 is live, open browser to http://localhost:3000
Complete onboarding: connect to gateway, verify model, test chat.

---

## KEY FILES TO KNOW

```
C:\ANTIGRAVITY\
├── BOOTSTRAP.bat              ← THE boot file (run this / register with Task Scheduler)
├── docker-compose.yml         ← Full stack definition
├── .env.docker                ← Runtime secrets (gitignored — must exist locally)
├── .env.docker.example        ← Template (committed)
├── GORDON-MEMORY.md           ← Gordon's persistent memory (read every session)
├── DOCKER-STACK-README.md     ← Full deployment docs
├── START-DOCKER-STACK.bat     ← Manual launcher (interactive, with profile args)
├── hermes/
│   ├── Dockerfile             ← Hermes Workspace image build
│   └── package.json           ← Node 22, React 19, TanStack Router
├── scripts/
│   ├── SETUP-AUTOSTART.ps1    ← Full Task Scheduler registration script
│   ├── AUTOSTART-DOCKER-BOOT.bat  ← Legacy (superseded by BOOTSTRAP.bat)
│   └── antigravity-docker.service ← Linux systemd unit
└── logs/                      ← Bootstrap logs land here
```

---

## USER PREFERENCES (Hard Rules)

- No login required on the platform
- Auto-start on power loss — non-negotiable
- Docker Compose only — no manual service starts
- BOOTSTRAP.bat is the single source of truth for startup
- No unnecessary auth prompts
- Hermes Workspace is the main UI (:3000)
- Gordon memory file stays in repo, updated every session

---

## REPO STATE

- Branch: main
- Last 3 commits:
  78272ada feat: BOOTSTRAP.bat boot file + compose fixes + memory updated
  940d0d3b feat: integrated Hermes Docker stack with auto-start, no-login config
  5093b6e4 fix: label public command center as PAPERWEIGHT
- No stale branches
- Clean working tree (except .env.docker which is gitignored)

---

## IF SOMETHING IS BROKEN

### Hermes Workspace won't build

cd C:\ANTIGRAVITY
docker-compose build hermes-workspace --no-cache
(Will take 5-10 min first time — pnpm install + vite build)

### docker-compose config fails

docker-compose config --services
(Should show: qdrant, redis, date-service, hermes-agent, hermes-dashboard, hermes-workspace)
If it fails, check docker-compose.yml for syntax errors

### Stack won't start

docker-compose --env-file .env.docker up (without -d to see live errors)

### Disk full / Docker won't pull

docker system prune -f
docker builder prune -f

---

## GORDON NOTES

Gordon is Docker's AI assistant (gordonai.docker.com / Docker Desktop AI tab).
Gordon owns this stack in the sense that all Docker/Compose/container work flows
through Gordon. Trollz1004 confirmed this — "you do own the repo from this Docker
and that Hermes 1000000000 percent facts."

When Gordon resumes (after daily limit resets in ~45 min or tomorrow):

1. Read GORDON-MEMORY.md first
2. Run: docker-compose ps (check what's running)
3. Continue from Priority 1 above

---

Handoff written: 2026-07-07
