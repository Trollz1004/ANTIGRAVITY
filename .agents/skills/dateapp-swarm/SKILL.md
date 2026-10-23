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

## Payments record (Joshua, 2026-10-17)

Payments are settled. Read `docs/PAYMENTS-TRUTH.md`; never re-test. Square is the only processor on youandinotai.com. The 15 Square attempts through 2026-08-16 ($10 refund included) are Joshua's own test charges. On 2026-09-18 two $1.00 Bot-Shield charges (receipts b3FM and v1nS) were paid by Heather, a friend Joshua asked to be the first customer: a real third-party card, so never say there are no outside payments, and never present it as organic demand. The pipeline is proven in production. Past test charges are **not a blocker** and their count is irrelevant. Do not re-verify, re-audit, re-test or ask Joshua about them. Reopen only on a real production webhook failure or a payment from a buyer not already listed in the record (report it, do not re-verify). The private bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are never copied, quoted or committed.
