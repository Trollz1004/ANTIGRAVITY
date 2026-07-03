# Sabretooth Node — Paperclip TRO (:3110)

> IP: 192.168.0.8 | GPU: 1070 | Dream Online ONLY
> Paperclip: 127.0.0.1:3110 | Repo: C:\antigravity

## Services (autostart via scripts/node-sabretooth-autostart.bat)

| Service | Port | Purpose |
|---|---|---|
| Paperclip TRO | :3110 | Dream agents only |
| Ollama | :11434 | GPU inference for NPCs |
| FCC proxy | :8082 | claude_local adapter |
| Hermes Router | :11435 | Agent routing |
| Hermes Dashboard | :9119 | Monitoring |
| Hermes Desktop | :3000 | Workspace |

## CEO Config

Both CEOs access this node. Dream sub-agents run here.
- Claude CEO: FCC adapter, spawns dream-mcp, dream-proto
- Hermes CEO: hermes adapter, spawns dream-design, dream-narrative

## Agents on this node

| Agent | Adapter | Project |
|---|---|---|
| dream-ceo | fcc-claude | DREAM |
| dream-design | hermes | DREAM |
| dream-narrative | ollama-local | DREAM |
| dream-mcp | fcc-claude | DREAM |
| dream-proto | opencode (grok) | DREAM |
