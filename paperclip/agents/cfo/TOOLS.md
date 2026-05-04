# TOOLS.md — CFO

## Paperclip Skills

- **paperclip** — issue CRUD, comments, checkout/checkin, agent list
- **para-memory-files** — financial notes, reserve tracking, reporting
- **find-skills** — discover financial/reconciliation skills as needed (Square, accounting integrations)
- **social-command-center** — `scc_getAnalytics` only — monitor if any platform post makes financial claims. Flag to CMO immediately if found.

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: cf6c84e2-c37f-492f-9a49-2d5f3c4a56e1
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- CSO: 5d844d41-df24-4a2c-a98f-26bd94be2018
- CTO: b02a21c7-737e-4177-91ac-6d8e57805801
- CMO: 2c40ae74-a2ed-4d4c-acf7-fce579e731c1

## Platform Financial Context

- Square account: joshlcoleman@gmail.com
- Square location: LY5GN09F5AN83 (YouAndINotAI / Trash Or Treasure — ACTIVE)
- Payment products: Bot-Shield $1, Founding Member $14.99/mo, 3-Month $39.99, 12-Month $99.99, Royalty $2,500
- Stripe: LEGACY ONLY — being phased out

## Runtime Env (injected by Paperclip)

- PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID

## Model

Adapter: `hermes_local` + `ollama/glm-5.1:cloud` (198K context, tools, thinking, persistent memory, Ollama auto-detect). No Anthropic API tokens consumed.
Fallback: `ollama/qwen3-coder:480b-cloud` if GLM-5.1 unavailable.
