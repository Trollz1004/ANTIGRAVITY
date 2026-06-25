---
name: payments
description: Square vs Stripe per-surface rules, live payment links, webhook verification, revenue allocation flow, and Square location/account details. Use for any payment button, checkout, subscription, webhook, ledger entry, or pricing page work on youandinotai.com or sibling surfaces.
---

# Payments (Square Primary for Dating)

## Hard Rules
- youandinotai.com (dating / social-discovery): Square ONLY. Stripe AUP prohibits dating platforms.
- Non-dating surfaces (onlinerecycle.org, ai-solutions.store, YouTube, merch, etc.): Stripe is fine.
- All money flows through normal LLC merchant, bank, ledger, and tax workflows.
- Live Square account: joshlcoleman@gmail.com , location LY5GN09F5AN83 (Trash Or Treasure / YouAndINotAI).
- Current links (verify before use):
  - Bot-Shield $1: https://square.link/u/Qc5mxUy7
  - Founding Member $14.99/mo: https://square.link/u/cxwjcn0s
  - 3-Month $39.99: https://square.link/u/oY7qEfRM
  - 12-Month $99.99: https://square.link/u/6GHpbvvl
  - Premium Card $2,500: https://square.link/u/CafhorUS

## Webhooks & Security
- SQUARE_WEBHOOK_VERIFY_SIGNATURE=true in CI and prod.
- Always verify signature (HMAC), replay protection, malformed header tests.
- See backend/fastapi-app for the webhook handler and tests.

## When to Use
- Adding/editing any pricing, membership, Bot-Shield, founder plan, or premium-access UI.
- Touching payment webhooks, allocation code, or Square catalog copy.
- Reconciling revenue_allocations ledger vs Square dashboard.
- Creating a new revenue surface with business-only product positioning.

Never hardcode payment secrets or retired payment-routing logic in customer paths.
