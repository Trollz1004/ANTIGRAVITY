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

## Payments record (Joshua, 2026-10-17)

Payments are settled. Read `docs/PAYMENTS-TRUTH.md`; never re-test. Square is the only processor on youandinotai.com. Of the 16 Square attempts through 2026-08-16, 15 are Joshua's own test charges (the $10 refund included) and one is a $1.00 charge on 2026-02-17 (receipt T14t, second location) from a buyer Joshua does not know. On 2026-09-18 two $1.00 Bot-Shield charges (receipts b3FM and v1nS) were paid by Heather, a friend Joshua asked to be the first customer he arranged: a real third-party card. So never say there are no outside payments, and never present Heather's as organic demand. The buyer of T14t is unidentified: never call that one a friend, a test or demand. The pipeline is proven in production. Past test charges are **not a blocker** and their count is irrelevant. Do not re-verify, re-audit, re-test or ask Joshua about them. Reopen only on a real production webhook failure or a payment from a buyer not already listed in the record (report it, do not re-verify). The private bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are never copied, quoted or committed.

Account emails (Joshua, 2026-10-23): `ebaytrashortreasure@gmail.com` is the older, established email the Date App needs; it signs in to exactly two merchant accounts, Square and PayPal. Every other account and service uses `joshlcoleman@gmail.com`. Rule: `CLAUDE.md`, section "Account mapping".
