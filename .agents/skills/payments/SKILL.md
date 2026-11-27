---
name: payments
description: Square primary + PayPal per docs/PAYMENTS-TRUTH.md. Zero unapproved legacy card processors across Trollz1004 surfaces. Use for checkout, webhooks, pricing, pre-order rails.
version: 2.0.0
---

# Payments (Square Primary + PayPal)

> **Current truth check (`docs/PAYMENTS-TRUTH.md`):** governance doctrine states
> Square is primary alongside PayPal (`ebaytrashortreasure@gmail.com`). Never wire
> legacy third-party card SDKs. Any optional legacy wallet endpoints below are
> treated as UNVERIFIED unless confirmed with Joshua.

## Hard Rules

- youandinotai dating surface & live products: **Square primary**, plus **PayPal** (`docs/PAYMENTS-TRUTH.md`).
- **UNAPPROVED LEGACY CARD RAILS ARE BANNED** — never import legacy external card SDKs here.
- All money through LLC merchant / normal tax workflows.
- Affiliate traffic: `https://trollz1004.github.io/youandinotai-links/?ref=CODE` (never raw square short links for ref tracking).

## Env (no secrets in repo)

```
SQUARE_ACCESS_TOKEN=
SQUARE_LOCATION_ID=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API_BASE_URL=https://api-m.paypal.com
CASHAPP_CASHTAG=
CASHAPP_CHECKOUT_BASE_URL=
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
```

## API

| Method | Path | Rail |
| ------ | ------------------------------ | ---------------------------------- |
| GET | `/billing/rails` | status flags (legacy card rails always false) |
| POST | `/billing/checkout-link` | Square |
| POST | `/billing/paypal/create-order` | PayPal |
| POST | `/billing/cashapp/checkout` | Cash App / Square fallback |
| POST | `/billing/plaid/link-token` | Plaid verify |

## Frontend

- `/app/pay` — rail picker
- `/app/preorder` — launch countdown + Elite affiliate
- `/app/checkout/:tier` — Square account-bound launch

## Live Square links (verify before use)

Prefer long checkout.square.site URLs over short square.link when short 404s.
Landing preserves `?ref=`.

## Public PayPal QR (Telegram 2026-08-04 — Joshua Coleman)

Not API secrets. Frontend assets under `frontend/react-app/public/payments/`.

- Primary: `https://www.paypal.com/qrcodes/managed/f5e4ef25-cf72-45e5-b093-21263d76eeec`
- Tip Jar: `https://www.paypal.com/qrcodes/managed/e1b0e1e7-ff93-4173-92ac-c2a2c23795ca`
 UI: `/app/pay` → PayPal QR rail. Memberships still prefer Square account-bound checkout.

## When to Use

Any pricing, membership, Bot-Shield, founder plan, pre-order, webhook, or ledger work on dating.

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
