# Date App Self-Host And Ops Funding Directive - 2026-06-19

**Authority:** Joshua Coleman
**Status:** Current date-app lane directive
**Scope:** YouAndINotAI / date app only

## Purpose

This briefing separates the immediate date-app ops funding lane from the later multi-platform DAO/token stack. The date-app lane is a live LLC operations sale path. Do not block it behind the future legal-heavy launch requirements for AI-Solutions, Business Exchange, OnlineRecycle, or the older multi-DAO architecture drafts.

## Current Runtime Direction

- Self-host the date app backend to reduce GCR / Cloud Run friction.
- T5500 is the public front door for tunnels, domains, payments, and date-app public traffic.
- Sabretooth remains the brain for Paperclip, GPU Ollama, and orchestration.
- 9020 remains pure dev.
- The backend source is `backend/fastapi-app`.
- The static date-app surface is `apps/youandinotai-static`.
- The self-host Docker path is `backend/fastapi-app/Dockerfile` plus `backend/fastapi-app/docker-compose.yml`.
- Supabase is the primary database anchor via `SUPABASE_DB_URL`; local Postgres is fallback/dev-only.
- The hosted Cloud Run path can remain a fallback until the T5500 path is verified healthy.
- If cash flow requires a temporary bridge before T5500 is fully verified, use a portable runtime path only:
  Supabase for data, Cloudflare Pages for static/public pages, and Replit or Render only as a replaceable FastAPI host.
  Do not make a bridge host the source of truth.

## Founder Revenue Waterfall For Date-App Ops Lane

For date-app public sale proceeds, the operating order is:

1. Taxes, processor settlement obligations, refunds, and required reserves.
2. Founder household and platform survival bills that keep the work alive.
3. Core operating costs: electric, internet, hosting, storage, AI tools, and subscriptions.
4. Dev equipment and hardware upgrades needed to ship faster.
5. One-year prepay target for AI platform access:
   - Claude max tier.
   - Codex max tier.
   - Gemini 20-dollar tier or current equivalent.
   - Perplexity 20-dollar tier or current equivalent.
   - Grok business / personal access at the current monthly tier or equivalent.
6. One-year prepay target for electric and core infrastructure costs where practical.
7. Founder compensation cap: 50,000 dollars per year from existing ANTIGRAVITY code revenue after taxes and expenses.
8. Remaining date-app sale proceeds stay staked for perpetual wheel funding.
9. If AI-Solutions, Business Exchange, and OnlineRecycle cover the founder cap plus expenses after taxes and platform costs, the date-app staking principal remains staked for maximum compounding toward the kids mission.

## Other Platform Lanes

AI-Solutions, Business Exchange, and OnlineRecycle are separate from this date-app directive.

- Those lanes can fund the founder cap and platform costs if they perform.
- Their later DAO/token/legal structures remain future work and should not be launched under this date-app directive.
- OnlineRecycle domain recovery or a fresh domain purchase is a separate operational decision; do not block date-app execution on it.

## Public Copy Boundary

Public sale surfaces for the date app must sell product, membership, access, operations, and platform value.

Do not put these in public date-app sale copy:

- split math
- tax mechanics
- named-beneficiary claims
- public-benefit claims tied to a checkout button
- investment-return promises
- restricted public-benefit wording banned by current repo policy

The 10% kids mission reserve remains internal backend/accounting doctrine. It can be tracked and audited internally, but it is not the public sales hook.

## Agent Rules

- Do not treat date-app ops funding as the same category as the future multi-platform DAO/token stack.
- Do not use old multi-DAO docs to block the date-app public sale lane.
- Do not use this briefing to launch AI-Solutions, Business Exchange, OnlineRecycle, or any future platform token/sale path.
- Date app remains Square-only unless current repo doctrine and Joshua both change it.
- No secrets in git. Local env values belong in local env files or approved vault paths only.

## Self-Host Execution Gate

Before routing public traffic to T5500:

1. Build the backend image from `backend/fastapi-app`.
2. Start the compose stack with local env values for `POSTGRES_PASSWORD`, `JWT_SECRET`, Square variables, Redis, and `SUPABASE_DB_URL` when using Supabase.
3. Verify `GET /health` and `GET /api/v1/health`.
4. Verify `POST /api/v1/auth/register` with an adult test account.
5. Verify Square webhook signature settings before relying on payment reconciliation.
6. Route Cloudflare Tunnel on T5500 only after health and registration checks pass.

This file is execution doctrine for the date-app ops funding lane only.
