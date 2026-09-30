# FINDING — registration is STILL broken in production, and the fix has never been deployed

**Status:** VERIFIED
**Date:** 2026-09-30
**Discovered by:** Hermes (Sabretooth), checking a judge's "unverified deployment ordering" remark
**Severity:** Critical — no new user can create an account on the live site

## The live symptom, reproduced

Against the real production API:

```
POST https://api.youandinotai.com/api/v1/auth/register
  with referral_code    -> HTTP 500 INTERNAL_ERROR
  without referral_code -> HTTP 500 INTERNAL_ERROR
```

Both fail. This is not a referrals problem — **registration itself is down in prod.**

Control evidence that the endpoint is deployed and reachable (it returns a
structured application error, not a gateway error), and that the database is
healthy:

```
GET https://api.youandinotai.com/api/v1/health
  -> {"status": "ok", "db_connected": true, "user_count": 9}
```

## Why: prod is running code that predates the fix

The live OpenAPI schema is the ground truth for what is deployed:

```
GET https://api.youandinotai.com/openapi.json
  AuthRegisterRequest fields:
    accepted_cookie_policy, accepted_terms, confirmed_over_18,
    date_of_birth, display_name, email, password
  referral_code PRESENT: False
```

`routers/auth.py` reads `payload.referral_code`. A request model without that
field makes every registration raise `AttributeError` before any validation runs.
That is the same defect I fixed locally — **and production does not have the fix.**

`origin/main` DOES have it (`schemas.py` line 22, `referral_code: str | None =
Field(default=None, max_length=64)`), added by commit `4e2863ab` on
**2026-09-28**. So the fix has existed on the remote for two days and has never
been deployed.

## Why it has not deployed

`.github/workflows/deploy-gcr.yml` deploys with:

```
on:
  workflow_dispatch:      # manual trigger ONLY — never fires on push
...
gcloud run deploy "$SERVICE" --source domains/youandinotai.com/backend ...
```

Two consequences:

1. **The deploy is manual.** Pushing to `main` does not deploy anything. Someone
   must dispatch the workflow (or run `gcloud` by hand) for a change to reach
   production. `auto-land.yml` exists, but nothing in this repo's workflows
   deploys on push.
2. **The source path is `domains/youandinotai.com/backend`**, so the build context
   is that directory and the relevant Dockerfile is the one inside it.

## Correction to a standing belief — the repo disagrees with my memory

My persistent memory states: *"Cloud Run does NOT run Alembic at deploy —
`app/database.py reconcile_legacy_schema()` backfills columns."*

**The repository says otherwise, and the repo wins:**

| Evidence | What it says |
|---|---|
| `backend/Dockerfile` (tracked, and the file the docs cite) | `CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app ..."]` |
| `backend/docs/DATABASE_MIGRATION_STRATEGY.md` | "The Dockerfile runs `alembic upgrade head` before starting the uvicorn server." |
| `backend/Dockerfile.fixed` | The no-alembic variant. Tracked, but cited by no script, workflow, or doc. |

Both reconcile AND alembic exist. `reconcile_legacy_schema()` runs at app startup
(from `main.py:169`); `Dockerfile` additionally runs `alembic upgrade head`
before uvicorn. So on a deploy the sequence is alembic first, then reconcile.

**Neither path is broken by the other, and the judge's ordering worry is
narrower than it looked:** `reconcile_legacy_schema()` is idempotent on all three
paths — Postgres uses `ADD COLUMN IF NOT EXISTS` (line 121) and
`CREATE INDEX IF NOT EXISTS` (line 154); SQLite inspects `PRAGMA table_info`
first through a guarded `add_column()` helper (line 229). So running reconcile
after alembic is a no-op for the column, not a collision.

**But the migration itself is NOT idempotent.** Verified by running it:

```
ORDER A (migration applied AFTER reconcile on the same DB):
  FAILED -> OperationalError: duplicate column name: referral_code
```

`a1b2c3d4e5f6` calls a bare `op.add_column(...)` with no existence check. That
matters only in the reverse order (migration after reconcile on an
already-backfilled database) — which is not the deploy order, but IS what happens
if an operator runs `alembic upgrade head` by hand against a database that
startup-reconcile has already patched. It should get the same guard the rest of
the file uses.

## What is actually blocking users right now

Not the schema fix — that exists. Not the database — it is healthy. The blocker
is that **the deploy is a manual dispatch that has not been run**, and my own
local branch cannot be pushed (diverged 27 ahead / 52 behind, no push authority).

## Exact unblock sequence

1. Land the fix. `origin/main` already carries it, so this may only need a deploy.
2. Dispatch `.github/workflows/deploy-gcr.yml` (manual) — or run the equivalent
   `gcloud run deploy --source domains/youandinotai.com/backend`.
3. Re-probe: `GET /openapi.json` must show `referral_code` in
   `AuthRegisterRequest`, and a test registration must return 201.
4. Add `IF NOT EXISTS` to `a1b2c3d4e5f6`'s `upgrade()`, or make it check for the
   column, so a manual migration run cannot fail on an already-reconciled DB.

Steps 1–3 are Joshua's call — the deploy is a production action and I have no
authority to trigger one.

## Evidence handles

- Live 500s and the 201-expectation: `curl` against `api.youandinotai.com`,
  2026-09-30 ~13:5x UTC, two distinct emails, with and without `referral_code`
- Deployed schema: `GET https://api.youandinotai.com/openapi.json` →
  `components.schemas.AuthRegisterRequest.properties` (no `referral_code`)
- Remote fix: `git show origin/main:domains/youandinotai.com/backend/app/schemas.py`
  (line 22), added by `4e2863ab` (2026-09-28 16:52:51 +0000)
- Deploy mechanism: `.github/workflows/deploy-gcr.yml` lines 3–4 (`workflow_dispatch`)
  and line 60 (`gcloud run deploy ... --source domains/youandinotai.com/backend`)
- Dockerfile CMD: `domains/youandinotai.com/backend/Dockerfile` line 37
- Migration non-idempotence: reproduced — `duplicate column name: referral_code`
- Reconcile idempotence: `backend/app/database.py` lines 121, 154, 229
