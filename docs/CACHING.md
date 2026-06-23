# CACHING.md - Redis Caching Layer for ANTIGRAVITY API

This document outlines the design and implementation of the Redis caching layer within the ANTIGRAVITY FastAPI backend. It covers API response caching, session storage, and rate limiting.

## 1. Architecture Overview

The ANTIGRAVITY API leverages Redis for several key functions to improve performance, scalability, and user experience:

-   **API Response Caching**: Reduces redundant computation and database load for frequently accessed, idempotent endpoints.
-   **Session Storage**: Provides a scalable, distributed store for user session data, enabling multi-instance deployments.
-   **Rate Limiting**: Implements a robust, distributed rate limiting mechanism to protect against abuse and ensure fair resource allocation.

Redis is chosen for its speed, in-memory nature, and excellent support for common caching patterns like TTL (Time-To-Live) expirations and atomic counters.

## 2. API Response Caching (`app/cache.py`)

### Design

API response caching is implemented via a FastAPI decorator `cache_response`. This decorator intercepts `GET` and `HEAD` requests, attempting to serve responses directly from Redis before hitting the endpoint logic. If a cache miss occurs, the endpoint is executed, and its successful `JSONResponse` (status 2xx) is stored in Redis.

-   **Cache Key Generation**: Keys are deterministic and based on:
    -   A configurable `prefix` (e.g., `api`)
    -   HTTP `method` (only `GET` and `HEAD` are cached)
    -   Request `path`
    -   Sorted `query_params`
    -   Optional `vary_on` headers (e.g., `Authorization` for user-specific caching).
    The final key is a SHA256 hash of these components to ensure a fixed length and avoid exposing sensitive path/query info directly in Redis keys.
-   **Serialization**: Responses are stored as JSON blobs containing both the response `body` and `status_code`.
-   **TTL Management**: Each cached entry has a `ttl` (Time-To-Live) that determines how long it remains valid in the cache. This prevents stale data and manages memory usage.
-   **Cache Invalidation**: A utility function `invalidate_cache(pattern)` allows for programmatic invalidation of cache entries using Redis glob-style patterns (e.g., `api:/users:*` to clear all user-related caches).

### TTL Strategy

Default `ttl` for `cache_response` is 300 seconds (5 minutes).

Endpoint-specific TTLs should be determined based on data volatility and access patterns:

-   **Highly Volatile (e.g., real-time user feeds, dynamic data)**: No caching (`ttl=0`) or very short `ttl` (e.g., 30-60 seconds).
-   **Moderately Volatile (e.g., public listings, event details)**: Medium `ttl` (e.g., 5-15 minutes).
-   **Low Volatility (e.g., configuration, static content metadata)**: Long `ttl` (e.g., 1 hour to 24 hours).

Examples of applying `cache_response`:

```python
from fastapi import APIRouter, Request
from app.cache import cache_response, invalidate_cache

router = APIRouter()

@router.get("/public-data")
@cache_response(ttl=300, prefix="public")
async def get_public_data(request: Request):
    # ... fetch data ...
    return {"data": "publicly accessible info"}

@router.get("/user-profile/{user_id}")
@cache_response(ttl=60, prefix="user", vary_on=["authorization"])
async def get_user_profile(user_id: str, request: Request):
    # ... fetch user profile ...
    return {"user_id": user_id, "name": "John Doe"}

# To invalidate a specific user's cache after an update:
# await invalidate_cache(f"cache:user:/user-profile/{user_id}:*")
```

## 3. Session Storage (`app/session_store.py`)

### Design

The `session_store.py` module provides functions for managing user sessions in Redis. This replaces in-memory session solutions, making the API stateless and horizontally scalable.

-   **Session ID Generation**: Each session is assigned a unique UUID.
-   **Data Storage**: Session data (e.g., `user_id`, custom `data` dict) is serialized to JSON and stored as a string in Redis.
-   **TTL-based Expiry**: Sessions are automatically expired after a configurable `ttl`, ensuring old sessions are cleaned up.
-   **Sliding Expiration**: The `touch_session` function can be used to refresh a session's TTL on activity, implementing a sliding expiration.

### Usage

```python
from app.session_store import create_session, get_session, delete_session, touch_session

async def login_user(user_id: str):
    session_data = {"user_agent": "...", "last_login_ip": "..."}
    session_id = await create_session(user_id, session_data, ttl=3600)
    # Return session_id to client (e.g., as a cookie or membership record)

async def authenticate_request(session_id: str):
    session = await get_session(session_id)
    if session:
        await touch_session(session_id) # Refresh TTL
        return session["user_id"]
    return None

async def logout_user(session_id: str):
    await delete_session(session_id)
```

## 4. Rate Limiting (`app/rate_limit_redis.py`)

### Design

The `rate_limit_redis.py` module implements a distributed, sliding-window rate limiter using Redis. This replaces the previous in-memory `RateLimiter` and `RateLimitMiddleware`, providing a more robust solution for multi-instance deployments.

-   **Sliding Window Counter**: Utilizes Redis `INCR` and `EXPIRE` commands within a pipeline to atomically increment counters and set expirations. The `key` is namespaced by the current time window bucket (`key:timestamp_bucket`).
-   **Client Identification**: The `_client_ip` helper function extracts the client's IP address, correctly handling `X-Forwarded-For` and `X-Real-IP` headers when requests originate from trusted proxies (e.g., load balancers, CDNs).
-   **FastAPI Middleware**: `RedisRateLimitMiddleware` is a `BaseHTTPMiddleware` that applies the rate limiting logic globally to incoming requests, rejecting those that exceed the configured `calls_per_minute` (defaults to 60).
-   **Rate Limit Headers**: Responses include standard `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers to inform clients about their rate limit status.

### Replacement of Existing Rate Limiters

The existing in-memory `app/rate_limit.py` and the `RateLimitMiddleware` in `app/security.py` will be removed. The new `RedisRateLimitMiddleware` in `app/rate_limit_redis.py` will be integrated into `app/main.py`.

Specific per-endpoint rate limits (e.g., for auth, verify, waitlist) will be migrated to use the `check_rate_limit` function or configured via the global middleware with appropriate custom keys if necessary.

### Configuration

Rate limiting is configured via environment variables (see `app/config.py`):

-   `REDIS_RATE_LIMIT_WINDOW`: (default: 60) The window duration in seconds for global rate limiting.
-   `AUTH_RATE_LIMIT_PER_MINUTE`: (default: 10) Specific limit for authentication endpoints.
-   `VERIFY_RATE_LIMIT_PER_MINUTE`: (default: 5) Specific limit for verification endpoints.
-   `WAITLIST_RATE_LIMIT_PER_MINUTE`: (default: 5) Specific limit for waitlist endpoints.
-   `RATE_LIMIT_TRUSTED_PROXIES`: (default: `127.0.0.1/32,::1/128`) Comma-separated list of CIDR blocks for trusted proxies. Requests originating from these IPs will have their `X-Forwarded-For` or `X-Real-IP` headers respected for client IP identification.

## 5. Redis Configuration

Redis connection parameters are managed via `app/config.py`:

-   `REDIS_URL`: (default: `redis://localhost:6379/0`) The connection URL for the Redis server. Can include authentication and database selection.
-   `REDIS_MAX_CONNECTIONS`: (default: 20) Maximum number of connections in the Redis connection pool.
-   `REDIS_CACHE_DEFAULT_TTL`: (default: 300) Default TTL for API response cache entries.
-   `REDIS_SESSION_TTL`: (default: 3600) Default TTL for session storage entries.

These can be set via environment variables (e.g., `REDIS_URL=redis://redis-host:6379/1`).

## 6. Running Redis Locally (for Development)

For local development and testing, you can run Redis using Docker:

1.  **Start Redis via Docker:**
    ```bash
    docker run --name antigravity-redis -p 6379:6379 -d redis/redis-stack:latest
    ```
    (Using `redis/redis-stack` provides RedisInsight for easy monitoring, but `redis:latest` is sufficient for basic functionality.)

2.  **Verify Redis Connection (optional):**
    ```bash
    docker exec -it antigravity-redis redis-cli ping
    # Expected output: PONG
    ```

3.  **Stop/Remove Redis:**
    ```bash
    docker stop antigravity-redis
    docker rm antigravity-redis
    ```

By default, the application will attempt to connect to `redis://localhost:6379/0`.
