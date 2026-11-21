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

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
