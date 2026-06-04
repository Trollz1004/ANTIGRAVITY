# Merch Store — Current Legal Constraints

> Status: CURRENT SPEC for any future merch implementation.
> Updated: 2026-06-01. See also `C:\Users\joshl\.claude\projects\C--Users-joshl\memory\project_revenue_model_2026-06-01.md`
> Supersedes the older 60/30/10 merch notes.

## Core Principle

Any kid-focused support tied to merch must come from **true net profit only**, never gross revenue, and must follow the current founder-directed operating doctrine for LLC operations.

## Current Operating Rule (Corrected 2026-06-01)

- Current LLC doctrine reserves **10% per legally distinct revenue stream** for the kids' mission. This 10% is the **maximum allowable corporate charitable tax deduction** (10 cents per dollar) — not personal income and not a "donation" Joshua chooses to make.
- The merch stream is one bucket. Other streams (YouAndINotAI memberships, AI-Solutions, OnlineRecycle, staking yield) are separate buckets. Each bucket gets its own 10% reserve.
- Do not market merch as `60/30/10`, `100% charity`, or `100% DAO`
- Do not name a beneficiary in public merch copy unless the relationship is documented and current
- Do not present merch purchases as charitable contributions by the customer

## Net Profit Formula (Per Settlement Period)

```
net_merch_profit = gross_revenue
                 - COGS (POD/Printful base cost)
                 - shipping_and_handling
                 - payment_processor_fees
                 - sales_tax_remittance
                 - refunds_issued
                 - chargebacks_posted (including fees)
```

## Current Allocation Model (Applied to Net Profit)

```
charitable_cap_share = max(net_merch_profit * 0.10, 0)   # 10%
operating_reserve    = max(net_merch_profit - charitable_cap_share, 0)
```

## No-Clawback Rule

- Once a charitable support payment is actually sent, there should be no mechanism to claw it back
- Late refunds or chargebacks must be absorbed by future operating revenue, not by reversing completed support payments
- This stays a one-way valve once money has left the business

## Settlement Timing

- Compute on **settled periods** only
- Use a refund/chargeback buffer before any support payment is finalized
- Do not disburse money that may need to be refunded

## Ledger Fields (Future Schema)

When a merch store exists, the settlement table should track:

| Field | Type | Description |
|-------|------|-------------|
| period | date | Settlement period |
| stream | enum | merch stream identifier |
| gross_revenue | decimal | Total collected |
| cogs | decimal | Cost of goods |
| shipping | decimal | Shipping paid |
| taxes | decimal | Sales tax remitted |
| processor_fees | decimal | Payment processor fees |
| refunds | decimal | Refunds issued |
| chargebacks | decimal | Chargebacks and fees |
| net_profit | decimal | Computed net |
| charitable_cap_10pct | decimal | Current max support amount |
| operating_reserve | decimal | Remaining business-controlled amount |
| distributed_at | timestamp | When any support payment executed |
| tx_hash | text | Optional on-chain reference |

## Validation Checklist

- [ ] Net profit formula matches this spec
- [ ] No 60/30/10 or 100% claims survive in merch copy
- [ ] No code path reverses completed support payments
- [ ] Settlement happens after a reasonable refund buffer
- [ ] Dashboard language stays factual and non-solicitation
- [ ] Any beneficiary naming is separately documented and current

---

*No merch store exists today. This file exists so future merch work starts from the current legal/operational doctrine instead of stale percentage lore.*
