---
name: health-verify
description: Use for hard verification of date app and payments (not claim-only).
---

# Health Verify

- Frontend: dev server loads /app/create /app/preorder /app/pay /app/avatar
- API: GET /api/v1/health + GET /billing/rails
- Payments: real checkout URL returned (or clear unconfigured error)
- Video: room create endpoint status documented
- Evidence > assertions. Screenshot or curl output required.
