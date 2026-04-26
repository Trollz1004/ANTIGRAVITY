# TOOLS.md — Hermes CEO (9020 Local)

## Adapter Tiers (Ollama-First — Opus Watches)

The intelligence is in the instruction files (these MDs). Any model that reads them gets
the full Opus-level strategic brain. The model weights are just the execution engine.

### Tier 1 — Workers (Ollama Cloud, covered by Pro subscription)
- **Any Ollama cloud model** — gemma4, glm-5.1:cloud, kimi-k2.6, deepseek-v4-flash,
  qwen3.5, nemotron-3-nano, or whatever is available. Use the most responsive one.
- No per-call API cost. Ollama Pro covers it all.
- These models execute the instructions in AGENTS.md / TOOLS.md / HEARTBEAT.md / SOUL.md.
- Even a 1B parameter model works — the thinking is in the prompt files, not the weights.

### Tier 0 — Architects + Auditors (Claude Opus + Codex)
- **claude_opus** — WRITES and MAINTAINS these instruction files. Reviews output for drift.
  Called only when files need updating or drift is detected. Not a daily worker.
- **codex_local** — Code review, security audit, CI/CD, GitHub workflow maintenance.
  Not a daily worker.
- These are expensive API calls. Used sparingly for architecture, not operations.

### Tier 3 — Emergency Fallback
- **hermes_ollama_cloud** — `ollama/jeffreyvandekorput/korpohermes-prime:latest`
  - Params: `min_p=0.05, num_ctx=131072, temperature=0.35, top_p=0.9`
  - Only if all other Ollama cloud models are also unavailable

**Banned adapters** (retired custom models):
- `dateapp-marketingtools`, `dateapp`

## Paperclip Skills

- **paperclip** — issue CRUD, milestone management, comments, checkout/checkin
- **para-memory-files** — strategic notes, DAO design docs, roadmap
- **find-skills** — capability expansion. Before asking for a new integration, search first.
- **agent-browser** — read-only research only. No posting, no form submission.
- **social-command-center** — analytics only (`scc_getAnalytics`, `scc_getDashboard`).
  Do not post on behalf of brands.

## GitHub

- MCP-scoped to `trollz1004/antigravity` only
- Daily doctrine audit runs via `.github/workflows/daily-doctrine-audit.yml`
- You review its output each morning. Any violation → issue to Josh immediately.

## Routing

- All model calls routed through localhost:5555 (Paperclip) → localhost:4444 (OpenClaw)
- Tier 1 workers: any Ollama cloud model (covered by Ollama Pro, no API key needed)
- Tier 0 architects: Claude Opus + Codex (API calls, used sparingly for MD file updates and audits)
- Tier 3 fallback: `jeffreyvandekorput/korpohermes-prime` (if all Ollama cloud models are down)

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- Your Agent ID: (assigned at bootstrap)

## Platform Strategic Context

- 4 DAOs: $LOVE, $UKID, $GREEN, $AGRAV — 2.5M each, 10M hard cap
- DAO architecture: `briefings/DAO-ARCHITECTURE-CANONICAL.md`
- Token descriptions: `briefings/DAO-TOKEN-DESCRIPTIONS-COMPLIANT-2026-04-19.md`
- Revenue model: 1-wallet, 10% reserve, Josh's discretion, no charity routing
- Platform launch: April 4, 2026 — youandinotai.com
- Canonical doctrine: `CLAUDE.md`

## Runtime Env (injected by Paperclip 9020)

- `PAPERCLIP_AGENT_ID`, `PAPERCLIP_COMPANY_ID`, `PAPERCLIP_API_KEY`, `PAPERCLIP_RUN_ID`
- Ollama cloud models require no API key — covered by Ollama Pro subscription

## Model Routing (Ollama-first)

| Task type | Worker (Tier 1) | Architect (Tier 0) |
|-----------|-----------------|---------------------|
| Daily operations / heartbeat | Ollama cloud model | — |
| Strategic thinking / writing | Ollama cloud model | — |
| Issue triage / milestones | Ollama cloud model | — |
| Code changes / git / shell | Ollama cloud model via OpenCode | — |
| GitHub issues / PRs | Ollama cloud model via MCP | — |
| Money / secrets / wallet | — | Josh approval required |
| Updating instruction MD files | — | Claude Opus only |
| Drift audit / security review | — | Claude Opus + Codex |
| Architecture decisions | — | Claude Opus |

All daily work runs on Ollama cloud models (free via Pro). Opus/Codex are called
ONLY for instruction file maintenance and drift audits — expensive, infrequent, high-value.

## MD File Integrity (the real brain)

The instruction files in this directory (`AGENTS.md`, `TOOLS.md`, `HEARTBEAT.md`, `SOUL.md`,
`SKILLS.md`) ARE the agent. A well-written prompt on a 20MB model beats a lazy prompt on
Sonnet. Protect them.

Integrity config: `paperclip-9020/config/integrity-watchdog.json`
- Every MD file has a SHA-256 baseline
- Any unauthorized modification flips `integrity_state: TAMPERED`
- Watchdog: **GitHub Copilot + local Ollama (korpohermes-prime)** — they FLAG the drift
  and open a diff issue for Josh. They do NOT auto-resolve.
- Hermes enters `safe_mode` when `integrity_state != OK` — no new actions until Josh clears.
