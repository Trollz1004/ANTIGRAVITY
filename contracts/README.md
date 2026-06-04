# API Contract Testing

This directory contains the setup for API contract testing using Pact. Contract testing helps ensure that the frontend (consumer) and backend (provider) APIs remain compatible, preventing unexpected breakages due to schema drift.

## Structure

- `contracts/pacts/`: Stores generated Pact JSON contract files.
- `contracts/consumer/`: Contains consumer-side tests (TypeScript with Vitest).
- `contracts/provider/`: Contains provider-side verification tests (Python with Pytest).
- `contracts/run-contract-tests.sh`: A convenience script to run both consumer and provider tests.

## Consumer Tests (Frontend)

The consumer tests define the expected API interactions from the perspective of the `mission-control` frontend application. They generate a Pact contract file (`mission-control-api.json`).

**File:** `contracts/consumer/mission-control-pact-test.ts`

**How to Run:**

1.  Ensure you are in the `/mnt/c/ANTIGRAVITY/apps/mission-control/` directory or have `node_modules` accessible.
2.  Run the Vitest tests:
    ```bash
    cd /mnt/c/ANTIGRAVITY/apps/mission-control/
    npx vitest run ../../contracts/consumer/mission-control-pact-test.ts
    ```
    This will generate `mission-control-api.json` in `contracts/pacts/`.

## Provider Verification Tests (Backend)

The provider verification tests ensure that the FastAPI backend adheres to the contracts defined by the consumer tests. It reads the `mission-control-api.json` pact file and verifies each interaction against the live backend.

**File:** `contracts/provider/pact-verification.test.py`

**How to Run:**

1.  Ensure you have `pytest` and `httpx[http2]`, `pytest-asyncio`, `pytest-anyio` installed in your backend environment.
    ```bash
    cd /mnt/c/ANTIGRAVITY/backend/fastapi-app/
    pip install -r requirements.txt # Or ensure these are installed
    pip install pytest httpx[http2] pytest-asyncio pytest-anyio
    ```
2.  Run the Pytest tests:
    ```bash
    cd /mnt/c/ANTIGRAVITY/backend/fastapi-app/
    pytest ../../contracts/provider/pact-verification.test.py -v
    ```

## Running All Contract Tests

A convenience script is provided to run both the consumer and provider tests sequentially.

**File:** `contracts/run-contract-tests.sh`

**How to Run:**

```bash
/bin/bash /mnt/c/ANTIGRAVITY/contracts/run-contract-tests.sh
```

This script will:

1.  Install `npm` dependencies for `mission-control` (if not already done).
2.  Run the consumer tests, generating the pact file.
3.  Install Python dependencies for the FastAPI backend (if not already done).
4.  Run the provider verification tests.

## Updating Contracts

1.  Modify the consumer test (`mission-control-pact-test.ts`) to reflect new API expectations.
2.  Run the consumer tests to generate an updated `mission-control-api.json`.
3.  Run the provider verification tests.
    - If they fail, update the backend API to match the new contract.
    - If they pass, the contract is successfully updated and verified.
4.  Commit the updated `mission-control-api.json` along with any corresponding code changes.
