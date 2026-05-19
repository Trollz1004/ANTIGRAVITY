# Chaos Engineering Tests for ANTIGRAVITY Backend

This document details the chaos engineering test suite implemented for the ANTIGRAVITY backend (`fastapi-app`). These tests are designed to verify the system's resilience and graceful degradation under various adverse conditions, without requiring actual infrastructure changes.

## What Chaos Tests Cover

The chaos engineering test suite aims to validate the backend's behavior when:

1.  **Database Connection Fails:** The API should respond gracefully, typically with a `503 Service Unavailable` or a degraded health status, when it cannot connect to its primary database.
2.  **Primary Service is Slow:** The API should continue to function, potentially by serving cached or stale data, when an upstream dependency (like the database or another microservice) experiences latency.
3.  **High Concurrent Load:** The API should rate-limit requests gracefully under heavy load, preventing resource exhaustion and ensuring fair access.
4.  **Transient Failures:** The API should be able to recover automatically after temporary outages or intermittent errors in its dependencies.
5.  **Dependency Degraded Status:** The health endpoint should accurately reflect the degraded status of the application when one or more critical dependencies are unhealthy, rather than reporting a complete outage.

## How to Run Chaos Tests

The chaos engineering tests are integrated into the existing `pytest` framework.

1.  Navigate to the backend application directory:
    ```bash
    cd /mnt/c/ANTIGRAVITY/backend/fastapi-app
    ```
2.  Run the chaos engineering test suite using `pytest`:
    ```bash
    python -m pytest tests/test_chaos_engineering.py -v --timeout=30
    ```
    *   `-v`: Provides verbose output, showing details of each test.
    *   `--timeout=30`: Sets a 30-second timeout for the entire test run to prevent hangs, although individual tests are designed to be fast.

## Scenarios Tested and Why

### 1. API responds with 503 when DB connection is simulated to fail (or degraded status)

*   **Scenario:** The `check_db_health` function (or `get_db` dependency) is mocked to either return `False` or raise an exception, simulating a database outage.
*   **Why:** To ensure that the API does not crash and instead responds with an appropriate error code (`503 Service Unavailable` where applicable) or a `200 OK` with a `status: degraded` in the health endpoint, indicating that the service is experiencing issues but is still operational. This prevents a complete service blackout and provides clearer feedback to clients.

### 2. API returns cached/stale data when primary service is slow (via mock)

*   **Scenario:** A critical dependency (e.g., a database query for user count) is mocked to introduce artificial latency.
*   **Why:** To verify that the API can still serve responses within a reasonable timeframe, possibly by using fallback mechanisms like cached data, even when dependencies are slow. This enhances user experience by preventing long waits or timeouts. (Note: For this specific implementation, we verify the health endpoint still responds correctly with potentially stale data, as full caching logic isn't universally applied to all endpoints.)

### 3. API rate-limits gracefully under high concurrent load (using `asyncio.gather` with 50 concurrent requests)

*   **Scenario:** 50 concurrent requests are sent to a simple endpoint (e.g., `/api/v1/health`) using a `ThreadPoolExecutor` to simulate high load.
*   **Why:** To ensure the rate-limiting middleware correctly identifies and blocks excessive requests with `429 Too Many Requests` status, rather than crashing or becoming unresponsive. It also verifies that successful requests still receive rate-limit headers, providing transparent feedback to clients.

### 4. API recovers after transient failures (simulate failure then verify recovery)

*   **Scenario:** The `check_db_health` mock is configured to initially fail (return `False` or raise an exception) for a few calls, and then succeed on subsequent calls.
*   **Why:** To confirm that the application can self-heal and return to a healthy state once transient issues with a dependency are resolved. This is crucial for maintaining high availability in dynamic cloud environments where temporary network glitches or service restarts are common.

### 5. Health endpoint reports degraded status when a dependency is down

*   **Scenario:** Critical dependencies (e.g., database, Square API credentials) are individually or collectively mocked to be unavailable or misconfigured.
*   **Why:** The health endpoint is vital for monitoring and automated deployments. These tests ensure it accurately reflects the operational status of the application, distinguishing between a fully healthy state, a degraded state (where some services are impaired but not critical), and a complete outage. This helps in quick detection and resolution of issues.