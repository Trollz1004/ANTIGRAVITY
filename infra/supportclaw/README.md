# SupportClaw (T5500)

SupportClaw is a separate OpenClaw instance for customer support only.

Isolation goals:
- separate `OPENCLAW_STATE_DIR`
- separate workspace and memory files
- no shared Telegram heartbeat
- no bind to the main Sabretooth OpenClaw state
- Ollama-backed semantic memory search when `memorySearch.provider = "ollama"`

Notes:
- Official OpenClaw FAQ confirms `memorySearch.provider = "ollama"` is supported for semantic memory search.
- This package is staged for T5500 because Docker is not installed on Sabretooth.
- Copy `openclaw.json.example` to `state/openclaw.json` before first start and replace the gateway token placeholder.
- Point the date-app backend to this gateway with `SUPPORT_OPENCLAW_URL=http://<t5500-host>:18895`.

Expected host folders:
- `infra/supportclaw/state`
- `infra/supportclaw/workspace`

Start on T5500:

```powershell
cd C:\ANTIGRAVITY\infra\supportclaw
Copy-Item .\openclaw.json.example .\state\openclaw.json -Force
docker compose up -d --build
```

Support gateway:
- `http://localhost:18895/chat`
