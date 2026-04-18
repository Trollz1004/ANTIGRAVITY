"""FastAPI entrypoint for the YouAndINotAI REST API."""

import asyncio
import json
import logging
import os
import traceback
import uuid
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.database import reconcile_legacy_schema
from app.logging_config import setup_logging
from app.monitoring import setup_monitoring
from app.scheduler import setup_scheduler
from app.security import (
    RateLimitMiddleware,
    InputValidationMiddleware,
    SecurityHeadersMiddleware,
)
from app.routers import (
    auth,
    billing,
    boards,
    double_dates,
    events,
    health,
    lovebot,
    marketing,
    messages,
    metrics,
    privacy,
    profiles,
    safety,
    support,
    swipe,
    users,
    verify,
    video,
    video_rooms,
    volunteering,
    waitlist,
    webhooks,
)

# Configure structured logging
setup_logging()
logger = logging.getLogger("youandinotai.api")

settings = get_settings()

TOXIC_KEYWORDS = (
    "guaranteed",
    "trust me",
    "never lied",
    "promise",
    "action",
    "marriage speedrun",
)


def _generate_correlation_id() -> str:
    """Generate a unique correlation ID for request tracing."""
    return str(uuid.uuid4())


def _is_messages_post(request: Request) -> bool:
    return request.method == "POST" and request.url.path.startswith("/api/v1/messages")


def _log_suitability_flags(request: Request, body: bytes, correlation_id: str) -> None:
    try:
        payload = json.loads(body)
    except Exception:
        return
    content = payload.get("content", "")
    if not isinstance(content, str):
        return
    lowered = content.lower()
    for keyword in TOXIC_KEYWORDS:
        if keyword in lowered:
            host = request.client.host if request.client else "unknown"
            logger.warning(
                "[GUARD] Suitability flag detected",
                extra={
                    "correlation_id": correlation_id,
                    "flagged_keyword": keyword,
                    "client_ip": host,
                    "content_preview": content[:100] if content else "",
                },
            )
            break


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Configure structured logging
    setup_logging()

    # Startup: Initialize monitoring
    setup_monitoring(
        sentry_dsn=getattr(settings, "sentry_dsn", None),
        prometheus_port=getattr(settings, "prometheus_port", None),
    )

    # Startup: Reconcile database schema
    await reconcile_legacy_schema()

    # Startup: Start background scheduler
    scheduler = setup_scheduler()

    logger.info("Application startup complete")
    yield
    logger.info("Application shutdown initiated")
    # Shutdown: Stop scheduler
    scheduler.shutdown()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="YouAndINotAI - Social Platform for Good",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# Add security middleware (order matters - InputValidation should be first)
app.add_middleware(InputValidationMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    """Add correlation ID and structured logging to all requests."""
    correlation_id = _generate_correlation_id()

    # Add correlation ID to request state for use in handlers
    request.state.correlation_id = correlation_id

    # Log incoming request
    logger.info(
        "Incoming request",
        extra={
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown"),
        },
    )

    # Track metrics if Prometheus is available
    start_time = time.time()
    if (
        hasattr(app.state, "monitoring")
        and app.state.monitoring.REQUEST_IN_PROGRESS_GAUGE
    ):
        app.state.monitoring.REQUEST_IN_PROGRESS_GAUGE.inc()

    try:
        response = await call_next(request)

        # Record metrics for successful response
        if hasattr(app.state, "monitoring"):
            monitoring = app.state.monitoring
            if monitoring.REQUEST_COUNTER:
                monitoring.REQUEST_COUNTER.labels(
                    method=request.method,
                    endpoint=request.url.path,
                    status_code=response.status_code,
                ).inc()
            if monitoring.REQUEST_DURATION_HISTOGRAM:
                monitoring.REQUEST_DURATION_HISTOGRAM.labels(
                    method=request.method, endpoint=request.url.path
                ).observe(time.time() - start_time)
            if monitoring.REQUEST_IN_PROGRESS_GAUGE:
                monitoring.REQUEST_IN_PROGRESS_GAUGE.dec()

        # Log successful response
        logger.info(
            "Request completed",
            extra={
                "correlation_id": correlation_id,
                "status_code": response.status_code,
                "method": request.method,
                "path": request.url.path,
                "duration": time.time() - start_time,
            },
        )

        # Add correlation ID to response headers for debugging
        response.headers["X-Correlation-ID"] = correlation_id
        return response

    except Exception as e:
        # Record metrics for error response
        if (
            hasattr(app.state, "monitoring")
            and app.state.monitoring.REQUEST_IN_PROGRESS_GAUGE
        ):
            app.state.monitoring.REQUEST_IN_PROGRESS_GAUGE.dec()

        # Log unhandled exceptions with correlation context
        logger.error(
            "Unhandled exception in request processing",
            extra={
                "correlation_id": correlation_id,
                "method": request.method,
                "path": request.url.path,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc(),
                "duration": time.time() - start_time,
            },
            exc_info=True,
        )
        raise


@app.middleware("http")
async def suitability_guard(request: Request, call_next):
    # Check if this is a messages POST request
    if not _is_messages_post(request):
        return await call_next(request)

    # Get request body
    body = await request.body()

    # Get correlation ID from request state (set by request_context_middleware)
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    # Log suitability flags with correlation context
    _log_suitability_flags(request, body, correlation_id)

    # Replay the request with the same body
    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    replay_request = Request(request.scope, receive)
    return await call_next(replay_request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    logger.error(
        "Global exception handler caught unhandled error",
        extra={
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "error_type": type(exc).__name__,
            "error_message": str(exc),
            "traceback": traceback.format_exc(),
        },
        exc_info=True,
    )

    # Return user-safe error message
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Our team has been notified.",
            "correlation_id": correlation_id,
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handler for HTTP exceptions to ensure consistent error responses."""
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    # Log HTTP exceptions (excluding 404s which are common and expected)
    if exc.status_code != 404:
        logger.warning(
            "HTTP exception occurred",
            extra={
                "correlation_id": correlation_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": exc.status_code,
                "detail": exc.detail,
            },
        )

    # Return consistent error format
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "correlation_id": correlation_id,
        },
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(lovebot.router, prefix="/api/v1", tags=["lovebot"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(profiles.router, prefix="/api/v1", tags=["profiles"])
app.include_router(swipe.router, prefix="/api/v1", tags=["swipe"])
app.include_router(messages.router, prefix="/api/v1", tags=["messages"])
app.include_router(boards.router, prefix="/api/v1", tags=["boards"])
app.include_router(events.router, prefix="/api/v1", tags=["events"])
app.include_router(volunteering.router, prefix="/api/v1", tags=["volunteering"])
app.include_router(webhooks.router, prefix="/api/v1", tags=["webhooks"])
app.include_router(verify.router, prefix="/api/v1", tags=["verification"])
app.include_router(billing.router, prefix="/api/v1", tags=["billing"])
app.include_router(metrics.router, prefix="/api/v1", tags=["metrics"])
app.include_router(privacy.router, prefix="/api/v1", tags=["privacy"])
app.include_router(safety.router, prefix="/api/v1", tags=["safety"])
app.include_router(support.router, prefix="/api/v1", tags=["support"])
app.include_router(video.router, prefix="/api/v1", tags=["video"])
app.include_router(video_rooms.router, prefix="/api/v1", tags=["video-rooms"])
app.include_router(double_dates.router, prefix="/api/v1", tags=["double-dates"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(waitlist.router, prefix="/api/v1", tags=["waitlist"])
app.include_router(marketing.router, prefix="/api/v1", tags=["marketing"])

# Static file serving for uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "status": "running",
        "version": settings.app_version,
        "docs_url": "/api/v1/docs",
    }
