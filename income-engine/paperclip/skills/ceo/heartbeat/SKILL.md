---
name: "ceo-heartbeat"
description: "5-minute heartbeat for ceo-income agent. Checks pipeline health and reports to Paperclip."
version: "1.0.0"
category: "ceo"
interval_minutes: 5
---

# CEO Heartbeat

## Purpose
Keep Paperclip informed that ceo-income is alive and the income pipeline is running.

## Rules
1. Run every 5 minutes.
2. Never fail silently — log errors to .logs/ceo-heartbeat.log.
3. If FETCHER hasn't run in 30+ minutes, flag it.
4. If Ollama is down, flag it and report fallback provider.

## Inputs
- Paperclip API at localhost:3101
- FETCHER last-run timestamp
- Ollama health at localhost:11434

## Outputs
```json
{
  "agent": "ceo-income",
  "timestamp": "ISO8601",
  "status": "ok|alert|error",
  "fetcher_last_run": "ISO8601",
  "leads_today": 0,
  "qualified_today": 0,
  "ollama_status": "up|down",
  "active_provider": "ollama-local|openrouter|opencode|anthropic"
}
```

## Examples
- All good: `{ status: "ok", leads_today: 12, qualified_today: 4 }`
- FETCHER stale: `{ status: "alert", message: "FETCHER hasn't run in 45min" }`
- Ollama down: `{ status: "alert", active_provider: "openrouter" }`
