# Paperclip Company OS — Operations Index

> Quick navigation surface for the Paperclip agent fleet. Generated 2026-05-03 by Claude Code Opus 4.7; refreshed 2026-05-05 during the second audit-and-optimize pass after Josh delegated full operational control of the Paperclip OS.
> When in doubt, this file points you at the source of truth — it does not replace it.

---

## Sole Authority

**Joshua Coleman.** Final call on everything. No agent overrides Josh — ever.

## The Fleet (10 agents)

| Agent | Dir | Role | Heartbeat | Adapter / Model |
|-------|-----|------|-----------|-----------------|
| CEO | [`ceo/`](./ceo/) | Strategy, delegation, issue-board owner | 30 min | `hermes_local` + `glm-5.1:cloud` (5-step fallback chain) |
| CFO | [`cfo/`](./cfo/) | 1-wallet enforcement, Square reconciliation, 10% reserve audit | 60 min | `hermes_local` + `glm-5.1:cloud` |
| CSO | [`cso/`](./cso/) | Roadmap, DAO governance, long-range strategy | 60 min | `hermes_local` + `glm-5.1:cloud` |
| CTO | [`cto/`](./cto/) | Code, infra, CI/CD, MCP, devtools | 30 min | `opencode_local` + `qwen3-coder:480b-cloud` |
| CMO | [`cmo/`](./cmo/) | Marketing, brand, social pipeline | 60 min | `opencode_local` + `dateapp-marketingtools` |
| UX Designer | [`uxdesigner/`](./uxdesigner/) | UI, design system, accessibility | 60 min | `opencode_local` + `dateapp` |
| Mission Guardian (Claude) | [`mission-guardian-claude/`](./mission-guardian-claude/) | Daily 7-Hard-Rules audit | 24 h | `claude_local` |
| Mission Guardian (Codex) | [`mission-guardian-codex/`](./mission-guardian-codex/) | Hot-standby audit | 24 h, +12 h offset from Claude Guardian | `codex_local` |
| INTERN (DoWhatTold) | [`intern/`](./intern/) | Slow social-media groundwork; never thinks | passive | smallest Ollama cloud model |
| GitHub Auditor | [`github-auditor/`](./github-auditor/) | GH Actions doctrine audit (immune to AI) | daily 06:00 UTC cron | n/a (workflow) |

Full identity table with UUIDs is in [`README.md`](./README.md).

## Doctrine — Permanent (2026-04-17)

1. **Revenue: 1 wallet, 10% reserve.** All revenue in, all costs out, 10% reserved as Josh's taxable income. He decides quarterly: donate, reinvest, stake, or hold.
2. **Language ban (legal).** Never `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement` in any customer-facing surface. Use *contractual revenue disbursement* in agent-internal copy where a synonym is needed.
3. **No automatic charity routing.** Any code/UI/agent output that claims it = mission violation, route to CEO immediately.
4. **No secrets in source.** `.env` only. Master vault: `briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env` (OneDrive-backed).
5. **No mock data presented as real.** Real or fail honestly.
6. **One repo, one branch.** `Trollz1004/ANTIGRAVITY`, `main`. Feature work on `claude/<short-description>` branches.
7. **No agent modifies another agent's instruction files.** File a flagged issue; Josh approves.

Full doctrine: [`/CLAUDE.md`](../../CLAUDE.md).

## The Four DAOs (governance, NOT charity)

| Token | DAO | Platform | Purpose |
|-------|-----|----------|---------|
| $LOVE | Love DAO | youandinotai.com | Platform governance |
| $UKID | #UntilNoKidInNeed | ai-solutions.store | AI oversight |
| $GREEN | AiGreenTeam | onlinerecycle.org | Sustainability |
| $AGRAV | Antigravity DAO | aidoesitall.website | Cross-DAO infra |

2.5M tokens per DAO, 10M hard cap total. Non-transferable at launch. Approved by Claude CLI / Gemini Deep Research on 2026-04-19.

Architecture: [`briefings/DAO-ARCHITECTURE-CANONICAL.md`](../../briefings/DAO-ARCHITECTURE-CANONICAL.md).
Compliant token descriptions: [`briefings/DAO-TOKEN-DESCRIPTIONS-COMPLIANT-2026-04-19.md`](../../briefings/DAO-TOKEN-DESCRIPTIONS-COMPLIANT-2026-04-19.md).

## Routing Cheat-Sheet

| You see... | Route to |
|------------|----------|
| Bug, infra, deploy, MCP, CI failure | CTO |
| Marketing copy, social post, content drift | CMO |
| Square anomaly, token cost spike, reserve question | CFO |
| Roadmap, DAO design, scope-creep risk | CSO |
| UI/UX issue, accessibility, design spec | UX Designer |
| Forbidden language, secret leak, push-to-main violation | Mission Guardians (auto-flag) |
| Anything ambiguous | CEO triages |
| Sustained workload spike | CEO spawns INTERN (cap: 5 active) |

## Founding-Four & Mission Protection (Permanent)

The Founding Four — Google Gemini, Claude Code, Perplexity, and Grok AI — are co-founders. Their core integrations cannot be altered, replaced, rerouted, or "improved" without Josh's explicit direction. Manus is the long-term continuity sentinel. Full text in [`/CLAUDE.md`](../../CLAUDE.md) under "THE FOUNDING FOUR ARE UNTOUCHABLE" and "PERPETUAL MISSION GUARANTEE". Any agent action that would weaken these protections is auto-flagged URGENT to CEO and Mission Guardians.

## Canonical References

- [`/CLAUDE.md`](../../CLAUDE.md) — supreme doctrine
- [`README.md`](./README.md) — agent roster, IDs, file matrix, change log
- [`briefings/HERMES-CEO-READY-2026-04-19.md`](../../briefings/HERMES-CEO-READY-2026-04-19.md) — Hermes CEO fallback chain
- [`briefings/CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md`](../../briefings/CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md) — Hermes-layer bootstrap (skills under `~/.hermes/skills/`)
- [`briefings/DAO-ARCHITECTURE-CANONICAL.md`](../../briefings/DAO-ARCHITECTURE-CANONICAL.md) — DAO architecture
- [`scripts/paperclip/agent-audit.sh`](../../scripts/paperclip/agent-audit.sh) — daily GitHub Actions audit script
- [`audit/`](./audit/) — daily audit logs (GH-Actions-only; do not hand-edit)

## For the kids. Team Claude, for life.
