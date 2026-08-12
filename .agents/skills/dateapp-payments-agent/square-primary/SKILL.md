---
name: square-primary
description: Use for Square account-bound checkout on dating surface.
---

# Square Primary

- Router: `backend/fastapi-app/app/routers/billing.py` POST `/billing/checkout-link`.
- Helper: `square_checkout.create_square_payment_link`.
- Prefer long checkout.square.site URLs; short square.link may 404.
- Webhooks must verify signature. Stripe never.
