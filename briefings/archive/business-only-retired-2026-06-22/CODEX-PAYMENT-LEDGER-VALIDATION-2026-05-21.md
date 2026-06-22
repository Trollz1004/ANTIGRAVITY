# Codex Payment Ledger Validation - 2026-05-21

Purpose: preserve the payment/tax/reserve truth Codex verified from repo files, live API responses, and Square metadata during Joshua's 2026-05-21 Sabretooth session.

## Correct Operating Model

Per Joshua's correction and the repo's current DAO/payment doctrine, the operating model is:

```text
$1.00 gross platform receipt
- $0.10 max kids/mission reserve for that legally distinct bucket
= $0.90 Joshua/LLC taxable operating share
- about $0.27 tax reserve when using Joshua's 30% working tax assumption
= about $0.63 available for AI fees, power, hosting, hardware, founder survival, family support, and scaling
```

Important distinction:

- Square processing fees are a business cost and do not replace the 10% per-bucket reserve rule.
- The 10% reserve is calculated from gross platform receipts for date-app subscriptions and Bot-Shield payments unless a specific bucket is documented as net-profit-based.
- The current live app ledger is internal accounting proof only. It does not prove an external payout happened until reconciliation updates the ledger status from `reserved`.

## Repo Evidence

- `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md` says the ledger reserves exactly 10% of gross platform payment revenue, rounded up, into `kids_support` with status `reserved`.
- `briefings/REPOSITORY_RECORD.md` says all platform revenue lands in one founder-controlled wallet and the 10% reserve is Joshua Coleman's taxable income until he makes a quarterly founder-directed decision.
- `briefings/THE-WHEEL.md` says all revenue in/all costs out of one wallet, with 10% per legally distinct revenue stream auto-reserved and per-bucket compounding.
- `briefings/DAO-ARCHITECTURE-CANONICAL.md` carries the tax-flow model: gross revenue -> 10% reserve -> 90% taxable income -> tax reserve -> remaining operating/survival/scaling funds.

Note: DAO architecture docs also show a conservative 35% tax-reserve example in some sections. Joshua's 2026-05-21 working assumption was about 30% of the 90% taxable operating share. Future code should not silently hard-code either tax percentage without an explicit current-source update.

## Live Square Evidence

Using the vault-stored Square high-risk token metadata only, Codex verified active YouAndiNotAi Square location `LY5GN09F5AN83` has completed payments since 2026-03-01:

| Payment Type | Count | Gross | Square Fees | Estimated Net |
|---|---:|---:|---:|---:|
| Founding Member | 1 | $14.99 | $0.73 | $14.26 |
| Bot-Shield | 5 | $5.00 | $1.65 | $3.35 |
| Total | 6 | $19.99 | $2.38 | $17.61 |

Reserve math by current gross-receipt doctrine:

- Gross reserve total, rounded per payment: $2.00
- Approx tax reserve on the remaining 90% at Joshua's 30% working assumption: about $5.40 on $17.99 taxable operating share, before accounting treatment for ordinary business expenses and Square fees.

Do not claim Cash App Pay or Google Pay wallet rails from this data. The sampled Square payments were `source_type=CARD` and did not expose a wallet label in the queried payment detail.

## Live App Evidence

Codex queried the live API on 2026-05-21:

```text
GET https://api.youandinotai.com/api/v1/health
HTTP 200
status=ok, db_connected=true, square_connected=true, square_signature_configured=true, user_count=3

GET https://api.youandinotai.com/api/v1/health/allocations
HTTP 200
allocations=[]

GET https://api.youandinotai.com/api/v1/health/webhooks
HTTP 200
recent rows were signature-failure bookkeeping events only
```

Conclusion: Square itself has real completed YouAndiNotAi payments, but the deployed app ledger currently does not show corresponding `revenue_allocations` rows. The next fix is reconciliation: import or repair authoritative Square payment events into the internal ledger without inventing payouts.

## Actionable Next Fix

1. Add a reconciliation command or protected endpoint that reads completed Square payments for `LY5GN09F5AN83`.
2. For each completed payment not already in `revenue_allocations`, insert a `reserved` allocation row using the current gross-receipt 10% rule.
3. Store Square processing fees separately or add fee fields so dashboards can show gross, fees, tax reserve, and operating survival funds honestly.
4. Keep wallet-rail proof red/unproven unless Square payment details expose actual wallet labels.
5. Do not change customer-facing copy to mention percentages, kids, tax treatment, or charitable claims.
