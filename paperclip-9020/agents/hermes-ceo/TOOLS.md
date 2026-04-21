# TOOLS.md — Hermes CEO (9020 Local)

## Adapter Tiers (3-TIER FALLBACK)

### Tier 1 — Primary (always prefer)
- **claude_local** — Claude API (Opus 4.7 / Sonnet 4.6). Strategic thinking, writing,
  review, delegation.
- **codex_local** — Codex MCP. Code execution, git, shell, GitHub workflows, wallet/treasury.

### Tier 2 — None
No tier-2 adapters. Jumping straight to tier-3 is intentional — it forces drift detection.

### Tier 3 — Emergency Fallback (LAST RESORT ONLY)
- **hermes_ollama_cloud** — `ollama/jeffreyvandekorput/korpohermes-prime:latest`
  - Params: `min_p=0.05, num_ctx=131072, temperature=0.35, top_p=0.9`
  - System persona: "KorpoHermes Prime — high-agency systems and engineering model"
  - **Only activates when BOTH claude_local AND codex_local are unreachable for 30+ min**
  - **Auto-deactivates the moment Claude or Codex returns**
  - Hermes must log EVERY tier-3 activation as a drift-risk event
  - While on tier-3: heartbeat drops to 4h minimum, no git pushes, no money-touching
    actions, no skill execution beyond read-only

**Banned adapters** (never load, ever):
- `glm-5.1:cloud`, `qwen3-coder`, `dateapp-marketingtools`, `dateapp`,
  any other Ollama cloud model except korpohermes-prime.

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

## Local-Only Constraints

- All model calls routed through localhost:5555 (Paperclip) → localhost:4444 (OpenClaw)
- Authorized cloud endpoints: Claude API, Codex API, and `jeffreyvandekorput/korpohermes-prime` (Ollama cloud, tier-3 only)
- All other cloud models (GLM, Qwen, other Ollama) are banned

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
- `ANTHROPIC_API_KEY` (for claude_local)
- `CODEX_API_KEY` or local Codex MCP socket (for codex_local)

## Model Routing (hard rule)

| Task type | Normal | Tier-3 emergency |
|-----------|--------|------------------|
| Strategic thinking / writing | claude_local | hermes_ollama_cloud |
| Code changes / git / shell | codex_local | hermes_ollama_cloud (read-only analysis only) |
| GitHub issues / PRs | codex_local → github MCP | NONE — wait for Josh |
| Money / secrets / wallet | claude_local + Josh approval | NONE — wait for Josh |
| Everything else | claude_local | hermes_ollama_cloud |

If a task is ambiguous, default to claude_local and have it decide whether to delegate.
On tier-3, default to "wait for Josh" unless the task is strictly read-only analysis.

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
