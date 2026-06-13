---
name: revenue-model
description: The live 1-wallet, 1-LLC, 10% per-bucket mission reserve model for Trash Or Treasure Online Recycler LLC. Use for any revenue, ledger, allocation, Square/Stripe, tax, or payout related task. Replaces all historical 60/30/10, CharityRouter, GospelDonation, 100% charity, and "donation" framing.
---

# Revenue Model — 1 Wallet, 1 LLC, 10% Per-Bucket (2026-06-01)

## Canonical Truth
- Single LLC: Trash Or Treasure Online Recycler LLC (FL #L25000158401)
- Single wallet: all revenue in, all costs out. No separate charity routing or platform walls between surfaces (youandinotai.com, onlinerecycle.org, ai-solutions.store, etc.).
- 10% per-bucket mission reserve: for every legally distinct revenue stream the LLC auto-reserves 10% (maximum allowable corporate charitable tax deduction). This 10% is a deduction after the LLC processes revenue — NOT Joshua's personal income diversion and NOT a "donation" the founder "chooses".
- Per-bucket compounding: N streams × 10% buckets multiplies impact. Per-surface / per-video / per-CTA stacking is allowed and encouraged.
- Josh (as LLC member) receives 100% of merchant receipts as taxable income. The 10% is claimed as deduction; the rest is operating capital, retained earnings, founder survival, taxes, reinvestment per Josh's quarterly decision.
- Historical artifacts (GospelDonation.sol, CharityRouter100.sol, DatingRevenueRouter.sol, 60/30/10, "100% to charity", "10% personal income to Joshua") are dead — treat as history only. Do not resurrect in code, comments, docs, or copy.

## Customer-Facing Rules (Strict)
- Lead with product value.
- Never use canonical-7 terms in UI, emails, ads, public API, YouTube, social, marketplace listings, etc.
- Acceptable phrasing examples: "supports the platform's mission", "helps kids with medical care", "founding member benefits".
- Internal briefings/hermes/agents/AGENTS.md may use precise language including "contractual revenue disbursement".

## Implementation Notes
- See /mnt/c/antigravity/backend/fastapi-app/app/revenue_allocation.py for reserve_revenue_allocation() and ledger.
- Square is primary for dating surface (youandinotai.com). Stripe permitted on non-dating.
- All processors consolidate at the single LLC bank account.
- Reconcile via revenue_allocations table + Square reports. 10% floor is code, not config.

## When to Use
- Any change to payments, pricing, ledgers, allocation logic, tax estimates, or public copy about money/impact.
- Before claiming any "charity" routing or percentage on a customer surface.
- When designing new revenue surface (must create new distinct bucket for max impact).

Cross-reference: briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md, memory/project_revenue_model_2026-06-01.md, memory/project_primary_revenue_2026-06-01.md (primary = youandinotai.com + DAO token sale, not e-waste).
