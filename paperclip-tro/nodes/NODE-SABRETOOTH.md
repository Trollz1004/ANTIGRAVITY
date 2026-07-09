# Sabretooth Node — Dev Workstation + Mission Control

> IP: 192.168.0.8 | GPU: 1070 8GB = game rendering
> Mission Control :3110 | optional/manual workbenches only
> Repo/control plane: C:\antigravity (main)
> DREAM drive: E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG
> Sabretooth is the active dev/control workstation. T5500 remains gateway/dateapp/proxy.

## Safe Autostart

| Service | Port | Purpose |
|---|---|---|
| Mission Control | :3110 | Single human-facing board, routines, issues, tools, evidence |

Do not autostart Cloudflared, watchdogs, sentries, Hermes workspace/dashboard
loops, FCC/MCP proxies, browser controllers, Ollama, PostgreSQL, or other
always-on repair jobs on Sabretooth. They interrupt the dev workstation and
belong on T5500 or an isolated worker node when needed.

Optional/manual workbenches may be opened when Joshua asks:

| Workbench | Port | Boundary |
|---|---|---|
| Third-party Paperclip | :3111 preferred | Standby tool only, not authority |
| Hermes Dashboard | :9119 | Manual only on Sabretooth |
| Hermes Workspace | movable | Manual only; do not assume :3000 |
| FCC Server/Admin | :8082 | Manual only; `/admin` for config |
| OpenClaw / ClawX / NemoClaw | app-specific | Preferred operator lane when installed/approved |
| Ollama/OpenCode | app-specific | Worker lane, not doctrine authority |

## Architecture

**Mission Control** :3110 is the one visible command center.
**Agent Hub** :3130 handles all ANTIGRAVITY task routing across platforms.
Optional workbenches can sit idle, but they report back to Mission Control and
must not create hidden backlogs or separate command centers.
**GPU 1070 8GB** reserved for game rendering — NOT AI inference.

### DREAM AI Roles

- **Claude Official** (Max subscription) = Sup@ — the user's floating electrical sphere guide. Uses official Claude Code for updated use cases over time. No TOS violations.
- **1min.ai** (desktop app) = NPC AI — cloud inference for real-time NPC behavior, world events, dialogue.

## E:\ Layout

```
E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG\
├── game\         — game assets/server/logs as the build matures
├── memory\       — DREAM memory/glossary/context
├── ops\          — runbooks, legacy stubs, node handoff
├── backups\      — drive-local backups when present
├── TASKS.md      — phase task list
└── CLAUDE.md     — compact working memory for the DREAM drive
```

C:\ has the ANTIGRAVITY repo (adapters, skills, Agent Hub code).
E:\ has DREAM game data, docs, saves, backups, and local memory.

## Bootstrap

```powershell
cd C:\antigravity
git pull origin main
powershell -ExecutionPolicy Bypass -File scripts\start-mission-control.ps1
```
