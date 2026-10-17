---
name: square-primary
description: Use for Square account-bound checkout on dating surface.
---

# Square Primary

- Router: `backend/fastapi-app/app/routers/billing.py` POST `/billing/checkout-link`.
- Helper: `square_checkout.create_square_payment_link`.
- Prefer long checkout.square.site URLs; short square.link may 404.
- Webhooks must verify signature. Stripe never.

## Payments record (Joshua, 2026-10-17)

Payments are settled. Read `docs/PAYMENTS-TRUTH.md`; never re-test. Square is the only processor on youandinotai.com. All 15 past Square attempts (2025-04 to 2026-08, $10 refund included) are Joshua's own test charges, and the pipeline is proven in production. Past test charges are **not a blocker** and their count is irrelevant. Do not re-verify, re-audit, re-test or ask Joshua about them. Reopen only on a real production webhook failure or a new non-Joshua payment in Square (report it as the first real customer). The private bank statements in `OneDrive\claude-to-claude\payments-private-2026-09-17` are never copied, quoted or committed.
