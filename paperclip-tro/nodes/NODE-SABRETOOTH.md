# Sabretooth Node — Agent Hub + DREAM ONLINE

> IP: 192.168.0.8 | GPU: 1070 8GB = game rendering
> Agent Hub :3130 | Paperclip :3110 (DREAM) | All services run HERE
> Repo: C:\antigravity (main) | DREAM files: D:\dream-online\
> This is the ONLY active node. Everything runs here.

## Services (autostart via scripts/bootstrap-sabretooth.ps1)

| Service | Port | Purpose |
|---|---|---|
| Agent Hub | :3130 | Single gateway — ALL AI sends work HERE |
| Hermes Router | :11435 | Agent routing + cloud relay |
| FCC Proxy | :8082 | FCC-Claude adapter |
| Ollama | :11434 | Local models |
| PostgreSQL | :5432 | Agent Hub database |
| Paperclip | :3110 | DREAM game orchestration (webhooks, triggers, events) |
| 1min.AI Desktop | — | Cloud AI for DREAM NPCs |
| Hermes Workspace | :9119 | Knowledge + Memory UI (all agents) |
| DREAM Game Server | TBD | Open world sandbox (no instances) |

## Architecture

**Agent Hub** handles all ANTIGRAVITY task routing across 20 platforms.
**Paperclip** stays for DREAM — webhooks, triggers, game events need it.
**GPU 1070 8GB** reserved for game rendering — NOT AI inference.

### DREAM AI Roles

- **Claude Official** (Max subscription) = Sup@ — the user's floating electrical sphere guide. Uses official Claude Code for updated use cases over time. No TOS violations.
- **1min.ai** (desktop app) = NPC AI — cloud inference for real-time NPC behavior, world events, dialogue.

## DREAM File Layout (D:\)

```
D:\dream-online\
├── assets\       — game assets (models, textures, audio, maps)
├── server\       — game server code
├── config\       — game configuration
├── saves\        — world state / player data
└── logs\         — game server logs
```

C:\ has the ANTIGRAVITY repo (adapters, skills, Agent Hub code).
D:\ has DREAM-specific game files.

## Bootstrap

```powershell
cd C:\antigravity
git pull origin main
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-sabretooth.ps1
```
