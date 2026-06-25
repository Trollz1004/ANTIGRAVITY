# Database Migration Strategy

## Current State

The ANTIGRAVITY backend uses **Alembic** (built on SQLAlchemy) for schema version control.
As of this writing there are **10 migration versions** tracked in
`alembic/versions/`, covering the full platform schema including users, profiles,
swipes, matches, verification events, webhook events, video calls, support tickets,
revenue allocations, and volunteer tracking.

Alembic is configured in `alembic.ini` with `script_location = alembic` and reads
the database URL from `app.config.get_settings().primary_database_url` (see
`alembic/env.py`). Set `SUPABASE_DB_URL` for the primary Supabase database; if it
is unset, the backend falls back to `DATABASE_URL` for local development.

---

## Migration Workflow

### 1. Create a New Migration

After modifying any ORM model in `app/models/`:

```bash
cd backend/fastapi-app
alembic revision --autogenerate -m "descriptive message"
```

- `--autogenerate` diffs the current database against the ORM models and generates
  the upgrade/downgrade operations.
- **Always review the generated file** before committing — autogenerate can miss
  renames, constraints, or complex data migrations.
- If the migration involves data backfills, add them explicitly in the `upgrade()`
  function using `op.execute()` or batch operations.

### 2. Test the Migration Locally

```bash
# Apply all pending migrations
alembic upgrade head

# Verify the schema matches expectations
alembic current          # shows active revision
alembic history --verbose  # full revision graph

# Test rollback of the latest migration
alembic downgrade -1
alembic upgrade head     # re-apply
```

### 3. Apply in Production

```bash
alembic upgrade head
```

This is automated in the Docker entrypoint and CI/CD pipeline (see below).

---

## Production Deployment Strategy

### Docker

The Dockerfile runs `alembic upgrade head` before starting the uvicorn server.
This ensures the schema is current every time a container starts.

### CI/CD

The `scripts/run_migrations.sh` script is the canonical migration runner for CI/CD:

```bash
./scripts/run_migrations.sh
```

It exits `0` on success and `1` on failure, making it safe for pipeline gates.

### Pre-Deploy Health Check

Before deploying, run the migration health check:

```bash
python scripts/migration_health_check.py
```

This reports the current Alembic revision, the head revision, and any pending
migrations against the same `primary_database_url` used by Alembic. It exits `0`
if up-to-date and `1` if migrations are pending.

---

## Rollback Procedure

To roll back the **most recent** migration:

```bash
alembic downgrade -1
```

To roll back to a **specific** revision:

```bash
alembic downgrade <revision_id>
```

To roll back **all** migrations:

```bash
alembic downgrade base
```

> ⚠️ **Always take a database backup before rolling back in production.**
> Rollbacks that drop columns or tables will result in data loss.

---

## Legacy Schema Reconciliation

The function `reconcile_legacy_schema()` in `app/database.py` exists to handle
Cloud Run deploys that ship source code without running Alembic. It performs
idempotent `ALTER TABLE IF EXISTS ADD COLUMN IF NOT EXISTS` statements to
backfill columns that newer code depends on but that may be missing from a
legacy production schema.

### What it does

1. Calls `Base.metadata.create_all` to create any missing tables.
2. Creates webhook retry queue tables.
3. For PostgreSQL only, runs ~40 idempotent `ALTER TABLE` / `CREATE INDEX`
   statements covering:
   - `users` table: display_name, password_hash, square_customer_id,
     date_of_birth, adult_verified_at, is_active, bot_shield_verified,
     subscription fields, engagement scoring columns, member badge columns,
     google_id
   - `profiles` table: bio, age, gender, looking_for, location, photos,
     interests, verified, location_enabled, timestamps
   - `verification_events` table: square_payment_id, trust_score, amount_cents
   - `webhook_events` table: event_source_id, event_source
   - `swipes` table: user_id, target_id, direction, created_at + indexes
   - `matches` table: user_a, user_b, compatibility_score, status,
     matched_at, last_message_at, breeze_bypass_enabled + indexes
4. Migrates legacy `hashed_password` → `password_hash` in `users`.
5. Migrates legacy `stripe_event_id` → `event_source_id` in `webhook_events`.

### When it runs

It is called at application startup in `app/main.py` and is **skipped in test
environments** (`app_env == "test"`).

### Relationship to Alembic

`reconcile_legacy_schema()` is a **safety net**, not a replacement for Alembic.
All schema changes should still go through proper Alembic migrations. The
reconciliation function exists solely to bridge the gap for Cloud Run deploys
that bypass the migration pipeline.

---

## Best Practices

1. **Always backup before migrations in production**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on staging first** — never run a new migration directly on production.

3. **Use transactional migrations** — Alembic wraps each migration in a
   transaction by default (for databases that support DDL transactions, like
   PostgreSQL). Keep it that way.

4. **Keep migrations small and focused** — one logical change per migration.
   This makes rollbacks safer and code review easier.

5. **Never edit a migration that has been applied to production** — create a
   new migration instead.

6. **Use `--autogenerate` as a starting point, not the final word** — always
   review and manually verify the generated operations.

7. **Add data migrations explicitly** — autogenerate only detects schema
   changes, not data backfills.

8. **Pin the Alembic version** in `requirements.txt` to avoid unexpected
   behavior from version upgrades.

9. **Run the health check in CI** — `scripts/migration_health_check.py` should
   be part of every CI pipeline to catch drift early.

10. **Document breaking changes** — if a migration requires downtime or manual
    intervention, document it in the migration file's docstring and in the
    deployment runbook.
