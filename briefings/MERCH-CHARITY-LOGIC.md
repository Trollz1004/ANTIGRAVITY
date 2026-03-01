# Merch Store — Charity Donation Logic (Protocol Omega Compliant)

> Source: Perplexity/Comet analysis, Feb 28 2026. Corrected to 60/30/10.
> Status: SPEC ONLY — no merch store exists yet. For future implementation.

## Core Principle

Charity donations come from **true net profit only**, NEVER gross revenue. Once sent to Shriners, funds are **never clawed back** for any reason.

## Net Profit Formula (Per Settlement Period)

```
net_merch_profit = gross_revenue
                 - COGS (POD/Printful base cost)
                 - shipping_and_handling
                 - payment_processor_fees (Stripe %)
                 - sales_tax_remittance
                 - refunds_issued
                 - chargebacks_posted (including CB fees)
```

## Protocol Omega Split (Applied to Net Profit)

```
shriners_share    = max(net_merch_profit * 0.60, 0)   # 60%
v8_infra_share    = max(net_merch_profit * 0.30, 0)   # 30%
founder_share     = max(net_merch_profit * 0.10, 0)   # 10%
integer_remainder → shriners_share
```

**NOT 50/50.** Old Perplexity docs had wrong split. 60/30/10 is canonical (Protocol Omega).

## No-Clawback Rule

- Once a donation is sent to Shriners, **NO mechanism exists to pull it back**
- If a late chargeback makes a past period negative:
  - Past donations are UNTOUCHED
  - Future *business share* (founder 10%) absorbs the loss first
  - Then V8 share absorbs if needed
  - Shriners share is ALWAYS last to reduce, and only from FUTURE periods
- This is a one-way valve: money flows TO charity, never FROM

## Settlement Timing

- Compute on **settled periods** (monthly, after refund/CB window closes)
- Typical settlement delay: 30 days after period end
- This prevents donating money that might be refunded

## Ledger Fields (Future Schema)

When merch store is built, the `charity_profit_split` table needs:

| Field | Type | Description |
|-------|------|-------------|
| period | date | Settlement period (month) |
| stream | enum | 'merch_youandinotai' or 'merch_ecosystem' |
| gross_revenue | decimal | Total collected |
| cogs | decimal | Cost of goods (POD provider) |
| shipping | decimal | Shipping paid |
| taxes | decimal | Sales tax remitted |
| processor_fees | decimal | Stripe/payment fees |
| refunds | decimal | Refunds issued in period |
| chargebacks | decimal | CBs + CB fees in period |
| net_profit | decimal | Computed net |
| shriners_60pct | decimal | 60% of net → Shriners |
| v8_30pct | decimal | 30% of net → V8 infra |
| founder_10pct | decimal | 10% of net → founder ops |
| distributed_at | timestamp | When DAO distribution executed |
| tx_hash | text | On-chain transaction hash |

## Validation Checklist (For When Merch Goes Live)

- [ ] Net profit formula matches this spec exactly
- [ ] Split is 60/30/10, NOT 50/50
- [ ] No code path exists to reverse a completed donation
- [ ] Settlement period is >= 30 days after period end
- [ ] Chargebacks reduce future business share, not past donations
- [ ] Dashboard shows all ledger fields transparently
- [ ] On-chain tx hash links to Base Mainnet explorer
- [ ] Integer remainder goes to Shriners (not founder)

---

*This is a SPEC for future implementation. No merch store exists today. Current focus: YouAndINotAI launch April 4, 2026.*
