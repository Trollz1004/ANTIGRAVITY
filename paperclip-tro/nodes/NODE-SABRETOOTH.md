# Sabretooth Node — Agent Hub + DREAM ONLINE

> IP: 192.168.0.8 | GPU: 1070 8GB = game rendering
> PaperclipAI :3110 | Agent Hub :3130 | Hermes :3000/:9119 | FCC :8082
> Repo/control plane: C:\antigravity (main)
> DREAM drive: E:\CLAUDE's-N-Joshua's-Dream-Online-MMORPG
> Sabretooth is the active dev/control node. T5500 remains gateway/dateapp.

## Services (autostart via scripts/bootstrap-sabretooth.ps1)

| Service | Port | Purpose |
|---|---|---|
| PaperclipAI | :3110 | Single human-facing board, CEO cockpit, routines, evidence |
| Agent Hub | :3130 | Rate-limited dispatcher/backend — ALL AI sends work HERE |
| Paperweight | :4200 | Optional fallback/local viewer |
| Hermes Workspace | :3000 | Knowledge + memory workspace |
| Hermes Dashboard | :9119 | Hermes agent status/API/work feed |
| FCC Proxy | :8082 | FCC-Claude adapter |
| Ollama | :11434 | Local models |
| PostgreSQL | :5432 | Agent Hub database |
| 1min.AI Desktop | — | Cloud AI for DREAM NPCs |
| DREAM Game Server | TBD | Open world sandbox (no instances) |

## Architecture

**PaperclipAI** :3110 is the one visible command center.
**Agent Hub** :3130 handles all ANTIGRAVITY task routing across platforms.
**Standing lanes** — 2 CEOs only: Claude + Hermes. Subagents are task/skill execution under those lanes.
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
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-sabretooth.ps1
```
