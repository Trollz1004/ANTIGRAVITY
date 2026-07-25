# ANTIGRAVITY BOOTSTRAP — Claude CLI Setup Guide

> Read this file first in any new Claude Code session on any machine.
> It contains every command needed to restore, deploy, and connect the full stack.

---

## 1. Repo

**Single repo. 1-folder. 1-node policy.**

```powershell
# Sabretooth (primary dev machine)
cd C:\ANTIGRAVITY
git fetch origin
git checkout claude/consolidate-repos-single-structure-e6D8D
git pull origin claude/consolidate-repos-single-structure-e6D8D
```

**Branch:** `claude/consolidate-repos-single-structure-e6D8D`  
**Main branch target:** merge when Josh confirms all stray repos archived.

---

## 2. Nodes

| Node | IP | Role |
|------|----|------|
| Sabretooth | 192.168.0.8 | Primary dev, Claude Code, pnpm workspaces |
| T5500 | 192.168.0.15 | Always-on Docker host: Redis, Qdrant, Postgres, brain-mcp, openclaw-api |
| Krakken | `I:\` (USB, plugged into Sabretooth) | Offline encrypted backup drive |

---

## 3. Environment Setup

### 3a. Copy env template
```powershell
cd C:\ANTIGRAVITY
copy .env.example .env
# Fill in real values — see briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env
# or check I:\ANTIGRAVITY_BACKUPS\env_vault\MASTER-UNIVERSAL-ENV-TROLLZ1004.env
```

### 3b. Key env vars (minimum to get running)
```
ANTHROPIC_API_KEY=         # Claude
GEMINI_API_KEY=            # Gemini
SQUARE_ACCESS_TOKEN=       # Payments
CLOUDFLARE_API_TOKEN=      # DNS / Tunnels
JWT_SECRET=                # API auth (32+ chars)
DATABASE_URL=              # PostgreSQL on T5500
REDIS_HOST=192.168.0.15    # Redis on T5500
OLLAMA_HOST=192.168.0.8:11434
```

### 3c. brain-mcp token (for remote MCP access)
```powershell
# Generate hash from your secret:
cd C:\ANTIGRAVITY\brain-mcp
node dist/hash-token.js <your-secret>
# Paste the sha256:... output into brain-mcp/.env as BRAIN_TOKEN_HASH

# On any machine that connects remotely:
$env:BRAIN_MCP_TOKEN = "<your-plain-secret>"
```

---

## 4. Install & Build (Sabretooth)

```powershell
cd C:\ANTIGRAVITY
corepack enable
pnpm install
pnpm build
```

---

## 5. Krakken Drive Backup

Krakken = portable USB Xbox SSD, Windows label **Krakken**, drive letter **I:\**

```powershell
# Run from Sabretooth (PowerShell 7 as admin)
cd C:\ANTIGRAVITY
.\memory\KRAKKEN-SYNC.ps1
```

Backs up to:
- `I:\ANTIGRAVITY_BACKUPS\memory_vault\` — all agent memory folders
- `I:\ANTIGRAVITY_BACKUPS\env_vault\` — .env.example, CLAUDE.md, AGENTS.md, BOOTSTRAP.md, MASTER-UNIVERSAL-ENV

Run after any `.env`, `CLAUDE.md`, or memory file change.

---

## 6. brain-mcp — 24/7 MCP Server on T5500

brain-mcp is already coded for HTTP transport. T5500 runs it as a Docker container exposed via Cloudflare tunnel at `https://mcp.youandinotai.com/mcp`.

### Deploy (from T5500 or via SSH)
```bash
ssh josh@192.168.0.15
cd /home/josh/ANTIGRAVITY
bash tools/deploy-brain-mcp-t5500.sh
```

### Cloudflare tunnel (one-time setup)
1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com) → Access → Tunnels
2. Create tunnel: `brain-mcp`
3. Public hostname: `mcp.youandinotai.com` → `http://brain-mcp:3099`
4. Copy tunnel token → paste into `/home/josh/ANTIGRAVITY/brain-mcp/.env` as `CLOUDFLARE_TUNNEL_TOKEN`
5. Re-run deploy script

### Connect from Claude Code (any machine)
`.mcp.json` already has the `brain-mcp-remote` entry. Just set:
```bash
export BRAIN_MCP_TOKEN=<your-plain-secret>
```
Then open Claude Code — it connects automatically.

---

## 7. Services Running on T5500 (192.168.0.15)

| Service | Port | Status |
|---------|------|--------|
| Redis | 6379 | ✅ Running |
| Qdrant | 6333-6334 | ✅ Running |
| PostgreSQL | 5432 | ✅ Running |
| openclaw-api | 3200 | ✅ Running |
| brain-mcp | 3099 | Deploy via step 6 |

**GCR (Google Cloud Run) backend** — also on T5500. Needs `gcloud` auth:
```bash
ssh josh@192.168.0.15
gcloud auth login
gcloud config set project ai-collab4kids
```

---

## 8. Known Open Issues

| Issue | Fix |
|-------|-----|
| `openclaw-gw.youandinotai.com` → Cloudflare 1033 | Cloudflare tunnel for openclaw-gw is down — recreate tunnel in Zero Trust |
| Backend safety/moderation routes → 404 on prod | Deploy GCR after gcloud auth on T5500 |
| Privacy backend unhealthy | Investigate docker logs on T5500 |
| Phone dispatch intermittent | Likely related to openclaw-gw tunnel being down |

---

## 9. Repos to Archive (GitHub UI — Settings → Danger Zone)

Do these manually at https://github.com/Trollz1004:

| Repo | When |
|------|------|
| `youandinotai-com` | NOW (only a README) |
| `antigravity-dashboard` | After confirming dashboard code is in ANTIGRAVITY |
| `command-center` | After merge |
| `OpenclawDash` | After merge |
| `sandbox-repo-new-code-nothing-new-goes-on-antigravity` | After unique code migrated |

---

## 10. Monorepo Structure (target state)

```
C:\ANTIGRAVITY\
  apps/
    web/          ← youandinotai.com frontend
    dashboard/    ← admin dashboard (from antigravity-dashboard + command-center)
    openclaw/     ← OpenclawDash
  packages/
    ui/           ← shared components
    types/        ← shared TypeScript types
  services/
    api/          ← FastAPI backend (youandinotai-api)
    brain-mcp/    ← MCP server
    mcp-server/   ← memory/vector MCP
  contracts/
    src/          ← Solidity (Router100, DatingRevenueRouter, Gospelpayment)
  memory/         ← agent memory files, KRAKKEN-SYNC.ps1
  tools/          ← deploy scripts
```

---

## Quick Reference — Most Common Commands

```powershell
# Sync to Krakken
.\memory\KRAKKEN-SYNC.ps1

# Start local dev
pnpm dev:web
pnpm dev:dashboard

# Build everything
pnpm build

# Deploy brain-mcp to T5500
bash tools/deploy-brain-mcp-t5500.sh

# Check T5500 services
ssh josh@192.168.0.15 "docker ps"
```

---

*Last updated by Claude Code — branch `claude/consolidate-repos-single-structure-e6D8D`*
