---
name: payments
description: Square primary + PayPal + Cash App Business + Plaid verify for dating surface. Stripe banned on youandinotai. Use for checkout, webhooks, pricing, pre-order rails.
version: 2.0.0
---

# Payments (Dating Surface — Multi-Rail, No Stripe)

> **Current truth check (2026-09-03 fact sheet):** governance doctrine states
> "Date App is Square only (never Stripe)." This file's multi-rail design
> (Square + PayPal + Cash App + Plaid) below predates that and has not been
> independently re-confirmed in this audit — treat PayPal/Cash App/Plaid rails
> as UNVERIFIED against current doctrine and confirm with Joshua before relying
> on them; Stripe stays banned either way.

## Hard Rules

- youandinotai dating surface: **Square primary**, plus **PayPal**, **Cash App Business**, **Plaid** (verification).
- **STRIPE IS BANNED** on dating — AUP + founder iron wall. Never import stripe SDK here.
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

| Method | Path                           | Rail                               |
| ------ | ------------------------------ | ---------------------------------- |
| GET    | `/billing/rails`               | status flags (stripe always false) |
| POST   | `/billing/checkout-link`       | Square                             |
| POST   | `/billing/paypal/create-order` | PayPal                             |
| POST   | `/billing/cashapp/checkout`    | Cash App / Square fallback         |
| POST   | `/billing/plaid/link-token`    | Plaid verify                       |

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
