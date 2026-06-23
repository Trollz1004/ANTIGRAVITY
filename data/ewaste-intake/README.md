# E-Waste Intake Templates

Use these files in order, keyed by `intake_id` until sale, then by `ledger_entry_id` for post-sale close:

1. `intake-inventory-template.csv`
2. `condition-grading-template.csv`
3. `testing-status-template.csv`
4. `resale-estimate-template.csv`
5. `ebay-listing-readiness-template.csv`
6. `product-impact-ledger-template.csv` (one row per sold eBay order/transaction)
7. `product-impact-weekly-summary-template.csv` (one row per reporting week)

Minimum rule: do not list on eBay until testing passes and data wipe is verified.

## Post-Sale Ledger Rules

The row-level ledger maps each sold eBay item to product impact and payout evidence. Keep one row per sold order/transaction, even if multiple orders share the same listing.

Required mapping fields:

- `intake_id`, `asset_tag`, `ebay_item_id`, `ebay_order_id`, `ebay_transaction_id`
- `sold_date`, `ebay_payout_id`, `payout_date`
- `product_recipient`, `contribution_batch_id`, `contribution_status`, `reconciliation_status`

Financial integrity checks:

- `gross_inflow_usd = item_price_usd + shipping_collected_usd - refund_amount_usd`
- `net_proceeds_usd = gross_inflow_usd - ebay_fees_usd - payment_processing_fees_usd - shipping_label_cost_usd - packing_cost_usd - refurb_cost_usd - other_costs_usd`
- `product_allocated_usd = round(net_proceeds_usd * (product_share_pct / 100), 2)`
- `product_variance_usd = product_allocated_usd - product_paid_usd`

If `contribution_status = paid`, then `contribution_date`, `contribution_reference`, and `contribution_proof_ref` must be filled.

## Weekly Reporting and Audit Close

1. Ensure all sold rows for the week have required mapping, finance, and status fields.
2. Reconcile each row to source evidence:

- `sale_proof_ref` (order detail/export)
- `fee_proof_ref` (eBay statement/payout breakdown)
- `contribution_proof_ref` (product receipt or transfer confirmation)

3. Aggregate weekly totals into `product-impact-weekly-summary-template.csv`.
4. Have reviewer sign off (`reviewed_by`, `reviewed_at_utc`) before marking week final.

Weekly summary checks:

- `items_sold_count` equals ledger row count for that `reporting_week`
- `product_carryover_usd = product_allocated_usd - product_paid_usd`
- `open_reconciliation_rows` should be `0` for a closed week

## Planning Formula (Pre-Sale)

From `resale-estimate-template.csv`:

- `projected_product_usd = expected_net_proceeds_usd * (product_share_pct / 100)`

## Square Booking Intake Logging

Square appointment webhooks are ingested by:

- `POST /api/v1/webhooks/square-booking`

Booking notifications are written automatically to:

- `bookings/square-bookings-events.jsonl` (full payload + normalized record)
- `bookings/square-bookings-intake-log.csv` (ops-ready log rows)

Configure webhook verification with:

- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `SQUARE_WEBHOOK_NOTIFICATION_URL`
- `SQUARE_WEBHOOK_VERIFY_SIGNATURE=true`

---

> "AI for customers in need, not adults with greed."
>
> **Until no kid is in need. product-value-first 🚀**
