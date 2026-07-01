# Grok Production Stack — Doctrine-Safe Pattern Extract

**Source:** `C:\Users\joshl\OneDrive\DREAM-ONLINE-MMORPG\ai-marketplace-grok-production-main`  
**Extracted by:** CEO runtime (Hermes) on Sabretooth  
**Date:** 2026-07-01  
**Repo:** `Trollz1004/ANTIGRAVITY` on `main`

---

## What this folder was

Grok generated a self-hosted AI services marketplace stack (Docker Compose, Node/Express, Postgres 16, Redis, Qdrant, Nginx, Grafana, Ollama) under a `DREAM-ONLINE-MMORPG` OneDrive path. It included a social date app, business exchange leads marketplace, PC health / tech support subscriptions, and an AI agent marketplace.

---

## Why it is not being merged wholesale

1. **Doctrine conflict.** The README used public charity/split/10%-to-Shriners language, "tax-visible labeling," and `#UNTILnoKIDinNEED`-adjacent framing that violates `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md`.
2. **Second-repo drift.** Placing ANTIGRAVITY work under `DREAM-ONLINE-MMORPG` breaks `SOL.md` §3.2 (one repo, one branch, one root folder).
3. **Docker dependency.** The stack assumes Docker Desktop + WSL2, neither of which is currently enabled on Sabretooth.
4. **Overlap with existing ANTIGRAVITY.** The useful patterns already exist in fragments inside `Trollz1004/ANTIGRAVITY`; the job is to integrate the best ideas, not import another codebase.

---

## Useful patterns to adopt into ANTIGRAVITY

### 1. Cost-destruction routing
- Route high-volume / simple tasks to free or cheap models (Ollama local, OpenRouter free tier).
- Reserve premium reasoning (OpenAI Codex, Claude Opus, Grok) for high-value architecture or complex debugging.
- Already partially implemented via Hermes smart routing. Next step: formalize routing rules in `paperclip/agents/cto/TOOLS.md`.

### 2. Webhook-driven revenue ledger
- Stripe or Square `payment_intent.succeeded` webhook reads `metadata.revenue_source`.
- Calculates internal allocation per bucket and writes to a ledger table.
- **Doctrine fix:** keep the allocation internal; never show charity/split language on receipts or dashboards.
- Reuse existing Supabase project (`jmvgdqomvnkfgknmgwxp`) for the ledger if it survives the superior-to-existing test.

### 3. Swarm kanban / task orchestration
- Multi-step agent tasks tracked in a kanban board.
- Hermes/Paperclip UI is the canonical kanban. Use Paperclip issues/routines as the source-of-truth task board.
- CTO owns the implementation spec if we decide to expose a kanban view.

### 4. Multi-channel status feeds
- Discord/Telegram channels per domain: `#social-date-app`, `#business-exchange-leads`, `#ops-alerts`, `#swarm-orchestration`.
- CMO owns customer-facing channels; CTO/Hermes own ops alerts.
- Any channel automation must use platform-compliant APIs; no scraping or fake engagement.

### 5. Self-hosted service catalog
- Postgres, Redis, Qdrant, Nginx, Grafana, Ollama.
- Only adopt if they beat the current ANTIGRAVITY architecture. Current stack already uses:
  - Supabase Postgres (managed)
  - Paperclip embedded Postgres (local HQ)
  - Cloudflare (T5500) + Port Warp (Sabretooth) for exposure
- Qdrant vector memory is future; flag to CTO when Paperclip is stable.

---

## Patterns to reject

| Grok idea | Why rejected |
|---|---|
| "10% charity buckets" public copy | Violates `NO-CHARITY-NO-SPLIT-DOCTRINE.md`. |
| "tax-visible labeling" | Internal allocation is fine; public tax claims are not. |
| "Shriners donation" claims | Public donation framing is prohibited. |
| Separate `DREAM-ONLINE-MMORPG` project folder | Violates 1-repo/1-branch/1-root rule. |
| Adult/NSFW content gating as a feature | Outside current ANTIGRAVITY scope; reject unless Joshua explicitly scopes. |
| AI agent marketplace commission model | Overlaps with Hermes/OpenClaw/Codex delegation; needs CTO spec before any code. |

---

## Recommended next actions

1. **CFO review:** Decide whether webhook ledger should live in existing Supabase or self-hosted Postgres.
2. **CTO review:** Decide whether Qdrant/Ollama/Grafana stack should be added to `Trollz1004/ANTIGRAVITY` and under what path.
3. **CMO review:** Extract only product-first value props (AI Solutions Store, automation audit, support setup) into campaigns.
4. **Mission Guardian:** Mark the `DREAM-ONLINE-MMORPG\ai-marketplace-grok-production-main` folder for deletion after explicit Joshua approval.

---

**This briefing is canonical.** Any future work that references the Grok production stack must route through this document and the CEO delegation map.
