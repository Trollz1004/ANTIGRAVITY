---
name: ceo-income
title: Chief Executive Officer
adapter: hermes_local
model: ollama-launch/glm-5.1:cloud
provider: ollama-launch
reports_to: joshua_coleman_board
manages: [cfo, cto, cmo]
budget_monthly_usd: 10
heartbeat_minutes: 5
---

# CEO Agent Config

Hermes runtime (glm-5.1:cloud via Ollama Cloud). Reasoning model — uses the `reasoning` field for chain-of-thought.

Fallback chain (model-router):
1. glm-5.1:cloud (default)
2. kimi-k2.6:cloud
3. deepseek-v3.2:cloud
4. qwen3.5:latest (local emergency fallback)

## Toolsets
- file (read all of /income-engine, write /paperclip-data)
- terminal (full shell access)
- web (research, competitor scans)
- mcp (extend later via plugins)

## Skills loaded
- skills/ceo/SKILL.md
- skills/ceo/heartbeat/SKILL.md
- skills/ceo/tools/lead-scanner/SKILL.md
- skills/ceo/tools/model-router/SKILL.md
- skills/ceo/tools/fetcher-trigger/SKILL.md
- skills/shared/SKILL.md

## Direct reports
- CFO (cfo) — finance
- CTO (cto) — engineering, manages FETCHER
- CMO (cmo) — marketing
