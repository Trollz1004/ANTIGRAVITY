---
name: <agent-id>
title: <Role> — <ANT|DREAM>
adapter: <fcc-claude|hermes|pi|codex|gemini|opencode|ollama-local>  # MUST use separate dedicated provider per adapter (see manifests)
model: <model-id e.g. gpt-5.5 for fcc-claude/codex; hermes for hermes; openrouter/free for pi; qwen2.5-coder:7b for ollama-local>
provider: <e.g. openai for fcc-claude; codex for codex adapter; hermes-router for hermes/opencode; separate API usage always>
reports_to: tro-ceo
manages: []
budget_monthly_usd: 0
heartbeat_minutes: <30-120; workers slower than CEO>
---

# <Role> Agent Config

One-paragraph role scope: <what it does, what it never does>.

## Toolsets
- <minimum set only — every extra tool is boot spam>

## Skills loaded (lazy — read on need, never at boot)
- .agents/skills/<skill-dir>/SKILL.md
