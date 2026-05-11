# Paperclip Agent Instructions Backup

These are the source-of-truth instruction files for all ANTIGRAVITY Paperclip agents.

If Paperclip's database gets wiped or an agent's instructions get corrupted, restore from here.

## Agent Roster

| Agent | Dir | Adapter / Ollama model | Agent ID | Heartbeat |
|-------|-----|------------------------|----------|-----------|
| CEO | ceo/ | hermes_local / kimi-k2.6:cloud (primary), glm-5.1:cloud (secondary) | c4b4a3d9-8e66-4463-bf65-abfc5037b92a | 30m |
| CFO | cfo/ | hermes_local / glm-5.1:cloud | cf6c84e2-c37f-492f-9a49-2d5f3c4a56e1 | 60m |
| CSO | cso/ | hermes_local / glm-5.1:cloud | 5d844d41-df24-4a2c-a98f-26bd94be2018 | 60m |
| CTO | cto/ | opencode_local / qwen3-coder:480b-cloud | b02a21c7-737e-4177-91ac-6d8e57805801 | 30m |
| CMO | cmo/ | opencode_local / Trollz1004/dateapp-marketingtools | 2c40ae74-a2ed-4d4c-acf7-fce579e731c1 | 60m |
| UX Designer | uxdesigner/ | opencode_local / Trollz1004/dateapp | bd6d6722-9f3e-46ba-8651-ec9a219042ee | 60m |
| Mission Guardian (Claude) | mission-guardian-claude/ | kimi-k2.6:cloud via Ollama (rerouted 2026-05-07) | 2229682b-cede-4462-b38b-25a910af022e | 24h |
| Mission Guardian (Codex) | mission-guardian-codex/ | qwen3-coder:480b-cloud via Ollama (rerouted 2026-05-07) | 42200bfa-fb9e-42b1-901d-6dadf15eb23b | 24h |
| INTERN (DoWhatTold) | intern/ | any Ollama cloud (smallest) | (spawned by CEO/CFO) | NONE |
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

## Models (updated 2026-05-11 — Ollama-only inside PaperClip per 2026-05-07 token doctrine)

All PaperClip-resident agents route through Ollama. Anthropic + OpenAI direct API calls are retired inside PaperClip; Claude is reserved for Cowork / Claude Code orchestration sessions only.

- **CEO**: `hermes_local` + `ollama/kimi-k2.6:cloud` primary, `ollama/glm-5.1:cloud` secondary — persistent memory, 30+ tools, Ollama auto-detect. CEO carries a 5-step fallback chain to `korpohermes-prime` and beyond — see `briefings/HERMES-CEO-READY-2026-04-19.md`.
- **CFO / CSO**: `hermes_local` + `ollama/glm-5.1:cloud` (fallback `ollama/qwen3-coder:480b-cloud`).
- **CTO / TechExecutor**: `opencode_local` + `ollama/qwen3-coder:480b-cloud`.
- **CMO**: `opencode_local` + `ollama/Trollz1004/dateapp-marketingtools` (platform-specific; fallback: qwen3-coder).
- **UX Designer**: `opencode_local` + `ollama/Trollz1004/dateapp` (fallback: qwen3-coder).
- **Mission Guardian (Claude)**: `ollama/kimi-k2.6:cloud` (rerouted off Claude API 2026-05-07; agent name retained for continuity).
- **Mission Guardian (Codex)**: `ollama/qwen3-coder:480b-cloud` (rerouted off Codex CLI 2026-05-07; agent name retained for continuity).
- **INTERN**: any cheapest available Ollama cloud model (Gemma 1B is fine — INTERNs do not think).
- Mission Guardians both run daily-only (86400s heartbeat, staggered).

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

- **2026-05-11** — Audit & optimization pass #4 by Claude Code Opus 4.7. Josh delegated full operational control over CEO / Agents / SKILLS-HEARTBEAT-TOOLS and stopped manual edits ("treat it as your own"). The 2026-05-07 token-doctrine reroute had only landed in two files (CEO/TOOLS, MG(Claude)/TOOLS); this pass propagated it fleet-wide and surfaced it as permanent doctrine. Changes:
  - **README.md (this file) — Models section** updated to reflect Ollama-only in-PaperClip routing. CEO primary model corrected to `kimi-k2.6:cloud` (GLM-5.1 became secondary in the 2026-05-07 reroute). Mission Guardian (Claude) row corrected from `claude_local` to `kimi-k2.6:cloud` via Ollama. Mission Guardian (Codex) row corrected from `codex_local` to `qwen3-coder:480b-cloud` via Ollama. Agent display names retained for continuity (the "(Claude)" / "(Codex)" suffixes are historical identifiers, not routing claims).
  - **OPS-INDEX.md — Fleet table** mirrored to the same models. **Doctrine list** gained an 8th permanent rule: PaperClip-resident agents route through Ollama; Anthropic/OpenAI direct calls are retired in-platform; Claude is reserved for Cowork / Claude Code orchestration only. **Paperclip Topology** section added documenting the new 4-company Sabretooth Paperclip instance (TRA / AIS / YOU / MAR companies) so future sessions know the legacy ANTIGRAVITY company is only one of four — agent files here remain scoped to ANTIGRAVITY. **Most-Recent Audit Snapshots** updated with this pass and the 2026-05-07 → 2026-05-11 daily GH-Actions PASS streak.
  - **CEO/TOOLS.md** — direct-reports model column reconciled to match each direct report's own TOOLS.md (CTO=`qwen3-coder:480b-cloud`, UX=`Trollz1004/dateapp`, MG(Claude)=`kimi-k2.6:cloud`, MG(Codex)=`qwen3-coder:480b-cloud`). Branch policy reconciled: previously read `Repo: C:\ANTIGRAVITY, branch: main`, which contradicted both the CTO file and CLAUDE.md — now matches the canonical `claude/<short-description>` feature-branch rule. New **Paperclip Topology** preface added so CEO knows the Sabretooth instance hosts three sibling companies (TRA / AIS / YOU / MAR) and explicitly does not act inside them.
  - **Mission Guardian (Codex) / TOOLS.md** — Adapter section rewritten. The old `codex_local` line referenced an adapter that routed through OpenAI/Anthropic depending on configuration; rerouted to `qwen3-coder:480b-cloud` via Ollama with the same fallback chain pattern as MG(Claude). Token-doctrine note added.
  - **CFO/AGENTS.md** — "Track AI token costs across all adapters (Anthropic, OpenAI, Ollama)" was a stale framing post-2026-05-07. Split into "in-PaperClip = Ollama subscription run-rate (the only thing CFO can enforce)" and "out-of-PaperClip Founding-Four = Claude Code / Gemini / Perplexity / Grok (informational only — Josh runs those directly)." Added an explicit doctrine-violation flag: if Anthropic or OpenAI charges ever reappear tagged to a PaperClip run, that is URGENT.
  - **CFO/HEARTBEAT.md** — step 4 token-cost line updated to match the new framing. >20% run-rate trigger preserved.
  - **CFO/TOOLS.md + CSO/TOOLS.md** — token-doctrine notes added below the Model section so reading either file is enough to know the rule.
  - **INTERN/AGENTS.md** — Facebook idle-engagement interest list swapped `charity` → `philanthropy` (the canonical-7 forbidden term was present even in agent-internal copy describing which groups to *engage* with — low risk but not worth keeping). Forbidden-language list at the bottom expanded from 4 terms (`donate, donation, solicitation, charity`) to the canonical 7 (`donate, donation, solicitation, charity, charitable, giving back, disbursement`) plus an explicit rule that even the agent-internal synonym `contractual revenue disbursement` is forbidden in comments INTERN posts (it's an internal-copy-only phrase, and INTERN comments are customer-facing by nature).
- **2026-05-07** — Token doctrine landed (Josh hard rule). Commit `4c62fc5` rerouted Mission Guardian (Claude) off Claude Code CLI onto `kimi-k2.6:cloud` via Ollama, and rebuilt the CEO failover-adapter chain to drop Anthropic. Stated rule: "Claude is reserved for Cowork / Claude Code orchestration only — never inside PaperClip." The 2026-05-11 pass above propagated this to the rest of the fleet that the original commit didn't touch (MG(Codex), CFO scope, CSO note, fleet docs).
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
