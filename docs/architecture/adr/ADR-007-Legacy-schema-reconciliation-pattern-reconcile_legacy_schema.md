# ADR-007: Legacy schema reconciliation pattern (reconcile_legacy_schema)

## Status
Accepted with caveats

## Context
In certain deployment environments, specifically Cloud Run, the standard Alembic migration process is not consistently executed during deployment. This can lead to a divergence between the expected database schema (as defined by ORM models) and the actual production database schema. Critical new features or bug fixes that rely on recently added columns might fail if these columns are missing in the live database. A mechanism is needed to pragmatically address these schema discrepancies for essential columns.

## Decision
A `reconcile_legacy_schema` function (`app.database.py`) has been implemented to perform idempotent schema alterations on essential tables (e.g., `users`, `profiles`, `verification_events`, `webhook_events`, `swipes`, `matches`). This function is designed to run on application startup in non-test environments and uses `ALTER TABLE IF EXISTS ADD COLUMN IF NOT EXISTS` statements to add missing columns. It also includes logic to update data from deprecated columns to new ones where applicable (e.g., `hashed_password` to `password_hash`, `stripe_event_id` to `event_source_id`). The goal is to close the gap between the ORM and the live database for columns that block core functionality.

## Consequences
- **Positive:**
    - Ensures critical columns are present in the database, even if Alembic migrations are not consistently applied during deployment.
    - Prevents application failures due to missing essential schema elements in specific deployment contexts.
    - Idempotent nature of `ALTER TABLE IF EXISTS` statements means it can be run multiple times without issues.
    - Allows for quick deployment of urgent schema changes without a full migration rollback/reapply.
- **Negative:**
    - **Bypasses the formal Alembic migration process for a subset of schema changes, potentially leading to a less controlled and auditable schema evolution.** This is a significant architectural trade-off made due to deployment environment constraints.
    - Can obscure the true state of the database schema if developers rely solely on ORM definitions without considering these runtime reconciliations.
    - Adds complexity to the database initialization logic.
    - Primarily a stop-gap measure to address deployment limitations rather than a best practice for schema management.
    - Requires manual maintenance and updating of the SQL statements within the `reconcile_legacy_schema` function.