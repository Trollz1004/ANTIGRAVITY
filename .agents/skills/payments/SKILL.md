---
name: payments
description: Square vs Stripe per-surface rules, live payment links, webhook verification, revenue allocation flow, and Square location/account details. Use for any payment button, checkout, subscription, webhook, ledger entry, or pricing page work on youandinotai.com or sibling surfaces.
---

# Payments (Square Primary for Dating)

## Hard Rules
- youandinotai.com (dating / social-discovery): Square ONLY. Stripe AUP prohibits dating platforms.
- Non-dating surfaces (onlinerecycle.org, ai-solutions.store, YouTube, merch, etc.): Stripe is fine.
- All money flows to the single LLC wallet regardless of processor. 10% per-bucket reserve applies after processing.
- Live Square account: joshlcoleman@gmail.com , location LY5GN09F5AN83 (Trash Or Treasure / YouAndINotAI).
- Current links (verify before use):
  - Bot-Shield $1: https://square.link/u/Qc5mxUy7
  - Founding Member $14.99/mo: https://square.link/u/cxwjcn0s
  - 3-Month $39.99: https://square.link/u/oY7qEfRM
  - 12-Month $99.99: https://square.link/u/6GHpbvvl
  - Royalty Card $2,500: https://square.link/u/CafhorUS

## Webhooks & Security
- SQUARE_WEBHOOK_VERIFY_SIGNATURE=true in CI and prod.
- Always verify signature (HMAC), replay protection, malformed header tests.
- See /mnt/c/antigravity/backend/fastapi-app for the webhook handler and tests.

## When to Use
- Adding/editing any pricing, membership, Bot-Shield, founder plan, or royalty UI.
- Touching payment webhooks, allocation code, or Square catalog copy.
- Reconciling revenue_allocations ledger vs Square dashboard.
- Creating new revenue surface (ensure it becomes its own distinct bucket).

Never hardcode old Stripe keys or retired split logic in customer paths.
