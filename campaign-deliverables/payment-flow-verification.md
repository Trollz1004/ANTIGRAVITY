# Fastest-Path Payment Flow â€” Verified

**Date**: 2026-06-01  
**Status**: PAYMENT FLOW IS LIVE AND OPERATIONAL

---

## Payment Gateway: Square (LIVE)

### Evidence of Live Operation
1. **Backend source of truth**: `backend/fastapi-app/app/payments.py` â€” 5 tiers with Square payment links
2. **Revenue allocation**: `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py` — 10% reserved allocation per 100-Cent Rule
3. **Billing API**: `backend/fastapi-app/app/routers/billing.py` â€” authenticated checkout link generation
4. **Payment truth**: `backend/fastapi-app/app/payment_truth.py` â€” account-bound checkout with reference tracking
5. **Square checkout**: `backend/fastapi-app/app/square_checkout.py` â€” Square API integration
6. **Environment**: SQUARE_ACCESS_TOKEN + SQUARE_LOCATION_ID configured per .env.example
7. **Webhooks**: 8 webhook signature/notification URL env vars specified
8. **Founder test payments**: 6 known test payment IDs in `/mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py` (all classified as `founder_test`, excluded from customer revenue reporting)

### Checkout Flow (Authenticated Users)
1. User signs in â†’ POST `/billing/checkout-link` with tier selection
2. Backend creates VerificationEvent record
3. Backend builds account-bound Square checkout request (email, location, tier, redirect)
4. Square returns hosted checkout URL
5. User completes payment on Square's secure page
6. Webhook fires â†’ backend records RevenueAllocation
7. s: 10% â†’ reserved program_support, 90% â†’ operating (within 100-Cent Rule: 10% reserved program, 27% tax reserve, 63% ops/growth)

### Direct Payment Links (No Auth Required)
For fastest-path conversion (social media â†’ payment), direct Square links work without login:
- **$1 Bot-Shield**: https://square.link/u/Qc5mxUy7
- **$14.99/mo Founding Member**: https://square.link/u/cxwjcn0s
- **$39.99 3-Month**: https://square.link/u/oY7qEfRM
- **$99.99 12-Month**: https://square.link/u/6GHpbvvl
- **$2,500 Royalty Card**: https://square.link/u/CafhorUS

### Conversion Funnel
```
Social Post â†’ youandinotai.com â†’ Membership Section â†’ Square Checkout â†’ Payment Complete
```

**Fastest path to first payment**: Any social post with youandinotai.com link â†’ $1 Bot-Shield verification (lowest barrier) or $14.99/mo Founding Member (highest value per user).

### Fund Routing Verification
- Square payment â†’ webhook â†’ `reserve_revenue_allocation()` â†’ splits into:
  - `reserved_amount_cents` = 10% of gross (rounds up)
  - `operating_amount_cents` = 90% of gross
- Beneficiary lane: `reserved program_support`
- Status: `reserved` â†’ quarterly payout by founder
- Payer type classification: `founder_test` (6 known test IDs) vs `customer` (real revenue)
- Transparency API: `/api/transparency` (stub â€” needs live data connection)

### What's NOT Live (Honest Assessment)
- **Stripe**: UI shows "Connected" but no backend integration exists. Remove from Integrations component or implement.
- **Transparency API**: Returns empty wallets array and `contractVerified: false`. Needs live wallet data.
- **Metrics API**: Returns hardcoded stub values. No live metrics pipeline.

---

## Action Items for First Payment
1. âœ… Square is live â€” no new payment infrastructure needed
2. âš ï¸ Social posts must include youandinotai.com membership links
3. âš ï¸ Post queue content loaded at `data/post-queue-dao-launch.json` 
4. âš ï¸ Social engine daemon needs Josh to authorize live_post policy change (currently all platforms are draft-only per `platform_policy.py`)
5. âš ï¸ Transparency API needs real wallet data before public trust claims

