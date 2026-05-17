import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings
from .logging_config import setup_logging, get_logger, new_request_id, LogContext
from .routes import health, deploy, runbooks, hermes, tasks

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

        start = time.monotonic()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = int((time.monotonic() - start) * 1000)
            LogContext.set_duration_ms(duration_ms)
            logger.error(
                "unhandled exception",
                exc_info=True,
                extra={"path": request.url.path, "method": request.method},
            )
            raise
        finally:
            duration_ms = int((time.monotonic() - start) * 1000)
            LogContext.set_duration_ms(duration_ms)
            # Clear per-request context
            LogContext.clear()

        # Attach request ID to response headers for client correlation
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


app.add_middleware(RequestTracingMiddleware)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(deploy.router)
app.include_router(runbooks.router)
app.include_router(hermes.router)
app.include_router(tasks.router)

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
