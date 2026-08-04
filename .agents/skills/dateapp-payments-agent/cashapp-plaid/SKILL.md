---
name: cashapp-plaid
description: Use for Cash App Business checkout and Plaid bank verify.
---
# Cash App + Plaid
- Cash App: POST `/billing/cashapp/checkout` (hosted URL → Square → cashtag).
- Plaid: POST `/billing/plaid/link-token` (auth/identity verify, not charge).
- Env: CASHAPP_*, PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV.
- Frontend picker: `/app/pay`.
