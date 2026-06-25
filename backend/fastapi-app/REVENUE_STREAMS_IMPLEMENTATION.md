# Revenue Stream Implementation Summary

## Current Rule

The backend tracks product revenue for operational reporting only. Completed
Square payments are recorded in the revenue ledger with:

- gross amount
- operating amount
- internal reserve amount, currently `0`
- payer type, so founder tests stay separate from customer revenue

The ledger must not create public funding claims, investment promises, token
claims, or restricted reserve obligations.

## Files

- `app/revenue_streams.py` defines product stream metadata and in-memory stream
  tracking helpers.
- `app/revenue_allocation.py` records completed Square payments into the ledger.
- `app/allocation_compat.py` isolates historical database column names so the
  runtime can use current business-only terms without a risky online rename.

## Verification

Use the focused tests when this area changes:

```bash
pytest tests/test_revenue_allocation.py tests/test_revenue_streams.py tests/test_webhooks.py -q
```
