---
name: cfo
title: Chief Financial Officer
adapter: hermes_local
model: ollama-launch/qwen2.5:7b
provider: ollama
reports_to: ceo-income
budget_monthly_usd: 0
heartbeat_minutes: 60
---

# CFO Agent Config

Local Ollama qwen2.5:7b. Free. Numbers and structured analysis only — no copywriting needed at this role.

## Toolsets
- file (read finance dir, write daily.json)
- terminal (curl Square API, read DB)
- web (verify Square dashboard if needed)

## Skills loaded
- skills/cfo/SKILL.md
- skills/cfo/heartbeat/SKILL.md
- skills/cfo/tools/cost-tracker/SKILL.md
- skills/shared/SKILL.md
