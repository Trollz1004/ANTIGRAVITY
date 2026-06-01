import time
import asyncio
import json
import hashlib
from collections import deque
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .logging_config import setup_logging, get_logger, new_request_id, LogContext
from .routes import health, deploy, runbooks, hermes, tasks, ops_runs, adapters, goals
from .middleware.sanitization import SanitizationMiddleware
from .middleware.rate_limiting import RateLimitingMiddleware
from .middleware.idempotency import IdempotencyMiddleware

# Global in-memory cache for request deduplication
request_cache = {} # Stores (response_body, status_code, headers, expiration_time)
in_flight_requests = {} # Stores asyncio.Event for requests currently being processed
cache_cleanup_queue = deque() # Stores (expiration_time, request_key) for efficient cleanup

# ── Logging setup ────────────────────────────────────────────────────────────
setup_logging(level="INFO")
logger = get_logger(__name__)

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Mission Control API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Input sanitization middleware ────────────────────────────────────────────
app.add_middleware(SanitizationMiddleware)

# ── Rate limiting middleware ──────────────────────────────────────────────────
app.add_middleware(RateLimitingMiddleware)

# ── Idempotency key middleware ───────────────────────────────────────────────
app.add_middleware(IdempotencyMiddleware)


# ── Request tracing middleware ───────────────────────────────────────────────
class RequestTracingMiddleware(BaseHTTPMiddleware):
    """Assigns X-Request-ID, tracks duration, and logs every request."""

    async def dispatch(self, request: Request, call_next):
        # Extract or generate request ID
        request_id = request.headers.get("X-Request-ID") or new_request_id()
        request.state.request_id = request_id

        # Extract user ID from header if present (e.g. set by an auth proxy)
        user_id = request.headers.get("X-User-ID")
        request.state.user_id = user_id

        # Set context so all log records in this request carry the fields
        LogContext.set_request_id(request_id)
        LogContext.set_user_id(user_id)

        # Generate a unique key for the request for deduplication
        request_key = await self._get_request_key(request)

        # ── Request Deduplication Logic ──────────────────────────────────────────
        # Check if an identical request is already in flight
        if request_key in in_flight_requests:
            logger.info("Duplicate request in flight, waiting for response", extra={"request_key": request_key})
            await in_flight_requests[request_key].wait() # Wait for the original request to complete
            cached_response_data = request_cache.get(request_key)
            if cached_response_data:
                response_body, status_code, headers, _ = cached_response_data
                logger.info("Returning cached response for in-flight duplicate", extra={"request_key": request_key, "status_code": status_code})
                return Response(content=response_body, status_code=status_code, headers=headers, media_type="application/json") # Assume JSON for now

        # Check if an identical request has been recently completed and cached
        if request_key in request_cache:
            response_body, status_code, headers, expiration_time = request_cache[request_key]
            if time.time() < expiration_time:
                logger.info("Returning cached response", extra={"request_key": request_key, "status_code": status_code})
                # FastAPI's Response class handles headers for us. We need to recreate it.
                return Response(content=response_body, status_code=status_code, headers=headers, media_type="application/json")
            else:
                # Cache expired, remove it and proceed with new request
                logger.info("Cached response expired", extra={"request_key": request_key})
                del request_cache[request_key]
                # No need to remove from cleanup queue, it will be naturally purged or ignored if already removed

        # If not in cache or in-flight, process the request
        request_event = asyncio.Event()
        in_flight_requests[request_key] = request_event
        response = None # Initialize response outside try block

        start = time.monotonic()
        try:
            response = await call_next(request)
            response_body = b''
            # Skip body caching for streaming/file responses (no .body attr).
            # Starlette StreamingResponse / FileResponse would 500 the dedup middleware.
            if hasattr(response, 'body') and not getattr(response, 'body_iterator', None):
                try:
                    body_attr = response.body
                    if body_attr:
                        if hasattr(body_attr, '__await__'):
                            response_body = await body_attr
                        else:
                            response_body = bytes(body_attr)
                        if not isinstance(response_body, (bytes, bytearray)):
                            response_body = bytes(response_body)
                        response.extra = getattr(response, 'extra', {}) or {}
                        response.extra['body'] = response_body
                        # Only cache if the body is small enough (≤ 256KB)
                        if len(response_body) <= 256 * 1024:
                            expiration_time = time.time() + settings.REQUEST_DEDUPLICATION_SECONDS
                            response_headers = {k: v for k, v in response.headers.items()}
                            request_cache[request_key] = (response_body, response.status_code, response_headers, expiration_time)
                            cache_cleanup_queue.append((expiration_time, request_key))
                except Exception as body_err:
                    logger.debug("body read skipped", extra={"err": str(body_err)})
            # else: streaming/file response — skip caching, just pass through

        except Exception as exc:
            duration_ms = int((time.monotonic() - start) * 1000)
            LogContext.set_duration_ms(duration_ms)
            logger.error(
                "unhandled exception",
                exc_info=True,
                extra={"path": request.url.path, "method": request.method},
            )
            # Remove from in-flight requests on exception
            if request_key in in_flight_requests:
                del in_flight_requests[request_key]
            request_event.set() # Signal completion even on error
            raise
        finally:
            duration_ms = int((time.monotonic() - start) * 1000)
            LogContext.set_duration_ms(duration_ms)
            # Clear per-request context
            LogContext.clear()

            # Signal completion for any waiting duplicate requests
            if request_key in in_flight_requests:
                in_flight_requests[request_key].set()
                del in_flight_requests[request_key]


        # Attach request ID to response headers for client correlation
        if response:
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Duration-Ms"] = str(duration_ms)

            logger.info(
                "request completed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

        return response
    
    async def _get_request_key(self, request: Request) -> str:
        """Generates a unique key for a request based on method, URL, and body."""
        hash_input = f"{request.method}:{request.url.path}"
        if request.query_params:
            hash_input += f"?{str(request.query_params)}"

        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                # Read body and reconstruct it for other middlewares/handlers
                body = await request.body()
                request.state.body = body # Store body in request state
                if body:
                    hash_input += f":{body.decode('utf-8')}"
            except Exception as e:
                logger.warning(f"Could not read request body for deduplication: {e}")
                # If body cannot be read, proceed without body in hash
                pass
        
        return hashlib.sha256(hash_input.encode("utf-8")).hexdigest()




app.add_middleware(RequestTracingMiddleware)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(deploy.router)
app.include_router(runbooks.router)
app.include_router(hermes.router)
app.include_router(tasks.router)
app.include_router(ops_runs.router)
app.include_router(adapters.router)
app.include_router(goals.router)

# ── Dashboard static mount ───────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parents[4]
DASHBOARD_DIST = REPO_ROOT / "apps" / "mission-control" / "dist"


@app.get("/", include_in_schema=False)
async def root_index():
    index = DASHBOARD_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return JSONResponse(
        {
            "status": "api_ok_dashboard_unbuilt",
            "message": "Mission Control API is running. Build the dashboard with: pnpm --dir apps/mission-control build",
            "api_base": "http://[IP_ADDRESS]:8787",
            "endpoints": ["/health/all", "/runbooks/list", "/hermes/models", "/tasks"],
        }
    )


if DASHBOARD_DIST.exists():
    app.mount("/assets", StaticFiles(directory=DASHBOARD_DIST / "assets"), name="dashboard-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str, request: Request):
        if full_path.startswith(("health", "deploy", "runbooks", "hermes", "tasks", "assets", "api")):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        index = DASHBOARD_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse({"detail": "Not Found"}, status_code=404)


# ── Startup event ────────────────────────────────────────────────────────────
@app.on_event("startup")
async def log_startup():
    endpoints = []
    for route in app.routes:
        if hasattr(route, "methods") and hasattr(route, "path"):
            for method in route.methods:
                endpoints.append({"method": method, "path": route.path})

    logger.info(
        "Mission Control API started",
        extra={
            "version": "0.1.0",
            "environment": "development" if settings.ALLOWED_ORIGINS else "production",
            "endpoints": endpoints,
            "dashboard_built": DASHBOARD_DIST.exists(),
        },
    )
