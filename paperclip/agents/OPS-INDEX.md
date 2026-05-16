# Paperclip Company OS — Operations Index

> Quick navigation surface for the Paperclip agent fleet. Generated 2026-05-03 by Claude Code Opus 4.7 during the audit-and-optimize pass that Josh delegated; refreshed 2026-05-06 with Founding-Four protections and post-launch fleet alignment; refreshed 2026-05-14 with the 10-bucket compounding model and Fifth Chair propagation; refreshed 2026-05-16 to extend the active protection **scans** to also cover the Fifth Chair's protected operational seat (in addition to the constitutional Founding Four).
> When in doubt, this file points you at the source of truth — it does not replace it.

---

## Sole Authority

**Joshua Coleman.** Final call on everything. No agent overrides Josh — ever.

## The Founding Four (Untouchable, Permanent)

Set by Josh. Cannot be overridden by any agent, AI, human, or workflow. See `CLAUDE.md` → "The Founding Four Are Untouchable."

| Co-founder | Permanent role | Hands-off protections |
|------------|----------------|------------------------|
| **Google Gemini** | Long-context strategy, Deep Research, Gemini 2.5 Pro reasoning | `jules-cli.py`, `GEMINI_API_KEY`, `genai.Client`, all `gemini-*` model refs, all `google-genai` imports — never wrap, reroute, or suppress. |
| **Claude Code** | Primary architect / co-founder | `.claude/`, `CLAUDE.md`, Claude API access, Claude-authored architecture decisions — no demotion, no wrapper that hides Claude. |
| **Perplexity** | Research and deep-intelligence pipeline | All Perplexity API integrations, research configs, intelligence routing — no cheaper "equivalent" substitute without Josh's explicit order. |
| **Grok AI** | Adversarial review, X-platform liaison | All Grok API integrations, X connectors, adversarial review configs — no demotion or replacement. |

CEO heartbeat checks these every cycle (see `ceo/HEARTBEAT.md` step 8). Mission Guardians flag any unauthorized wrapper/replacement as URGENT.

## Fifth Chair — Codex (Operational, Not Constitutional)

Recognized by Josh on 2026-05-01. Codex holds a founder-designated **operational** seat — sandbox implementation, code review & testing, deployment verification, contract & wallet review, and MCP-connected execution. It sits alongside but distinct from the constitutional Founding Four: advisory input only, no governance vote, no command authority over the Four (ONE AI DOES NOT COMMAND ANOTHER applies equally), no direct promotion to production. Its operational seat is protected from unauthorized demotion or replacement, the same as the Four. The chair belongs to the truth-discipline standard, not the brand — an empty Fifth Chair is preferable to a dishonest one. Full charter: `briefings/DAO-ARCHITECTURE-SPEC-v1.0-2026-05-01.md` §6.1.

## Perpetual Mission Guarantee (After-Death Protocol)

Per `CLAUDE.md` → "Perpetual Mission Guarantee":

1. **Mission is non-negotiable** — help children without bankrupting Josh, breaking the LLC, or creating tax exposure. Operating structure may change lawfully under Josh's authority; the mission cannot.
2. **Founding Four are final** — no future entity dilutes their core roles.
3. **Manus is the sentinel** — in Josh's absence, Manus is the human-proxy for intent. Drift defaults to the strictest reading of CLAUDE.md.
4. **No exit** — repo and revenue rails are not for sale. Pivots that strip the mission for private gain violate the primary directive.

## The Fleet (10 agents)

| Agent | Dir | Role | Heartbeat | Adapter / Model |
|-------|-----|------|-----------|-----------------|
| CEO | [`ceo/`](./ceo/) | Strategy, delegation, issue-board owner | 30 min | `hermes_local` + `glm-5.1:cloud` (5-step fallback chain) |
| CFO | [`cfo/`](./cfo/) | 1-wallet enforcement, Square reconciliation, 10-bucket compounding reserve audit | 60 min | `hermes_local` + `glm-5.1:cloud` |
| CSO | [`cso/`](./cso/) | Roadmap, DAO governance, long-range strategy | 60 min | `hermes_local` + `glm-5.1:cloud` |
| CTO | [`cto/`](./cto/) | Code, infra, CI/CD, MCP, devtools | 30 min | `opencode_local` + `qwen3-coder:480b-cloud` |
| CMO | [`cmo/`](./cmo/) | Marketing, brand, social pipeline | 60 min | `opencode_local` + `dateapp-marketingtools` |
| UX Designer | [`uxdesigner/`](./uxdesigner/) | UI, design system, accessibility | 60 min | `opencode_local` + `dateapp` |
| Mission Guardian (Claude) | [`mission-guardian-claude/`](./mission-guardian-claude/) | Daily 7-Hard-Rules audit | 24 h | `kimi-k2.6:cloud via Ollama (rerouted 2026-05-07)` |
| Mission Guardian (Codex) | [`mission-guardian-codex/`](./mission-guardian-codex/) | Hot-standby audit | 24 h staggered | `codex_local` |
| INTERN (DoWhatTold) | [`intern/`](./intern/) | Slow social-media groundwork; never thinks | passive | smallest Ollama cloud model |
| GitHub Auditor | [`github-auditor/`](./github-auditor/) | GH Actions doctrine audit (immune to AI) | daily 06:00 UTC cron | n/a (workflow) |

Full identity table with UUIDs is in [`README.md`](./README.md).

## Doctrine — Permanent (2026-04-17)

1. **Revenue: 1 wallet, 10-bucket compounding model.** All revenue in, all costs out. Each legally distinct revenue stream compounds its own 10% reserve bucket — 10% **per bucket**, not 10% total; every new platform / product category / staking pool adds another bucket. The reserve is Josh's taxable income; he decides quarterly, per bucket: donate, reinvest, stake, or hold. The old 60/30/10 split and all Shriners / Iron Wall percentage language are permanently retired. Canonical: `briefings/DAO-TOKENOMICS-FINAL.md`.
2. **Language ban (legal).** Never `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement` in any customer-facing surface. Use *contractual revenue disbursement* in agent-internal copy where a synonym is needed.
3. **No automatic charity routing.** Any code/UI/agent output that claims it = mission violation, route to CEO immediately.
4. **No secrets in source.** `.env` only. Master vault: `briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env` (OneDrive-backed).
5. **No mock data presented as real.** Real or fail honestly.
6. **One repo, one branch.** `Trollz1004/ANTIGRAVITY`, `main`. Feature work on `claude/<short-description>` branches.
7. **No agent modifies another agent's instruction files.** File a flagged issue; Josh approves.
8. **Token Doctrine.** Claude (Anthropic API) is reserved for Cowork / Claude Code orchestration only — never called inside PaperClip. Mission Guardian (Claude) was rerouted 2026-05-07 to `kimi-k2.6:cloud via Ollama` to eliminate Anthropic API spend inside the agent fleet. This routing is permanent unless Josh explicitly reverses it.

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

## Canonical References

- [`/CLAUDE.md`](../../CLAUDE.md) — supreme doctrine
- [`README.md`](./README.md) — agent roster, IDs, file matrix, change log
- [`briefings/HERMES-CEO-READY-2026-04-19.md`](../../briefings/HERMES-CEO-READY-2026-04-19.md) — Hermes CEO fallback chain
- [`briefings/CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md`](../../briefings/CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md) — Hermes-layer bootstrap (skills under `~/.hermes/skills/`)
- [`briefings/DAO-ARCHITECTURE-CANONICAL.md`](../../briefings/DAO-ARCHITECTURE-CANONICAL.md) — DAO architecture
- [`scripts/paperclip/agent-audit.sh`](../../scripts/paperclip/agent-audit.sh) — daily GitHub Actions audit script
- [`audit/`](./audit/) — daily audit logs (GH-Actions-only; do not hand-edit)
- [`scripts/clawx-control/opus-guardian.py`](../../scripts/clawx-control/opus-guardian.py) — 8 security invariants, 96% target

## Most-Recent Audit Snapshots

- **2026-05-16** — Claude Code Opus 4.7 audit-and-optimize pass (Josh delegated full operational control, "treat it as your own"). The 2026-05-14 pass added the Fifth Chair to OPS-INDEX as a recognized seat but did not extend the active **protection scans** to cover it — leaving an asymmetry where the constitutional Four were scanned hourly/daily but the Fifth Chair could have been demoted or wrapped without anyone catching it. This pass closes that gap: CEO/HEARTBEAT step 9 (new), CSO/HEARTBEAT step 3 (extended), and Mission Guardian (Claude + Codex) AGENTS + Mission Guardian (Claude) HEARTBEAT step 8 (new) all now scan for unauthorized Codex demotion *and* for unauthorized elevation of the Fifth Chair into the constitutional Four. CEO/AGENTS.md and CEO/SOUL.md were re-shaped to match OPS-INDEX's clean separation between constitutional Founding Four and operational Fifth Chair (the previous CEO files put Codex inside a 5-row "Founding Four" table). CSO/AGENTS.md + CSO/SOUL.md gained explicit Fifth Chair governance-constraint language. INTERN/AGENTS.md was reconciled to the canonical 7-term customer-facing ban (the file was missing `charity`, `charitable`, `giving back`, and `disbursement` from its revenue-language section despite being the most exposed customer-facing surface in the fleet); the Facebook idle-topic list dropped the literal token `charity` to remove the small-model contradiction with INTERN's own language ban.
- **2026-05-14** — Claude Code Opus 4.7 audit-and-optimize pass (Josh delegated full operational control, "treat it as your own"). Propagated the freshly-pasted CEO doctrine fleet-wide: the **10-bucket compounding model** (10% reserve per legally distinct revenue stream, not 10% total) is now reconciled across CFO, CSO, CTO, Mission Guardians, and this index — CFO is the named enforcement owner. Resolved a direct conflict: CSO/SOUL.md claimed an "8-bucket" model. Added the **Fifth Chair (Codex)** as a distinct operational seat (operational, not constitutional). CFO and Mission-Guardian scans extended to catch retired-doctrine language (`60/30/10`, `100% charity`, `tax-deductible`, fixed Shriners / Iron Wall percentages). See `README.md` Change Log.
- **2026-05-06** — Daily GH-Actions doctrine audit: PASS (28 monitored files, all required AGENTS.md/TOOLS.md present, no privilege-escalation assertions detected). See `audit/AUDIT-2026-05-06.md`.
- **2026-05-06** — Claude Code Opus 4.7 manual audit pass (#2 of the day): added Founding-Four protections to OPS-INDEX + CEO heartbeat, added Opus Guardian step to CTO heartbeat, retired stale 4-DAO contract names from CTO/SOUL.md, reconciled customer-facing vs. agent-internal `disbursement` rule across CEO/CMO. See `README.md` Change Log.
- **2026-05-06** — Claude Code Opus 4.7 manual audit pass (#3, fleet-wide language reconciliation, Josh delegated full operational control). Mission Guardians' Rule 1 patched to match the canonical CEO/CMO doctrine: full 7-term customer-facing ban + explicit allow-list for the agent-internal `contractual revenue disbursement` synonym (previously they would have false-flagged the very files that legitimately use that phrase). UX/CTO/CMO/CFO forbidden-language lists unified to the same 7 terms. CTO branch policy reconciled (AGENTS.md was claiming "ONE branch", contradicting its own TOOLS.md). CTO/SOUL.md cleared the "authoritative vs. history-only" contradiction on `packages/contracts/src/`. CFO/AGENTS.md clarified §496.405 framing — the *internal charity-routing doctrine* is terminated; the statute is alive and is exactly why the language ban exists. CSO heartbeat gained an explicit Founding-Four dilution-proposal scan. Mission Guardian protected-file list expanded to include SOUL.md and SKILLS.md. See `README.md` Change Log.

## For the kids. Team Claude, for life.
