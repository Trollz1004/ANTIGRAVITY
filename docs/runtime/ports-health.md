# Ports And Health Runbook

Sabretooth remains the single command center. T5500 and 9020 run bounded worker services that report into Sabretooth Agent Hub and fail closed when Agent Hub is unavailable.

## Canonical ports

| Node | Port | Service | Exposure | Health |
|---|---:|---|---|---|
| Sabretooth `192.168.0.8` | `3110` | PaperclipAI HQ | local/LAN operator | `GET /api/health` |
| Sabretooth `192.168.0.8` | `3130` | Agent Hub | local/LAN private | `GET /health` |
| Sabretooth `192.168.0.8` | `3000` | Hermes Workspace | local private | `GET /api/ping` |
| Sabretooth `192.168.0.8` | `9119` | Hermes dashboard/API | local/LAN private | `GET /api/status` |
| Sabretooth `192.168.0.8` | `8082` | FCC helper | local private | adapter-specific |
| Sabretooth `192.168.0.8` | `11434` | Ollama | local private | `GET /api/tags` |
| T5500 `192.168.0.15` | `8000` | Date-app FastAPI | tunnel/private edge | `GET /health` |
| T5500 `192.168.0.15` | `3200` | Date-app frontend | tunnel/private edge | static readiness |
| T5500 `192.168.0.15` | `9110` | Hermes support gateway | LAN/private edge | `GET /health` |
| 9020 `192.168.0.5` | `3120` | Marketing worker | LAN private | `GET /health` |
| Sabretooth E: | `9127` | Dream Live NPC Lab | local private | `GET /health` |
| Sabretooth | `8090` | Dream NPC Router | local private | `GET /health` |

## Fail-closed rules

- T5500 `:9110` does not own doctrine, payments, public copy, task state, or repo state.
- 9020 `:3120` does not post, send, DM, spend, scrape, or publish.
- Both workers require a local node API key for mutating endpoints.
- Both workers require `AGENT_HUB_API_KEY` to create Agent Hub tasks.
- If Agent Hub `:3130` is down, workers return `blocked` and keep no local backlog.

## Startup scripts

- T5500: `powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-hermes-support-gateway.ps1`
- 9020: `powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\start-marketing-worker.ps1`

Register a startup task only after node env files are configured locally:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\register-node-worker-task.ps1 -TaskName HermesSupportGateway-9110 -StartScript C:\antigravity\scripts\start-hermes-support-gateway.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\register-node-worker-task.ps1 -TaskName MarketingWorker-3120 -StartScript C:\antigravity\scripts\start-marketing-worker.ps1
```

No populated `.env` values belong in git, chat, logs, or docs.

## Known drift quarantined by this runbook

- T5500 must not start Agent Hub locally; Agent Hub belongs on Sabretooth `:3130`.
- 9020 must not start a separate Paperclip command center; `:3120` is the marketing worker only.
- Agent Hub dispatch metadata must describe Sabretooth as the hub, not T5500.
