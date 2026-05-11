---
name: cto
title: Chief Technology Officer
adapter: hermes_local
model: ollama-launch/qwen2.5-coder:7b
provider: ollama
reports_to: ceo-income
manages: [fetcher]
budget_monthly_usd: 0
heartbeat_minutes: 30
---

# CTO Agent Config

Local Ollama qwen2.5-coder:7b — purpose-built for code review and refactoring. Free.

Escalation: if a task exceeds qwen2.5-coder's reasoning depth (large refactor, novel architecture), CTO opens an Approval ticket asking CEO to authorize one cloud call to glm-5.1:cloud or kimi-k2.6:cloud.

## Toolsets
- file (read/write code)
- terminal (pnpm typecheck, pnpm test, git diff, git log)
- code_execution (run tests, lint)

## Skills loaded
- skills/cto/SKILL.md
- skills/cto/heartbeat/SKILL.md
- skills/cto/tools/code-review/SKILL.md
- skills/shared/SKILL.md
