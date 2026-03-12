# LIVE PAYMENT SOURCE OF TRUTH

Last updated: 2026-03-12

## Authority

Use this file with `AGENTS.md` as the current live payment truth for ENIGMA-side operations.

If any older doc, node note, export, or backup conflicts with this file:
- `AGENTS.md` wins first
- this file wins second
- stale Stripe, Railway, Azure, or legacy launcher docs lose

## Current Live Rail

- Primary live payment rail: **Square only**
- Square account: `ebaytrashortreasure@gmail.com`
- Active Square location: `LY5GN09F5AN83`
- Customer-facing payment copy must stay business-first and must not use `donate`, `donation`, or `solicitation`

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
- Revenue split truth belongs to `briefings/PROTOCOL-OMEGA-ONCHAIN-STATUS.md`
- Customer-facing payment claims must stay truthful to the currently live Square flow
