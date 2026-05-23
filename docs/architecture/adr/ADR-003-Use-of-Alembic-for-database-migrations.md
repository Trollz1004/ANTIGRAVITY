# ADR-003: Use of Alembic for database migrations

## Status
Accepted

## Context
As the ANTIGRAVITY project evolves, changes to the database schema are inevitable. A robust and controlled mechanism is required to manage these schema changes across different development, staging, and production environments, ensuring data integrity and consistency. Manual schema management is prone to errors and inconsistencies.

## Decision
Alembic was chosen as the database migration tool for the ANTIGRAVITY project. Alembic integrates seamlessly with SQLAlchemy, allowing for programmatic generation and application of migration scripts. This enables version control of the database schema, facilitates collaborative development, and provides a reliable way to evolve the database over time.

## Consequences
- **Positive:**
    - Version-controlled database schema, enabling rollbacks and clear history of changes.
    - Automated generation of migration scripts reduces manual effort and errors.
    - Consistent database schema across all environments.
    - Supports both programmatic and manual adjustments to migration scripts.
    - Integrates well with SQLAlchemy models for autogenerating changes.
- **Negative:**
    - Adds a dependency and requires understanding of Alembic's workflow.
    - Conflicts can arise in migration scripts during collaborative development if not managed carefully.
    - The `reconcile_legacy_schema` function exists as a fallback for specific deployment environments (e.g., Cloud Run where Alembic might not be run during deployment), indicating a slight deviation from a pure Alembic-only migration strategy in certain contexts. This requires careful management to avoid inconsistencies.