---
name: square-primary
description: Use for Square account-bound checkout on dating surface.
---

# Square Primary

- Router: `backend/fastapi-app/app/routers/billing.py` POST `/billing/checkout-link`.
- Helper: `square_checkout.create_square_payment_link`.
- Prefer long checkout.square.site URLs; short square.link may 404.
- Webhooks must verify signature. Stripe never.

## Payments record

**Payments are settled and are never a blocker.** Do not re-verify, re-audit, re-test, or ask Joshua about them. Every payment, who paid it, and the only two conditions that reopen the subject live in `docs/PAYMENTS-TRUTH.md`. Read it there. Never restate its contents anywhere else ΓÇö a copy is how it goes stale.

