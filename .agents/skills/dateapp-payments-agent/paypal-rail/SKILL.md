---
name: paypal-rail
description: Use when enabling PayPal checkout for founder tiers.
---

# PayPal Rail

- POST `/billing/paypal/create-order` → approve_url.
- Env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API_BASE_URL.
- Tiers: founding_member 14.99, 3_month 39.99, 12_month 99.99, royalty 2500.

Account emails (Joshua, 2026-10-23): `ebaytrashortreasure@gmail.com` is the older, established email the Date App needs; it signs in to exactly two merchant accounts, Square and PayPal. Every other account and service uses `joshlcoleman@gmail.com`. Rule: `CLAUDE.md`, section "Account mapping".
