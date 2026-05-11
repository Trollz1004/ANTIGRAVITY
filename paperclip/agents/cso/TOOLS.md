# TOOLS.md — CSO

## Paperclip Skills

- **paperclip** — issue CRUD, milestone management, comments, checkout/checkin
- **para-memory-files** — strategic notes, DAO design docs, roadmap planning
- **find-skills** — your primary tool for capability expansion. When DAO governance needs a new integration (snapshot.org voting, token distribution, multisig), find-skills first before creating an agent.
- **agent-browser** — research DAO governance models, competitor platforms, token economics. Read-only research use only — no posting.
- **social-command-center** — `scc_getAnalytics` and `scc_getDashboard` — monitor platform narrative. If community messaging drifts from strategy, create issue for CMO.

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: 5d844d41-df24-4a2c-a98f-26bd94be2018
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- CFO: cf6c84e2 (full UUID at runtime)
- CTO: b02a21c7-737e-4177-91ac-6d8e57805801
- CMO: 2c40ae74-a2ed-4d4c-acf7-fce579e731c1

## Platform Strategic Context

- 4 DAOs: $LOVE (YouAndINotAI), $UKID (AI-Solutions), $GREEN (OnlineRecycle), $AGRAV (AiDoesItAll infra)
- 2.5M tokens per DAO, 10M hard cap total
- DAO architecture: C:\ANTIGRAVITY\briefings\DAO-ARCHITECTURE-CANONICAL.md
- Token descriptions: C:\ANTIGRAVITY\briefings\DAO-TOKEN-DESCRIPTIONS-COMPLIANT-2026-04-19.md
- Revenue model: 1-wallet, 10% reserve, Josh's discretion
- Platform launch: April 4, 2026 — youandinotai.com
- Canonical doctrine: C:\ANTIGRAVITY\CLAUDE.md

## Runtime Env (injected by Paperclip)

- PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID

## Model

Adapter: `hermes_local` + `ollama/glm-5.1:cloud` (198K context, tools, thinking, persistent memory, Ollama auto-detect). No Anthropic API tokens consumed.
Fallback: `ollama/qwen3-coder:480b-cloud` if GLM-5.1 unavailable.

> **TOKEN DOCTRINE (2026-05-07):** All PaperClip agents route through Ollama. Claude is reserved for Cowork/Claude Code orchestration only, OpenAI is retired in-platform.
