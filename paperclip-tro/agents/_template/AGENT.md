---
name: <agent-id>
title: <Role> — <ANT|DREAM>
adapter: <fcc-claude|hermes|pi|codex|gemini|opencode|ollama-local>
paperclip_adapter_type: <claude_local|codex_local|opencode_local|pi_local|openclaw_gateway>
model: <model-id — see adapters/*/manifest.yaml for defaults per adapter>
provider: <provider from opencode.json — separate API usage per adapter always>
reports_to: tro-ceo
manages: []
budget_monthly_usd: 0
heartbeat_minutes: <30-120; workers slower than CEO>
---

# <Role> Agent Config

One-paragraph role scope: <what it does, what it never does>.

## Paperclip Registration

Use the adapter's `paperclip_adapter_type` and `paperclip_adapter_config` from
`adapters/<adapter>/manifest.yaml` when creating agents via the Paperclip API.

For FCC-backed agents (adapter: fcc-claude), use `claude_local` with FCC env vars:
```json
{
  "adapterType": "claude_local",
  "adapterConfig": {
    "cwd": "C:\\antigravity",
    "model": "claude-sonnet-4-5-20250929",
    "env": {
      "ANTHROPIC_BASE_URL": "http://127.0.0.1:8082",
      "ANTHROPIC_AUTH_TOKEN": "freecc",
      "CLAUDE_CONFIG_DIR": "C:\\Users\\joshl\\.claude-fcc",
      "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192"
    }
  }
}
```

## Toolsets
- <minimum set only — every extra tool is boot spam>

## Skills loaded (lazy — read on need, never at boot)
- .agents/skills/<skill-dir>/SKILL.md
