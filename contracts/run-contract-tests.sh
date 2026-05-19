#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

REPO_ROOT="/mnt/c/ANTIGRAVITY"
CONTRACTS_DIR="$REPO_ROOT/contracts"
MISSION_CONTROL_DIR="$REPO_ROOT/apps/mission-control"
FASTAPI_APP_DIR="$REPO_ROOT/backend/fastapi-app"

echo "--- Running Contract Tests ---"

# 1. Run Consumer Tests (TypeScript / Vitest)
#    This will generate the pact file in $CONTRACTS_DIR/pacts/
echo "\n--- Running Consumer Tests (mission-control) ---"
cd "$MISSION_CONTROL_DIR"

# Install node modules if not already installed
if [ ! -d "./node_modules" ]; then
  echo "Installing npm dependencies for mission-control..."
  npm install
fi

npx vitest run "$CONTRACTS_DIR/consumer/mission-control-pact-test.ts"

echo "Consumer tests complete. Pact file generated at $CONTRACTS_DIR/pacts/mission-control-api.json"

# 2. Run Provider Verification Tests (Python / Pytest)
#    This verifies the FastAPI backend against the generated pact file.
echo "\n--- Running Provider Verification (antigravity-api) ---"
cd "$FASTAPI_APP_DIR"

# Install Python dependencies if not already installed
# NOTE: This assumes requirements.txt is up to date and includes all needed dependencies.
#       Also installing testing dependencies here.
if ! pip show pytest &>/dev/null || ! pip show httpx &>/dev/null || ! pip show pytest-asyncio &>/dev/null || ! pip show pytest-anyio &>/dev/null; then
  echo "Installing Python dependencies for FastAPI backend..."
  pip install -r requirements.txt
  pip install pytest httpx[http2] pytest-asyncio pytest-anyio
fi

pytest "$CONTRACTS_DIR/provider/pact-verification.test.py" -v

echo "Provider verification complete."

echo "\n--- All Contract Tests Passed ---"
