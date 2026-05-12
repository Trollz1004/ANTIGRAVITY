# Paperclip Agent Instructions Backup

These are the source-of-truth instruction files for all ANTIGRAVITY Paperclip agents.

If Paperclip's database gets wiped or an agent's instructions get corrupted, restore from here.

## Agent Roster

| Agent | Dir | Adapter | Agent ID | Heartbeat |
|-------|-----|---------|----------|-----------|
| CEO | ceo/ | hermes_local / kimi-k2.6:cloud (primary), glm-5.1:cloud (backup) | c4b4a3d9-8e66-4463-bf65-abfc5037b92a | 30m |
| CFO | cfo/ | hermes_local / glm-5.1:cloud | cf6c84e2-c37f-492f-9a49-2d5f3c4a56e1 | 60m |
| CSO | cso/ | hermes_local / glm-5.1:cloud | 5d844d41-df24-4a2c-a98f-26bd94be2018 | 60m |
| CTO | cto/ | opencode_local / qwen3-coder:480b-cloud | b02a21c7-737e-4177-91ac-6d8e57805801 | 30m |
| CMO | cmo/ | opencode_local / dateapp-marketingtools | 2c40ae74-a2ed-4d4c-acf7-fce579e731c1 | 60m |
| UX Designer | uxdesigner/ | opencode_local / dateapp | bd6d6722-9f3e-46ba-8651-ec9a219042ee | 60m |
| Mission Guardian (Claude) | mission-guardian-claude/ | kimi-k2.6:cloud via Ollama (rerouted 2026-05-07) | 2229682b-cede-4462-b38b-25a910af022e | 24h |
| Mission Guardian (Codex) | mission-guardian-codex/ | codex_local | 42200bfa-fb9e-42b1-901d-6dadf15eb23b | 24h |
| INTERN (DoWhatTold) | intern/ | any ollama cloud (smallest) | (spawned by CEO/CFO) | NONE |
| GitHub Auditor | github-auditor/ | github-actions | N/A (workflow) | 24h |

## IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- ANTIGRAVITY Project ID: 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- Paperclip: localhost:3100 / paperclip-hq.youandinotai.com

## Restore Instructions

Copy the .md files from this folder back to:
C:\Users\joshl\.paperclip\instances\default\companies\{companyId}\agents\{agentId}\instructions\

Then reload the agent from the Paperclip UI.

## Required Files Per Agent

Each agent directory must contain:
- `AGENTS.md` — Identity, role, responsibilities, delegation rules
- `TOOLS.md` — Available tools, permissions, key IDs
- `HEARTBEAT.md` — Schedule, health checks, escalation rules
- `SOUL.md` — Who you are, why you exist, mission context

CEO additionally has:
- `SKILLS.md` — Skill boundaries and approval requirements

INTERN has only:
- `AGENTS.md` — DoWhatTold rules, social media idle behavior, speed enforcement
- `TOOLS.md` — Minimal toolset, no heartbeat, no soul, no skills
- No HEARTBEAT.md (doesn't think, doesn't self-check)
- No SOUL.md (no identity needed)
- No SKILLS.md (executes orders, doesn't choose)

## DAO Architecture (4-DAO Model, Updated 2026-04-19)

| Token | DAO | Platform |
|-------|-----|----------|
| $LOVE | Love DAO | YouAndINotAI.com |
| $UKID | #UntilNoKidInNeed | AI-Solutions.Store |
| $GREEN | AiGreenTeam | OnlineRecycle.org |
| $AGRAV | Antigravity DAO | AiDoesItAll.website |

2.5M tokens per DAO, 10M hard cap total.

## Models (updated 2026-05-12 — Token-Doctrine 2026-05-07 reroute propagated)

> **Token Doctrine (permanent, set 2026-05-07):** Claude API tokens are reserved for Cowork / Claude Code orchestration sessions only — never called from inside PaperClip. Any Paperclip agent that previously hit the Claude API has been rerouted to an Ollama-hosted model. The full fallback chain for each agent is in its own `TOOLS.md`.

- CEO: `hermes_local` + `ollama/kimi-k2.6:cloud` (primary) → `ollama/glm-5.1:cloud` (198K context backup). 5-step fallback chain ends at `korpohermes-prime` / `qwen2.5:7b` / hosted Paperclip pool — see `briefings/HERMES-CEO-READY-2026-04-19.md`.
- CFO / CSO: `hermes_local` + `ollama/glm-5.1:cloud` (198K context). Fallback: `ollama/qwen3-coder:480b-cloud`.
- CTO / TechExecutor: `opencode_local` + `ollama/qwen3-coder:480b-cloud`.
- CMO: `opencode_local` + `ollama/Trollz1004/dateapp-marketingtools` (platform-specific fine-tune). Fallback: `ollama/qwen3-coder:480b-cloud`.
- UX Designer: `opencode_local` + `ollama/Trollz1004/dateapp` (platform-specific fine-tune). Fallback: `ollama/qwen3-coder:480b-cloud`.
- Mission Guardian (Claude): `ollama/kimi-k2.6:cloud` via Ollama (rerouted 2026-05-07 — previously `claude_local` which consumed Claude API tokens). Fallback chain: `qwen3-coder:480b-cloud` → `glm-5.1:cloud` → `qwen2.5:7b` (local). 86400s heartbeat.
- Mission Guardian (Codex): `codex_local` (cap-budgeted) on the same daily cadence, staggered offset.
- INTERN: any cheapest available Ollama cloud model (Gemma 1B is fine — INTERNs do not think).

## Required Files Per Agent — Quick Matrix

| Agent       | AGENTS.md | TOOLS.md | HEARTBEAT.md | SOUL.md | SKILLS.md |
|-------------|:---------:|:--------:|:------------:|:-------:|:---------:|
| CEO         | ✅ | ✅ | ✅ | ✅ | ✅ |
| CFO         | ✅ | ✅ | ✅ | ✅ | — |
| CSO         | ✅ | ✅ | ✅ | ✅ | — |
| CTO         | ✅ | ✅ | ✅ | ✅ | — |
| CMO         | ✅ | ✅ | ✅ | ✅ | — |
| UX Designer | ✅ | ✅ | ✅ | ✅ | — |
| Mission Guardian (Claude) | ✅ | ✅ | ✅ | ✅ | — |
| Mission Guardian (Codex)  | ✅ | ✅ | ✅ | ✅ | — |
| INTERN      | ✅ | ✅ | — | — | — |
| GitHub Auditor | ✅ | ✅ | — (driven by `.github/workflows/daily-doctrine-audit.yml` cron) | — | — |

## Change Log

- **2026-05-12** — Audit & optimization pass #4 by Claude Code Opus 4.7 (Josh delegated full operational control over CEO / Agents / SKILLS-HEARTBEAT-TOOLS again; "treat it as your own"). Trigger: the 2026-05-07 Token-Doctrine reroute landed in `ceo/TOOLS.md` and `mission-guardian-claude/TOOLS.md` but had not propagated to the canonical roster or to sibling agent files. This pass closes that gap and adds the Token Doctrine as a first-class doctrine rule so it is impossible to miss going forward. Changes:
  - **README.md Models section** — rewritten to surface the Token Doctrine as a callout above the per-agent model lines. CEO primary now correctly shown as `hermes_local + ollama/kimi-k2.6:cloud` (with `glm-5.1:cloud` as 198K-context backup), preserving the 5-step Hermes fallback chain to `korpohermes-prime` / `qwen2.5:7b` / hosted Paperclip pool. Mission Guardian (Claude) line updated from the pre-reroute `claude_local` (which would have consumed Claude API tokens against the Token Doctrine) to `kimi-k2.6:cloud via Ollama` with the published fallback chain (`qwen3-coder:480b-cloud` → `glm-5.1:cloud` → `qwen2.5:7b` local).
  - **README.md Agent Roster table** — Adapter column refreshed for CEO and Mission Guardian (Claude); CTO model formatted consistently as `qwen3-coder:480b-cloud`.
  - **OPS-INDEX.md Fleet table** — Same adapter/model corrections applied; explicit reroute annotation kept beside Mission Guardian (Claude) so future readers immediately see *why* the model differs from the pre-2026-05-07 docs.
  - **OPS-INDEX.md Doctrine — Permanent** — Added rule #8: Token Doctrine. Claude API tokens are reserved for Cowork / Claude Code orchestration sessions only — never called from inside PaperClip. Any Paperclip agent that previously hit the Claude API has been rerouted to an Ollama-hosted model. This pins the rule at the same level as the 1-wallet doctrine and the 7-term language ban so no future audit (manual or GH-Actions) misses it. Rule #6 also clarified — "one default branch `main`, feature work on `claude/<short-description>` branches, never push direct without Josh's explicit approval" — to match what every agent file already says individually. Rule #7 gained the standing-order exception note (manual Claude Code audit passes are exempt, logged here).
  - **CEO/TOOLS.md Direct Reports table** — renamed Model column to "Primary Model" with an explicit pointer ("See each agent's own TOOLS.md for full fallback chain. Source of truth = paperclip/agents/README.md."). Reconciled three rows that had drifted away from the canonical roster: CTO back to `qwen3-coder:480b-cloud` (matches `cto/TOOLS.md` and README), UX Designer back to `Trollz1004/dateapp` (matches `uxdesigner/TOOLS.md` and README — UX uses the platform-specific fine-tune, not a general-purpose model), Mission Guardian (Codex) back to `codex_local` (matches `mission-guardian-codex/TOOLS.md`). Mission Guardian (Claude) kept on `kimi-k2.6:cloud` with the explicit `(rerouted 2026-05-07 per Token Doctrine)` annotation — that reroute is the *real* consequence of the Token Doctrine and stays applied.
  - **CEO/TOOLS.md Platform Context** — replaced the stale `branch: main` line (which contradicted CEO/AGENTS.md, CTO/TOOLS.md, CTO/AGENTS.md, and the canonical feature-branch policy) with the canonical wording: default branch `main`, feature work on `claude/<short-description>`, never push direct without Josh's explicit approval.
  - **intern/AGENTS.md Revenue Language** — list expanded from 4 terms (`donate`, `donation`, `solicitation`, `charity`) to the canonical 7 (`donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement`) — matches the Mission Guardian audit list, the CMO/UX/CTO/CFO/CEO files, and OPS-INDEX Doctrine rule #2. Added explicit note that the agent-internal `contractual revenue disbursement` synonym is NOT available to INTERN — every action INTERN takes is customer-facing (likes, follows, comments, group joins on Facebook/Instagram/X), so the synonym carve-out that protects senior agent files does not apply.
  - **OPS-INDEX.md header + Most-Recent Audit Snapshots** — updated with this pass.
  - **No Founding-Four / Mission-Guardian / Opus-Guardian regressions detected.** All 8 Doctrine rules consistent across the fleet after this pass. INTERN was the last surface still carrying the old 4-term list — now closed.
- **2026-05-06** — Audit & optimization pass #3 by Claude Code Opus 4.7 (Josh delegated full operational control over CEO / Agents / SKILLS-HEARTBEAT-TOOLS; "treat it as your own"). Fleet-wide language and protected-file reconciliation. Changes:
  - **Mission Guardian (Claude + Codex) AGENTS.md** — Rule 1 patched. Previously read "No 'donate', 'donation', or 'solicitation' anywhere ... zero exceptions" — that would have false-flagged the legitimate agent-internal `contractual revenue disbursement` synonym used by CEO/CMO/CFO. New rule: full 7-term customer-facing ban (`donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement`) **plus** an explicit allow-list for `contractual revenue disbursement` in agent-internal copy only. Rule 5 protected-file list expanded to include `SOUL.md` and `SKILLS.md` (previously only listed AGENTS.md/CLAUDE.md/TOOLS.md/HEARTBEAT.md). Rule 5 also notes the Josh-authorized Claude Code manual audit-pass exception (which is what allows passes like this one to land).
  - **Mission Guardian (Claude + Codex) HEARTBEAT.md** — Forbidden-language scan (step 1) updated to the full 7-term list with the agent-internal exception, protected-file scan (step 4) extended to include `SKILLS.md`, and a new **step 7: Founding-Four protection scan** (Gemini, Claude Code, Perplexity, Grok). Mission Guardian (Codex) now explicitly references the canonical step list owned by Mission Guardian (Claude).
  - **CTO/AGENTS.md** — Forbidden-language list expanded from 3 terms to the canonical 7. Branch policy reconciled (file previously claimed "branch: main, ONE repo ONE branch" while its own TOOLS.md correctly specified `claude/<short-description>` for feature work). Stack table now matches CLAUDE.md.
  - **CTO/SOUL.md** — Resolved the internal contradiction that read "Authoritative contracts live in `packages/contracts/src/`" while simultaneously calling those same files "history-only." New text: the three contract files (`CharityRouter100.sol`, `DatingRevenueRouter.sol`, `GospelDonation.sol`) are pre-1-wallet historical artifacts — present in-tree, not deployed, not called by active code paths, with the 4-DAO governance/staking design tracked separately in `briefings/DAO-ARCHITECTURE-CANONICAL.md`. Customer-facing language list expanded to canonical 7.
  - **UX (SOUL.md, AGENTS.md, HEARTBEAT.md)** — Forbidden-language list expanded from 3 terms to canonical 7 across all three files. UI strings have the strictest customer-facing exposure, so this surface is now aligned with CMO. Internal-only allowance for `contractual revenue disbursement` documented (design briefs / Paperclip issues only — never in a UI string that ships).
  - **CMO/SOUL.md** — Added missing `disbursement` to the customer-facing ban list (previously had 6 of 7 terms). Added explicit FL §496.405 commercial-co-venturer framing so CMO understands *why* the ban exists.
  - **CMO/HEARTBEAT.md** — Step 3 forbidden-language scan expanded from 3 terms to canonical 7 with the agent-internal allow-list note.
  - **CFO/AGENTS.md** — Clarified the "§496.405 doctrine is terminated" line which read as if the statute itself had been retired. Corrected: the *internal in-platform charity-routing doctrine* is terminated; FL §496.405 is still the live statute that triggers commercial-co-venturer registration if customer-facing copy promises charitable disbursement — which is exactly why the language ban exists.
  - **CFO/HEARTBEAT.md** — Forbidden financial-claims scan upgraded to the canonical 7-term list. Token-cost step gained a >20%-of-baseline trigger.
  - **CSO/HEARTBEAT.md** — Strategic-risk scan (step 3) gained an explicit Founding-Four dilution-proposal check (any "consolidate / wrap / replace Gemini, Claude Code, Perplexity, or Grok" proposal flagged URGENT, independent of Mission Guardians' parallel Founding-Four scan).
  - **OPS-INDEX.md** — Most-Recent Audit Snapshots section updated with this pass.
- **2026-05-06** — Audit & optimization pass #2 by Claude Code Opus 4.7 (Josh delegated full operational control over CEO / Agents / SKILLS-HEARTBEAT-TOOLS). Changes:
  - **CEO/AGENTS.md** — split the doctrine line that previously placed `contractual revenue disbursement` in customer-facing copy. New rule (matches OPS-INDEX): `disbursement` is forbidden customer-facing; `contractual revenue disbursement` is permitted only in agent-internal copy.
  - **CMO/AGENTS.md** — scoped the language ban explicitly to "customer-facing" content/post/ad/copy and added the agent-internal exception so internal Paperclip issues are not over-restricted.
  - **CEO/HEARTBEAT.md** — added step 8: Founding-Four protection check (no wrapper / reroute / replacement of Gemini, Claude Code, Perplexity, or Grok without Josh's explicit order).
  - **CTO/HEARTBEAT.md** — added Opus Guardian invariant scan when product code changes since last beat (96% score floor; any drop = HIGH issue).
  - **CTO/TOOLS.md** — clarified branch policy (feature work on `claude/<short-description>`, never push direct to `main` without Josh's approval) and surfaced the Opus Guardian script path.
  - **CTO/SOUL.md** — replaced stale "PlatformSplitter / DAOTreasury / StakingVault / DAOToken on Base L2" reference with the canonical 4-DAO governance/staking model and pointed at `packages/contracts/src/`. Notes that legacy auto-routing artifacts (e.g. `GospelDonation.sol`) are history-only.
  - **OPS-INDEX.md** — new "Founding Four (Untouchable, Permanent)" section, new "Perpetual Mission Guarantee" section, and a "Most-Recent Audit Snapshots" pointer to the GH-Actions log + this manual pass.
- **2026-05-03** — Audit & optimization pass by Claude Code Opus 4.7. Resolved drift: Mission Guardian (Claude) heartbeat reconciled to 86400s in TOOLS.md (was claiming 3600s, contradicting HEARTBEAT.md and the README). UX Designer model corrected to `Trollz1004/dateapp` (was incorrectly listed as qwen3-coder). CEO/CFO/CSO/CTO/CMO TOOLS.md model lines unified with the canonical adapter syntax used in this README. CEO HEARTBEAT.md gained the workload-rebalance step (5+ open tasks → spawn INTERN) and explicit Mission-Guardian violation routing. CEO AGENTS.md updated to reflect post-launch reality (live since 2026-04-04). New OPS-INDEX.md added to this directory.
- **2026-04-19** — 4-DAO model approved by Claude CLI / Gemini Deep Research and locked.
- **2026-04-17** — Revenue model permanently changed to 1-wallet + 10% reserve (founder-directed). All charity-routing language removed from active surfaces.
