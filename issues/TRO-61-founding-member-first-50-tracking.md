# TRO-61 Founding member onboarding funnel — first 50 signups tracking

- Date (UTC): 2026-07-12
- Agent: 821a5670-3dcb-4e0f-928b-617c2ca4a2c2 (opencode/claude_local, Paperclip)
- Repo: c:\antigravity, branch: feat/tro-296-ai-solutions-exchange-scaffold

## What shipped

Added `GET /api/v1/metrics/founding-members` to
`backend/fastapi-app/app/routers/metrics.py`, protected by the existing
`X-Metrics-Key` header dependency used by the other `/metrics/*` endpoints.

Source of truth: `RevenueAllocation` rows written by
`reserve_revenue_allocation()` in `app/routers/webhooks.py` on every real
Square payment webhook. The endpoint filters to
`payment_tier == "founding_member"` AND `has_square_receipt == True` — this
is genuine Square-confirmed payment data, never seed/mock rows, satisfying
the "no mock data as real" rule.

Response shape:

```json
{
  "generated_at": "...",
  "target": 50,
  "confirmed_conversions": <int>,
  "remaining_to_target": <int>,
  "target_reached": <bool>,
  "conversions": [
    {
      "sequence": 1,
      "user_id": "...",
      "square_payment_id": "...",
      "gross_amount_cents": 1499,
      "converted_at": "..."
    }
  ]
}
```

`conversions` is capped at the first 50 (ordered by `created_at` ascending),
so this both counts progress toward the 50-signup goal and lists each
individual conversion with its Square payment ID as the receipt reference.

## Verification performed

- `python -c "import ast; ast.parse(...)"` — syntax OK.
- `python -c "from app.routers import metrics"` — import OK, confirms
  `RevenueAllocation.has_square_receipt` / `.payment_tier` / `.created_at`
  fields resolve against the real model in `app/models.py`.
- Confirmed `metrics.router` is already mounted at prefix `/api/v1` in
  `app/main.py:479`, so no additional wiring was needed.
- Did not run the full backend test suite (out of scope for this heartbeat;
  no existing tests reference this router beyond import-level checks). Flagging
  as a follow-up if a reviewer wants endpoint-level test coverage.

## Disposition

**in_review** — code change is live on this branch, not yet merged to `main`.
Reviewer/approval path: standard PR review on merge into `main` (per repo
rule: feature branch → PR → merge → delete). Suggested reviewer: Joshua or
next Claude/Codex CEO-lane session with backend write access.

Follow-up (optional, not blocking): add a pytest covering
`/metrics/founding-members` with a seeded-in-test (not production) DB to lock
in the response contract.
