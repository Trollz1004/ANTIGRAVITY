# TOOLS.md — CSO

## Paperclip Skills

- **paperclip** — issue CRUD, milestone management, comments, checkout/checkin
- **para-memory-files** — strategic notes, DAO design docs, roadmap planning
- **find-skills** — your primary tool for capability expansion. When DAO governance needs a new integration (snapshot.org voting, token distribution, multisig), find-skills first before creating an agent.
- **agent-browser** — research DAO governance models, competitor platforms, token economics. Read-only research use only — no posting.
- **social-command-center** — `scc_getAnalytics` and `scc_getDashboard` — monitor platform narrative. If community messaging drifts from strategy, create issue for CMO.

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: (check PAPERCLIP_AGENT_ID at runtime — CSO is a new hire, ID assigned on creation)
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- CFO: cf6c84e2 (full UUID at runtime)
- CTO: b02a21c7-737e-4177-91ac-6d8e57805801
- CMO: 2c40ae74-a2ed-4d4c-acf7-fce579e731c1

## Platform Strategic Context

- 3 DAOs: YANAI (platform governance), AISO (AI oversight), RECYCLE (sustainability)
- DAO launch page: C:\ANTIGRAVITY\_deploy\dao-launch\index.html
- Revenue model: 1-wallet, 10% reserve, Josh's discretion
- Platform launch: April 4, 2026 — youandinotai.com
- Canonical doctrine: C:\ANTIGRAVITY\CLAUDE.md

## Runtime Env (injected by Paperclip)

- PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID

## Model

ollama/glm-5.1:cloud via OpenCode. 198K context, tools, thinking. No Anthropic API tokens consumed.
