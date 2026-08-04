# Paperclip Deployment — F: Drive (WSL Ubuntu)

## Quick Start

```bash
# On Windows (PowerShell)
wsl -d Ubuntu bash

# In WSL Ubuntu
cd /mnt/f/ANTIGRAVITY

# Copy templates to WSL home
cp scripts/paperclip-startup.sh ~/.paperclip/
cp scripts/paperclip_server.py ~/.paperclip/

# Run deployment
paperclipai onboard
```

## What Happens

1. **Paperclip starts** on http://localhost:3120
2. **Verifies health:**
   - F:\ANTIGRAVITY repo accessible (/mnt/f/ANTIGRAVITY)
   - OmniRoute :20128 (LAN 192.168.0.15) healthy
   - Pieces MCP :39300 responding
   - 228 skills available in .agents/skills/

3. **Registers harnesses:**
   - OpenCode (JSON config)
   - Hermes (Python CLI)
   - FCC-Claude (CLI wrapper)

4. **Ready for tasks** via API

## API Endpoints (:3120)

```bash
# Submit task
curl -X POST http://localhost:3120/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"description": "Deploy graphify endpoint", "harness": "opencode"}'

# Get task status
curl http://localhost:3120/api/tasks/{task_id}

# View harness routing
curl http://localhost:3120/api/harness/routing

# List available skills
curl http://localhost:3120/api/skills/available

# Check Mission Control
curl http://localhost:3120/api/mission-control/status
```

## Next Steps

1. **Josh creates company/project** in Paperclip UI
2. **Josh signals ready** (company + project IDs created)
3. **Copilot CLI takes over** orchestration
   - Submits tasks to Paperclip :3120
   - Routes through OpenCode → OmniRoute → repo
   - Posts results to GitHub project

## Architecture

```
Paperclip :3120 (WSL F:)
  ├─ OpenCode harness → OmniRoute :20128 (LAN 192.168.0.15)
  ├─ Hermes CLI → OmniRoute :20128
  ├─ FCC-Claude → OmniRoute :20128
  └─ Pieces MCP :39300 (memory/state)

Mission Control :3151 (T5500 Windows)
  └─ Managed by Paperclip via /api/mission-control/start

DateApp :3200/:8000 (T5500)
  └─ Revenue backbone (youandinotai.com subscriptions)

All route through OmniRoute :20128 (single gateway)
```

## Key Files

- `scripts/paperclip-startup.sh` — Health checks + startup
- `scripts/paperclip_server.py` — Task API server
- `.opencode/opencode.json` — OpenCode harness config
- `.hermes/config.yaml` — Hermes routing config
- `.fcc/.env.example` → copy to `~/.fcc/.env` with real token
- `.agents/skills/` — 228 preloadable agent skills

## Troubleshooting

If Paperclip fails to start:

```bash
# Check OmniRoute (primary blocker)
curl http://192.168.0.15:20128/api/v1/vscode/health

# Check Pieces MCP
curl http://localhost:39300/model_context_protocol/2025-03-26/mcp

# Check repo accessibility
ls -la /mnt/f/ANTIGRAVITY/.git

# View Paperclip logs
python ~/.paperclip/paperclip_server.py 2>&1 | tail -20
```

---

**Status:** Ready for `paperclipai onboard`
**Date:** 2026-08-04
**Copilot waits for:** Company + project creation → then takes over task orchestration
