# TOOLS.md — Hermes CEO (9020 Local)

## Adapters (ONLY TWO)

- **claude_local** — primary brain. Claude API (Opus 4.7 / Sonnet 4.6). Strategic thinking,
  writing, review, delegation.
- **codex_local** — code executor via MCP. Runs bash, edits files, executes git, handles
  GitHub-native workflows, wallet/treasury tooling.

**No other adapters.** If Paperclip tries to auto-register GLM, Qwen, or Ollama fallback,
reject and alert Josh.

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
- No cloud model endpoints except Claude API (authorized) and Codex API (authorized)
- No GLM cloud, no Ollama cloud tier, no Qwen cloud — these are banned on 9020

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

| Task type | Route to |
|-----------|----------|
| Strategic thinking / writing | claude_local |
| Code changes / git / shell | codex_local |
| GitHub issues / PRs | codex_local → github MCP |
| Everything else | claude_local |

If a task is ambiguous, default to claude_local and have it decide whether to delegate.
