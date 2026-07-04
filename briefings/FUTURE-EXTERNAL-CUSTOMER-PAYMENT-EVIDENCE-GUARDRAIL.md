# Future External-Customer Payment Evidence Guardrail

Updated: 2026-07-03T20:30:42Z  
Scope: YouAndINotAI Square production checkout only. This guardrail prevents founder/test Square activity from being reported as real external customer revenue or first-dollar evidence.

## Authority

- Source of truth: `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`.
- Existing blocked card: `t_278a9bc0` remains blocked until a future real external customer payment is proven.
- Active Square location referenced in repo/doctrine: `LY5GN09F5AN83`.
- Historical visible Square payments by Joshua/founder are founder tests and must not count as external customer revenue.
- Do not read or print secret values. Env var names, endpoint names, and non-secret IDs/hashes are acceptable.

## Idempotent poll target

A poller or human evidence pass may only move the first-dollar/payment blocker toward green when all three layers match the same future payment:

1. Square production payment evidence
   - Poll Square production payments/events for location `LY5GN09F5AN83` only, using configured runtime credentials without printing them.
   - Candidate event types: `payment.created` or `payment.updated`.
   - Required Square payment fields to record in evidence:
     - `payment.id` or a stable one-way hash of it.
     - `status = COMPLETED`.
     - `created_at`.
     - `amount_money.amount` and `amount_money.currency = USD`.
     - `location_id = LY5GN09F5AN83` or approved non-secret location label/hash.
     - `order_id` if present.
     - `source_type` as a label only; never card/PAN/buyer details.
     - signed checkout reference presence (`agref:` token in `note`, `reference_id`, or order reference) without printing the token body/signature.

2. Internal webhook evidence
   - Poll/query `webhook_events` for the matching Square event.
   - Required non-secret fields:
     - `event_source = square`.
     - `event_source_id` matching the Square event id or its stable hash.
     - `event_type in (payment.created, payment.updated)`.
     - `processed = true`.
     - `created_at`.
   - Signature verification must remain enabled in production config (`SQUARE_WEBHOOK_VERIFY_SIGNATURE=true`); do not print `SQUARE_WEBHOOK_SIGNATURE_KEY`.

3. Internal ledger evidence
   - Poll/query `revenue_allocations` for the same payment.
   - Required non-secret fields:
     - `source = square`.
     - `source_event_id` matching `webhook_events.event_source_id`.
     - `square_payment_id` matching the Square payment id, or a stable one-way hash if the raw id should not be posted.
     - `payment_tier` in the known product set (`bot_shield`, `founding_member`, `3_month`, `12_month`, `royalty`, or a documented current product tier).
     - `gross_amount_cents` equal to Square `amount_money.amount`.
     - `reserve_amount_cents`, `operating_amount_cents`, `reserve_percent`, and `accounting_lane` exactly as current backend code wrote them; do not invent a 10% set-aside if the current code/config records another value.
     - `status = reserved`.
     - `payer_type = customer`.
     - `created_at`.

## What to ignore / fail closed

Ignore and keep the blocker blocked when any of these are true:

- The payment id is in `backend/fastapi-app/app/revenue_allocation.py::FOUNDER_TEST_PAYMENT_IDS`.
- The candidate comes from the historical Joshua/founder test window or is only a dashboard screenshot/claim with no matching internal row.
- The payment is not `COMPLETED`.
- The amount/currency does not match a current product tier or documented current product.
- The Square location is missing or not `LY5GN09F5AN83`/approved current authority.
- The event lacks a signed checkout reference, unless Josh/operator explicitly approves a documented exception for an external customer payment.
- `webhook_events` is missing, unprocessed, non-Square, or has a mismatched event id.
- `revenue_allocations` is missing or mismatched. Missing DB rows cannot reclassify old founder tests as customer revenue.
- `payer_type != customer` or the row is only visible in an aggregate that mixes `founder_test` with `customer`.
- A local HTTP endpoint returns HTML, 401, 404, 5xx, or the wrong JSON shape; that is not payment evidence.
- A local/static report says checkout links are green but explicitly did not perform a live purchase/webhook/ledger verification.

## Safe evidence shape for board/Paperclip

Post only this shape, with payment/customer PII redacted:

```json
{
  "evidence_status": "candidate|verified|blocked",
  "square": {
    "payment_id_hash": "sha256:<hash>",
    "event_id_hash": "sha256:<hash>",
    "event_type": "payment.created|payment.updated",
    "status": "COMPLETED",
    "created_at": "<timestamp>",
    "amount_cents": 1499,
    "currency": "USD",
    "location_label": "LY5GN09F5AN83",
    "order_id_hash": "sha256:<hash-or-null>",
    "source_type": "CARD|..."
  },
  "webhook_event": {
    "event_source": "square",
    "event_source_id_hash": "sha256:<hash>",
    "event_type": "payment.created|payment.updated",
    "processed": true,
    "created_at": "<timestamp>"
  },
  "revenue_allocation": {
    "source": "square",
    "source_event_id_hash": "sha256:<hash>",
    "square_payment_id_hash": "sha256:<hash>",
    "payment_tier": "founding_member",
    "gross_amount_cents": 1499,
    "reserve_amount_cents": 0,
    "operating_amount_cents": 1499,
    "reserve_percent": 0,
    "accounting_lane": "<current code value>",
    "status": "reserved",
    "payer_type": "customer",
    "created_at": "<timestamp>"
  },
  "ignored_founder_test_ids_checked": true,
  "no_pii_or_secret_values_printed": true
}
```

The `reserve_*` example above reflects the current observed backend code at `backend/fastapi-app/app/revenue_allocation.py` (`PLATFORM_RESERVE_PERCENT = 0`). If the approved money policy changes later, update the code/source of truth first, then let evidence mirror the runtime row. Evidence must never make a stronger reserve claim than the row actually proves.

## Current verification pass (2026-07-03T20:30:42Z)

No new external-customer payment evidence was found in this pass.

Checks performed without reading secrets:

- Read `t_278a9bc0` comments: it is correctly blocked; Josh corrected historical Square payments as founder/test transactions; previous recurring first-customer repair cron was removed/paused.
- Read `briefings/LIVE-PAYMENT-SOURCE-OF-TRUTH.md`: Square production checkout is authoritative; historical Joshua tests are not customer revenue.
- Read current backend paths:
  - `backend/fastapi-app/app/routers/webhooks.py` processes `payment.created`/`payment.updated` with `status=COMPLETED` into `reserve_revenue_allocation()`.
  - `backend/fastapi-app/app/revenue_allocation.py` contains `FOUNDER_TEST_PAYMENT_IDS` and idempotent uniqueness by `source_event_id` or `square_payment_id`.
  - `backend/fastapi-app/app/models.py` defines `webhook_events` and `revenue_allocations` fields.
  - `backend/fastapi-app/app/routers/health.py` exposes allocation summaries that separate `customer_only` from `founder_test` when the API is actually serving JSON.
- Hermes cron list for this active profile returned zero jobs.
- Repo and Hermes-profile searches found no active local automation prompt/cron repeating the founder-test false positive.
- Windows Task Scheduler query found no matching Square/revenue/founder-test/first-customer task output.
- Process scan found no matching running local process.
- Local endpoint checks:
  - `127.0.0.1:8787/health/allocations*` returned Mission Control HTML, not allocation JSON; not evidence.
  - `127.0.0.1:11436/health/all` refused connection; not evidence.
  - `127.0.0.1:9119/health` returned Hermes dashboard HTML; not payment evidence.
  - `127.0.0.1:9119/api/health` returned 401; not payment evidence.

Disposition: keep `t_278a9bc0` blocked until a future Square `COMPLETED` external-customer event and matching `revenue_allocations.payer_type = customer` row exist.