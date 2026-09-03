---
name: dateapp-swarm
description: Use when running the YouAndINotAI launch swarm (GUI, payments, growth, ops).
---

# Date App Agent Swarm

## Summonable sub-agents (OPUS-tier packs)

See `.agents/subagents/SUMMON.md` and `.agents/subagents/registry.json`.

| Lane     | Sub-agent id       | Pack                                  |
| -------- | ------------------ | ------------------------------------- |
| GUI      | `dateapp-gui`      | `.agents/subagents/dateapp-gui/`      |
| Payments | `dateapp-payments` | `.agents/subagents/dateapp-payments/` |
| Growth   | `dateapp-growth`   | `.agents/subagents/dateapp-growth/`   |
| Ops      | `dateapp-ops`      | `.agents/subagents/dateapp-ops/`      |

Each pack has the required 7 files: SOUL, HEARTBEAT, TOOLS, SKILLS, AGENT, MEMORY, SKILL.

## Skill trees (still load per lane)

| Agent    | Skills dir                               |
| -------- | ---------------------------------------- |
| GUI      | `.agents/skills/dateapp-gui-agent/`      |
| Payments | `.agents/skills/dateapp-payments-agent/` |
| Growth   | `.agents/skills/dateapp-growth-agent/`   |
| Ops      | `.agents/skills/dateapp-ops-agent/`      |

## Protocol

1. Parent Hermes/OpenClaw summons one lane pack
2. Sub-agent loads its 7 MD files + lane skills listed in SKILLS.md
3. Workspace: `C:\ANTIGRAVITY` (D:\, E:\, and F:\ANTIGRAVITY are dead — never work there)
4. Ship evidence (curl, screenshot, test output)
5. Affiliate links via landing `?ref=` only

## Parents

Hermes + OpenClaw only. No extra standing agents.
