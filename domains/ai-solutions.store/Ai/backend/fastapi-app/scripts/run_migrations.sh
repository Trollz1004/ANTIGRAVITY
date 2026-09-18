#!/usr/bin/env bash
# run_migrations.sh — Apply all pending Alembic migrations.
#
# Exits 0 on success, 1 on failure.
# Designed for use in CI/CD pipelines and Docker entrypoints.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

cd "$APP_DIR"

echo "============================================"
echo "  Running Alembic Migrations"
echo "============================================"
echo "  Working directory: $(pwd)"
echo "  Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "--------------------------------------------"

# Run migrations
if alembic upgrade head; then
    echo "--------------------------------------------"
    echo "  ✅ Migrations applied successfully."
    echo "  Current revision: $(alembic current 2>/dev/null | head -1)"
    echo "============================================"
    exit 0
else
    echo "--------------------------------------------"
    echo "  ❌ Migration failed!"
    echo "============================================"
    exit 1
fi
