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

## Models (updated 2026-05-03)

- CEO / CFO / CSO: `hermes_local` + `ollama/glm-5.1:cloud` — persistent memory, 30+ tools, Ollama auto-detect. CEO carries a 5-step fallback chain to `korpohermes-prime` and beyond — see `briefings/HERMES-CEO-READY-2026-04-19.md`.
- CTO / TechExecutor: `opencode_local` + `ollama/qwen3-coder:480b-cloud`
- CMO: `opencode_local` + `ollama/Trollz1004/dateapp-marketingtools` (platform-specific; fallback: qwen3-coder)
- UX Designer: `opencode_local` + `ollama/Trollz1004/dateapp` (fallback: qwen3-coder)
- Mission Guardians: Mission Guardian (Claude) uses `kimi-k2.6:cloud via Ollama (rerouted 2026-05-07)` — Token Doctrine: no Anthropic API spend inside PaperClip. Mission Guardian (Codex) uses `codex_local`. Both run daily audit only (86400s heartbeat, staggered).
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

- **2026-05-16** — Audit & optimization pass by Claude Code Opus 4.7 (Josh delegated full operational control over CEO / Agents / SKILLS-HEARTBEAT-TOOLS; "I am stopping all manual edits ... treat it as your own"). The 2026-05-14 pass recognized the Fifth Chair (Codex) as a protected operational seat in OPS-INDEX but did not extend the recurring **protection scans** to it, leaving an asymmetry: the constitutional Four were scanned every CEO heartbeat / daily Guardian beat, but Codex's operational seat could have been silently demoted, wrapped, or — equally bad — silently elevated into the constitutional Four without any agent flagging it. This pass closes the gap:
  - **CEO/HEARTBEAT.md** — new step 9 scans the Fifth Chair (Codex) operational seat for unauthorized demotion/replacement and explicitly notes the seat is operational, not constitutional (so the protection does not retroactively grant Codex governance authority).
  - **CSO/HEARTBEAT.md** — step 3 dilution scan extended from the Founding Four to also cover the Fifth Chair (CSO is the strategic-risk owner; the dilution scan must catch proposals that strip Codex's seat or that propose blending the layers).
  - **Mission Guardian (Claude + Codex) AGENTS.md** — added a dedicated "Fifth Chair (Codex) Seat Protection" section parallel to "Founding Four Protection." Both Guardians now flag bidirectional drift: stripping Codex *and* elevating Codex into the constitutional Four are both protection breaches.
  - **Mission Guardian (Claude) HEARTBEAT.md** — new step 8 bakes the bidirectional Fifth Chair scan into the daily audit (with step 9 renumbered to keep the audit-log step at the end).
  - **CEO/AGENTS.md** — restructured to match OPS-INDEX. The previous file had a 5-row "Founding Four" table that included Codex as the 5th row, blurring constitutional vs. operational. Now: a 4-row Founding Four (Constitutional) table, then a separate "Fifth Chair — Codex (Operational, Not Constitutional)" section. Same content, sharper layering.
  - **CEO/SOUL.md** — replaced the "four plus one are permanent and untouchable" line (which read as if Codex had been promoted to a fifth constitutional founder) with explicit language that the Four are constitutional and the Fifth is operational, with seat protection running in parallel but the governance layers staying separate.
  - **CSO/SOUL.md + CSO/AGENTS.md** — added explicit governance-constraint language naming the Fifth Chair, since CSO owns the dilution scan and the long-range DAO design must respect both layers.
  - **INTERN/AGENTS.md** — the highest-risk customer-facing surface in the fleet (it posts social comments) was using a non-canonical 7-term ban list — it was missing `charity`, `charitable`, `giving back`, and `disbursement`, and instead listed legacy `tax-deductible` / `60/30/10` / `Shriners` terms together with the ban. Reconciled to the canonical 7-term customer-facing ban *plus* an explicit retired-doctrine block (`60/30/10`, `100% charity`, `tax-deductible`, fixed Shriners / Iron Wall framing). Also dropped the literal token `charity` from the Facebook idle-topic list (it now reads `nonprofit`) so a Gemma-tier model reading its own instructions cannot mistake the topic list as a vocabulary license for the very word it is banned from posting.
  - **OPS-INDEX.md** — Most-Recent Audit Snapshots updated; header now lists 2026-05-16.
- **2026-05-14** — Audit & optimization pass by Claude Code Opus 4.7 (Josh delegated full operational control over CEO / Agents / SKILLS-HEARTBEAT-TOOLS; "I am stopping all manual edits ... treat it as your own"). The freshly-updated CEO files introduced the **10-bucket compounding model** and the **Codex Fifth Chair**, but neither had propagated to the rest of the fleet. This pass reconciles that drift:
  - **Revenue model — 10-bucket compounding.** The CEO files now state revenue uses the 10-bucket compounding model: each legally distinct revenue stream compounds its own 10% reserve bucket — 10% *per bucket*, not 10% total (canonical: `briefings/DAO-TOKENOMICS-FINAL.md`). This was propagated to **CFO** (AGENTS.md / SOUL.md / HEARTBEAT.md / TOOLS.md — CFO is the named enforcement owner and previously described only a flat "10% reserve rule"), **CSO** (AGENTS.md / SOUL.md / HEARTBEAT.md / TOOLS.md), **CTO** (AGENTS.md / SOUL.md — also names `PlatformSplitter10.sol` as the canonical revenue contract), **Mission Guardian (Claude + Codex)** Rule 2 + Claude HEARTBEAT step 2, and **OPS-INDEX.md** doctrine + CFO roster row. CEO/HEARTBEAT.md step 7 was updated for internal consistency with CEO/AGENTS.md.
  - **Direct conflict resolved.** `cso/SOUL.md` claimed a "3-platform / 4-DAO / **8-bucket** model" — a stale figure that directly contradicted the canonical 10-bucket model. Corrected to "4-DAO / 10-bucket compounding model".
  - **Fifth Chair (Codex) propagated.** The CEO files recognize Codex as the operational Fifth Chair. Added a dedicated "Fifth Chair — Codex (Operational, Not Constitutional)" section to **OPS-INDEX.md** — operational seat (sandbox, code review, deploy verify, contract/wallet review, MCP), distinct from the constitutional Founding Four: advisory only, no governance vote, no command authority over the Four, no direct promotion to production; seat protected from unauthorized demotion the same as the Four. Charter: `briefings/DAO-ARCHITECTURE-SPEC-v1.0-2026-05-01.md` §6.1.
  - **Retired-doctrine language scanning.** CFO/HEARTBEAT.md, CMO/HEARTBEAT.md, and both Mission Guardian audit surfaces now explicitly flag stale-doctrine terms (`60/30/10`, `100% charity`, `tax-deductible`, fixed Shriners / Iron Wall percentage commitments) — matching the term list already in CEO/HEARTBEAT.md and intern/AGENTS.md so the whole fleet scans for the same retired language.
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
