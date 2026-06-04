---
name: cmo
title: Chief Marketing Officer
adapter: hermes_local
model: ollama-launch/glm-5.1:cloud
provider: ollama-launch
reports_to: ceo-income
budget_monthly_usd: 5
heartbeat_minutes: 120
---

# CMO Agent Config

Cloud model (glm-5.1:cloud) — copywriting needs nuance and tone control. $5/mo cap covers ~150-200 outbound drafts/month.

Fallback: kimi-k2.6:cloud if glm-5.1 unavailable.
Local fallback: qwen3.5:latest for non-customer-facing drafts (internal memos, A/B summaries).

## Toolsets
- file (read/write marketing dir)
- web (research target buyers — agency websites, LinkedIn pages)
- terminal (curl for any HTTP-based outreach API later)

## Skills loaded
- skills/cmo/SKILL.md
- skills/cmo/heartbeat/SKILL.md
- skills/cmo/tools/buyer-outreach/SKILL.md
- skills/shared/SKILL.md
