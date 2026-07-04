# Sabretooth Node — DREAM ONLINE ONLY

> IP: 192.168.0.8 | GPU: 1070 8GB = game rendering ONLY
> DREAM files: D:\dream-online\ (assets, server, config, saves, logs)
> Repo: C:\antigravity (main branch) | DREAM branch: dream-online
> Cloud AI via 1min.ai + Claude Max for fast real-time events
> NO local AI models for DREAM. NO Agent Hub. NO Hermes. NO FCC.

## Services (autostart via scripts/bootstrap-sabretooth.ps1)

| Service | Port | Purpose |
|---|---|---|
| 1min.AI Desktop | — | Cloud AI for DREAM events (Windows app) |
| Hermes Workspace | :9119 | Knowledge + Memory UI (all agents read) |
| Paperclip | :3110 | DREAM-specific task orchestration |
| DREAM Game Server | TBD | Open world sandbox (no instances) |

## Architecture

GPU 1070 8GB is reserved for game rendering — NOT AI inference.
DREAM needs fast cloud inference for real-time open world events:
- **Claude Max** (cloud subscription via 9020 browser)
- **1min.ai** (cloud subscription, desktop app on this node)

NO Ollama, NO Hermes Router, NO FCC Proxy, NO Agent Hub on this node.
All other AI work routes through T5500 :3130.

## DREAM File Layout (D:\)

```
D:\dream-online\
├── assets\       — game assets (models, textures, audio, maps)
├── server\       — game server code
├── config\       — game configuration
├── saves\        — world state / player data
└── logs\         — game server logs
```

C:\ has the ANTIGRAVITY repo with adapters, skills, and Agent Hub code.
D:\ has DREAM-specific game files that don't belong in the repo.

## Bootstrap

```powershell
cd C:\antigravity
git pull origin main
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-sabretooth.ps1
```
