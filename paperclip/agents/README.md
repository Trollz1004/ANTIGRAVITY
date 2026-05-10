# Paperclip Agent Instructions Backup

These are the source-of-truth instruction files for all ANTIGRAVITY Paperclip agents.

If Paperclip's database gets wiped or an agent's instructions get corrupted, restore from here.

## Agent Roster

| Agent | Dir | Adapter | Agent ID | Heartbeat |
|-------|-----|---------|----------|-----------|
| CEO | ceo/ | hermes_local / glm-5.1:cloud | c4b4a3d9-8e66-4463-bf65-abfc5037b92a | 30m |
| CFO | cfo/ | hermes_local / glm-5.1:cloud | cf6c84e2-c37f-492f-9a49-2d5f3c4a56e1 | 60m |
| CSO | cso/ | hermes_local / glm-5.1:cloud | 5d844d41-df24-4a2c-a98f-26bd94be2018 | 60m |
| CTO | cto/ | opencode_local / qwen3-coder | b02a21c7-737e-4177-91ac-6d8e57805801 | 30m |
| CMO | cmo/ | opencode_local / dateapp-marketingtools | 2c40ae74-a2ed-4d4c-acf7-fce579e731c1 | 60m |
| UX Designer | uxdesigner/ | opencode_local / dateapp | bd6d6722-9f3e-46ba-8651-ec9a219042ee | 60m |
| Mission Guardian (Claude) | mission-guardian-claude/ | kimi-k2.6:cloud via Ollama (rerouted 2026-05-07; was claude_local) | 2229682b-cede-4462-b38b-25a910af022e | 24h |
| Mission Guardian (Codex) | mission-guardian-codex/ | codex_local (Ollama-routed; daily-cap budget) | 42200bfa-fb9e-42b1-901d-6dadf15eb23b | 24h |
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

## Models (updated 2026-05-03)

- CEO / CFO / CSO: `hermes_local` + `ollama/glm-5.1:cloud` — persistent memory, 30+ tools, Ollama auto-detect. CEO carries a 5-step fallback chain to `korpohermes-prime` and beyond — see `briefings/HERMES-CEO-READY-2026-04-19.md`.
- CTO / TechExecutor: `opencode_local` + `ollama/qwen3-coder:480b-cloud`
- CMO: `opencode_local` + `ollama/Trollz1004/dateapp-marketingtools` (platform-specific; fallback: qwen3-coder)
- UX Designer: `opencode_local` + `ollama/Trollz1004/dateapp` (fallback: qwen3-coder)
- Mission Guardian (Claude): `kimi-k2.6:cloud` via Ollama (rerouted 2026-05-07 per token doctrine — Claude API reserved for Cowork/Claude Code orchestration only). Fallback: `qwen3-coder:480b-cloud` → `glm-5.1:cloud` → `qwen2.5:7b` (local). Daily audit only (86400s heartbeat).
- Mission Guardian (Codex): `codex_local` — daily-cap budget on audit work only. Daily audit only (86400s heartbeat, staggered offset from Claude Guardian).
- INTERN: any cheapest available Ollama cloud model (Gemma 1B is fine — INTERNs do not think)

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

- **2026-05-10** — Audit & optimization pass #4 by Claude Code Opus 4.7 (Josh delegated full operational control over CEO / Agents / SKILLS-HEARTBEAT-TOOLS; "treat it as your own"; said all manual edits are stopped). Branch: `claude/charming-einstein-59bRe`. Drift reconciled fleet-wide:
  - **README.md (this file) — Agent Roster + Models** — Mission Guardian (Claude) updated from `claude_local` to `kimi-k2.6:cloud` via Ollama (the 2026-05-07 token doctrine rerouted Claude Code CLI off the Claude API; the agent's own TOOLS.md was already correct, but the roster/Models section was stale). Mission Guardian (Codex) clarified as `codex_local` daily-cap budget. Fleet now has one canonical model story across README → OPS-INDEX → individual agent files.
  - **OPS-INDEX.md — fleet table** — Same Mission Guardian model fix.
  - **CEO/TOOLS.md — Direct Reports table** — Model column was inaccurate (CTO listed as `kimi-k2.6:cloud`, UX Designer as `kimi-k2.6:cloud`, MG-Codex as `qwen3-coder:480b-cloud`). Reconciled with each agent's own TOOLS.md: CTO=`opencode_local + qwen3-coder:480b-cloud`, UX=`opencode_local + Trollz1004/dateapp`, MG-Claude=`kimi-k2.6:cloud via Ollama` (per token doctrine), MG-Codex=`codex_local`. Branch line expanded from "main" to the canonical feature-branch policy (`claude/<short-description>`, never push direct to `main`).
  - **CEO/SOUL.md** — Customer-facing language ban expanded from 2 example terms (`donate`, `donation`) to the canonical 7. Brings CEO/SOUL into sync with CMO/UX/CTO/CFO/Mission Guardian SOULs.
  - **CEO/HEARTBEAT.md step 6** — Forbidden-language scan expanded from 4 terms (`donate`, `donation`, `solicitation`, `charity routing`) to canonical 7 with the agent-internal `contractual revenue disbursement` allow-list note.
  - **CSO/AGENTS.md** — Revenue-model section expanded with the canonical 7 + FL §496.405 framing + agent-internal allow-list note. Previously only said "no charity claims" without enumerating.
  - **CSO/HEARTBEAT.md** — New step 4: forbidden-language scan on public-facing roadmap artifacts (DAO launch page, public roadmap, governance announcement). Renumbered downstream steps.
  - **CSO/SOUL.md** — Customer-facing 7-term ban explicitly enumerated.
  - **CTO/HEARTBEAT.md** — New step 6: forbidden-language scan when frontend / public-API surface changed since last beat. CTO ships strings to users; previously had Opus Guardian (security) + CI scans but no explicit language scan in the beat. Catches drift before PR merges.
  - **INTERN/AGENTS.md** — "Revenue Language" section expanded from 4 terms to canonical 7 + explicit ban on the agent-internal synonym (INTERNs never use the synonym either, since they post to public surfaces).
  - **GitHub Auditor/AGENTS.md** — "What It Checks" updated: enumerates the canonical 7 with agent-internal allow-list note; mentions SKILLS.md (CEO-only) in agent-file completeness; adds the privilege-escalation / self-modification check that the workflow already runs.
  - Net effect: every fleet file now uses the same 7-term customer-facing ban, the same `contractual revenue disbursement` agent-internal allow-list, and the same Mission Guardian model story. Daily GitHub Actions audit is unaffected (all required files still present).
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
