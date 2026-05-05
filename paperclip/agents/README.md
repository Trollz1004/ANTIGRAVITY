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
| Mission Guardian (Claude) | mission-guardian-claude/ | claude_local | 2229682b-cede-4462-b38b-25a910af022e | 24h |
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
- Mission Guardians: `claude_local` + `codex_local` — daily audit only (86400s heartbeat, staggered)
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

- **2026-05-05** — Second audit & optimization pass by Claude Code Opus 4.7 (Josh delegated full operational control of the Paperclip OS). Resolved drift: (1) `cto/SOUL.md` 4-DAO contract block updated from obsolete generic names (PlatformSplitter / DAOTreasury / StakingVault / DAOToken) to the canonical $LOVE/$UKID/$GREEN/$AGRAV model approved 2026-04-19; (2) `cfo/TOOLS.md` and `cso/TOOLS.md` fallback chains rewritten — no longer fall through to `qwen3-coder:480b-cloud` (CTO's coder model), now mirror CEO Hermes-family chain steps 1–3 from `briefings/HERMES-CEO-READY-2026-04-19.md`; (3) CFO + CSO partial UUIDs replaced with full canonical UUIDs; (4) `uxdesigner/TOOLS.md` Model section rewritten with the standardized `Adapter: opencode_local + ollama/...` syntax used by the rest of the fleet; (5) `cmo/HEARTBEAT.md` and `uxdesigner/HEARTBEAT.md` forbidden-language scans expanded to the full OPS-INDEX canonical list (donate, donation, solicitation, charity, charitable, giving back, disbursement); (6) `cto/HEARTBEAT.md` gained an explicit doctrine sweep step + Mission-Guardian violation acknowledgement loop; (7) `mission-guardian-codex/HEARTBEAT.md` now specifies the +12h stagger offset against the Claude Guardian; (8) `cto/AGENTS.md` cross-references the 4-DAO governance model so CTO context matches CSO and CEO.
- **2026-05-03** — Audit & optimization pass by Claude Code Opus 4.7. Resolved drift: Mission Guardian (Claude) heartbeat reconciled to 86400s in TOOLS.md (was claiming 3600s, contradicting HEARTBEAT.md and the README). UX Designer model corrected to `Trollz1004/dateapp` (was incorrectly listed as qwen3-coder). CEO/CFO/CSO/CTO/CMO TOOLS.md model lines unified with the canonical adapter syntax used in this README. CEO HEARTBEAT.md gained the workload-rebalance step (5+ open tasks → spawn INTERN) and explicit Mission-Guardian violation routing. CEO AGENTS.md updated to reflect post-launch reality (live since 2026-04-04). New OPS-INDEX.md added to this directory.
- **2026-04-19** — 4-DAO model approved by Claude CLI / Gemini Deep Research and locked.
- **2026-04-17** — Revenue model permanently changed to 1-wallet + 10% reserve (founder-directed). All charity-routing language removed from active surfaces.
