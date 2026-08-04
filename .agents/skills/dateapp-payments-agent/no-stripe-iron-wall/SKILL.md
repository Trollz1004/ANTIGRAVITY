---
name: no-stripe-iron-wall
description: Use when auditing dating payment code for Stripe leakage.
---
# No Stripe Iron Wall
- Dating surface must never call Stripe APIs or embed Stripe.js.
- `/billing/rails` always returns stripe:false.
- Non-dating surfaces may use Stripe elsewhere; do not copy into date app.
- Grep ban: `stripe` in `frontend/react-app` and `backend/fastapi-app/app/routers`.
