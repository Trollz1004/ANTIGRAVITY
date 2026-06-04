# LIVE PAYMENT SOURCE OF TRUTH

Last updated: 2026-04-10

## Authority

Use this file with `AGENTS.md` as the current live payment truth for LLC-controlled operations.

If any older doc, node note, export, or backup conflicts with this file:
- `AGENTS.md` wins first
- this file wins second
- stale Stripe, Railway, Azure, or legacy launcher docs lose

## Current Live Rail

- Primary live payment rail: **Square only**
- Square account: `joshlcoleman@gmail.com` (all lanes — YouAndINotAI and commerce)
- Active Square location: `LY5GN09F5AN83`
- Customer-facing payment copy must stay business-first and must not use `donate`, `donation`, or `solicitation`

## Verification-Grade Payment Truth

- Bot-Shield verification promotion is **fail-closed**
- Verification-grade payment completion is only authoritative on Square `payment.created` or `payment.updated` when the embedded Square payment status is `COMPLETED`
- Bot-Shield requires a valid signed `checkout_ref` that binds the same user and the same passed liveness event
- Email lookup, customer lookup, or loose payment matching may support bookkeeping or operator logging only
- Email lookup, customer lookup, or loose payment matching must **never** create a verification `challenge_type="payment"` event
- If `checkout_ref` is missing, invalid, expired, tampered, mismatched, or detached from the bound liveness event, the webhook may be recorded but verification must not be promoted
- Every authoritative Square `payment.completed` event now creates an internal `revenue_allocations` ledger row when the amount is positive
- The ledger reserves exactly `10%` of gross platform payment revenue, rounded up to whole cents, into the `kids_support` beneficiary lane with status `reserved`
- For a `$1.00` Bot-Shield payment, the required reserved allocation is `10` cents and the operating amount is `90` cents
- This ledger is internal accounting proof only; it does not claim that an external charitable disbursement has already been sent until `status` is updated through a verified payout/reconciliation path

## Catalog Drift Guard

- Live YouAndINotAI tier mapping is restricted to these exact payment amounts:
  - `1.00`
  - `14.99`
  - `39.99`
  - `99.99`
  - `2500.00`
- Stale Square catalog artifacts such as `9.99`, `19.99`, and `29.99` remain drift indicators, not live tier truth
- `square_catalog.json` was refreshed from a real live Square export on 2026-03-19, but it remains informational only and does not override runtime tier guards

## Health / Readiness Truth

- Health output must distinguish:
  - Square API/config readiness
  - Square webhook signature verification configured
  - wallet rails proven in this runtime
  - wallet rails unproven in this runtime
- Wallet rails must not be reported as proven unless runtime evidence exists from observed payment proof labels

## YouAndINotAI Checkout Links

| Product | Square Link |
|---|---|
| Bot-Shield $1 | `https://square.link/u/Qc5mxUy7` |
| Founding Member $14.99/mo | `https://square.link/u/cxwjcn0s` |
| 3-Month Founder $39.99 | `https://square.link/u/oY7qEfRM` |
| 12-Month Founder $99.99 | `https://square.link/u/6GHpbvvl` |
| Royalty Card $2,500 | `https://square.link/u/CafhorUS` |

## OnlineRecycle Square Surfaces

- Booking widget: `https://book.squareup.com/appointments/buyer/widget/LY5GN09F5AN83/services`
- Square storefront: `https://onlinerecycle.square.site/`

## Legacy Payment Status

- Stripe is **legacy only**
- Do not add new Stripe checkout flows
- Do not let old Stripe references override Square-first live reality

## Operational Rules

- API keys, webhook secrets, and tokens live in `.env`, local secret stores, or platform secret managers only
- No raw payment secrets in git
- Historical chain truth belongs to `briefings/HISTORICAL-ONCHAIN-STATUS.md`
- Customer-facing payment claims must stay truthful to the currently live Square flow



## ACTIVE SQUARE APPLICATIONS (Updated 2026-03-23)

- **PRIMARY (joshlcoleman):** #ForTheKids (sq0idp-Carv59GQKuQHoIydJ1Wanw)
  - Status: ACTIVE & AUTHORIZED
  - Purpose: All Square lanes — OnlineRecycle.org, Ai-Collab4Kids, Merch Shop, YouAndINotAI
  - Location: Trash or Treasure (LTDX6ZANTVEEN)

- **BLACKLISTED / DO NOT USE:**
  - u-annd-a-i-not-a-i.online (sq0idp-O4K4lNKXVSQoWdfgczv17Q)
  - Status: DEPRECATED - DO NOT ROUTE TRAFFIC

## Active Production Payment Webhook (Updated 2026-04-10)

- Name: YouAndINotAI Bot-Shield Payments
- Subscription ID: `wbhk_a2022ac6b20043a5a3bc2d43bbca0f1b`
- Status: Enabled
- API version: `2026-01-22`
- URL: `https://api.youandinotai.com/api/v1/webhooks/square-payment`
- Events:
  - `payment.created`
  - `payment.updated`
  - `subscription.created`
  - `subscription.updated`
- Runtime secret requirements:
  - `SQUARE_WEBHOOK_SIGNATURE_KEY`
  - `SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY`
  - `SQUARE_WEBHOOK_NOTIFICATION_URL`
  - `SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL`
  - `SQUARE_WEBHOOK_VERIFY_SIGNATURE=true`

The signature key is stored only in local vault/env, GitHub secrets, or platform secret managers.
It must never be committed to source or pasted into chat.
GitHub currently stores the key in existing secret `SQUARE_WEBHOOK_SIGNATURE_KEY`; the Cloud Run
deploy workflow mirrors that same value into runtime env `SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY`.
