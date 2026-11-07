---
name: dateapp-swarm
description: Use when running the YouAndINotAI launch swarm (GUI, payments, growth, ops).
---

# Date App Agent Swarm

## Summonable sub-agents (OPUS-tier packs)

See `.agents/subagents/SUMMON.md` and `.agents/subagents/registry.json`.

| Lane | Sub-agent id | Pack |
| -------- | ------------------ | ------------------------------------- |
| GUI | `dateapp-gui` | `.agents/subagents/dateapp-gui/` |
| Payments | `dateapp-payments` | `.agents/subagents/dateapp-payments/` |
| Growth | `dateapp-growth` | `.agents/subagents/dateapp-growth/` |
| Ops | `dateapp-ops` | `.agents/subagents/dateapp-ops/` |

Each pack has the required 7 files: SOUL, HEARTBEAT, TOOLS, SKILLS, AGENT, MEMORY, SKILL.

## Skill trees (still load per lane)

| Agent | Skills dir |
| -------- | ---------------------------------------- |
| GUI | `.agents/skills/dateapp-gui-agent/` |
| Payments | `.agents/skills/dateapp-payments-agent/` |
| Growth | `.agents/skills/dateapp-growth-agent/` |
| Ops | `.agents/skills/dateapp-ops-agent/` |

## Protocol

1. Parent Hermes/OpenClaw summons one lane pack
2. Sub-agent loads its 7 MD files + lane skills listed in SKILLS.md
3. Workspace: `C:\ANTIGRAVITY` (D:\, E:\, and F:\ANTIGRAVITY are dead — never work there)
4. Ship evidence (curl, screenshot, test output)
5. Affiliate links via landing `?ref=` only

## Parents

Hermes + OpenClaw only. No extra standing agents.

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
