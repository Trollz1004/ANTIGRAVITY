# INFRA-2 / TRO-15: Income-engine Genspark Playbook Seeding

**Issue:** 33604bc1-0381-4b18-b2bb-31e9d140d455 (TRO-15)
**Status:** done (this heartbeat)
**Agent:** Grok 14a7fdb9-c07a-4904-921b-0374bceec622
**Date:** 2026-07-01

## Objective
Seed Genspark playbook for income engine. Part of Q3 Infrastructure. (Refs TRO-6 / TRO-1 plan.)

## Context
- income-engine/ is archived lead-gen pipeline (lead aggregation/scoring, Manus GUI, Paperclip backend/agents/data). Retained for reference as for-profit stack component.
- Primary surfaces: AI Solutions Store catalog (_deploy/ai-solutions-store/index.html) + TRA marketplace expansion.
- Real products (product-value framing only):
  - BotShield Checkout Guard ($299): bot/fraud defense, receipt-linked records, admin trails. Best first for payment surfaces.
  - Founding Member Stack ($499): core catalog early access + updates.
  - Content Droid Suite ($799): short-form gen, scheduled marketing, analytics loops (+ 3-mo pass).
  - Agent Operations Kit ($999): runbooks, workflows, GitHub/cloud automation (+ 12-mo).
  - TRA tiers: Basic ($99 matching), Verified Trade ($299 BotShield+trust), Pro ($799 tools+calendar), Enterprise (custom), Royalty (lifetime).
- Store value props (public): production-grade AI automation, verified license delivery, premium build quality, receipt-verified keys, implementation passes, support.

All public/customer copy stays strictly product + membership/verification/safety/uptime/access (per doctrine). Internal seeds avoid non-product framing.

## Work (smallest)
- Inspected income-engine/README (archived), TRO-9 revenue status (AIS + TRA-1 stub), live catalog HTML for exact names/tiers/pricing/value props.
- Created playbook seed artifacts focused on generating **product assets** (explainers, social, landing sections, nurture, lead magnets) for the catalog + TRA:
  - briefings/income-engine-genspark-playbook-seed.json (8 ready queries + metadata).
  - This briefing.
- Seeded to Pieces MCP (durable mission-mcp LTM checkpoint).
- Minimal discoverability note appended to apps/income-engine/README.md.
- Verified files present + MCP recorded + issue PATCHed to done.

No code changes to archived pipeline. No public surface edits. No full builds.

## Playbook Usage
Feed the queries (or variations) to Genspark / equivalent content gen. Outputs can feed:
- X/Reddit/Discord posts (see prior cadence seeds)
- Landing/TRA section refreshes
- Email nurture for catalog buyers
- Lead-gen angles for income-engine pipeline
- Feature spotlights (BotShield trust layer, Content Droid velocity, Agent runbooks, verified TRA matching)

Tags / categories included for filtering.

## Artifacts
- briefings/income-engine-genspark-playbook-seed.json
- briefings/income-engine-genspark-playbook-TRO15.md (this)
- apps/income-engine/README.md (tiny ref note)
- Pieces memory record (files + full context)

## Disposition
PATCH /api/issues/... status=done + comment with links. Session memory appended. Smallest verif only.

## Next (delegated if needed)
- Expand playbook with 20+ variants or category-specific (e.g. BotShield only).
- Wire income-engine agents to auto-submit top queries.
- Integrate generated assets into ai-solutions-store or marketing calendars.
- When prioritized, move income-engine out of archived or connect to live revenue surfaces.
