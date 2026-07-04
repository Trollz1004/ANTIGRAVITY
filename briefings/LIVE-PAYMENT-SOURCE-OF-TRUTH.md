# Live Payment Source Of Truth - 2026-06-22

## Current Rule

YouAndINotAI sells memberships and verification through Square production checkout.

## Square

- Square account owner: Joshua Coleman / Trash Or Treasure Online Recycler LLC.
- Current checkout products are ordinary product purchases.
- Customer receipt confirms the purchased membership or verification item.
- Historical visible Square test payments by Joshua are founder tests, not external customer
  revenue.

## Stripe

Stripe is legacy for YouAndINotAI unless Joshua explicitly reopens it for a specific surface.

## Public Copy

Payment pages, checkout buttons, receipts, support responses, and public API responses must
describe product value only:

- membership
- verification
- account access
- support
- safety
- pricing
- refund terms

Do not add private accounting, tax handling, ownership/control, or investment-return claims to
checkout or receipts.

## Verification Needed For Green

- production Square keys loaded in backend runtime
- checkout session created successfully
- payment completes with a real card/payment method
- Square dashboard shows the completed transaction
- app account state reflects the purchase where applicable

Future external-customer payment evidence must also follow
`briefings/FUTURE-EXTERNAL-CUSTOMER-PAYMENT-EVIDENCE-GUARDRAIL.md`:
do not count historical Joshua/founder Square tests as customer revenue, and do
not mark first-dollar/payment evidence green without a future Square
`COMPLETED` event plus matching internal `revenue_allocations` row with
`payer_type = customer`.
