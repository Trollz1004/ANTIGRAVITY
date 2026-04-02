"""FastAPI entrypoint for the YouAndINotAI REST API."""

import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import reconcile_legacy_schema
from app.scheduler import setup_scheduler
from app.routers import auth, billing, boards, double_dates, events, health, lovebot, messages, metrics, privacy, profiles, support, swipe, users, verify, video, video_rooms, volunteering, waitlist, webhooks

settings = get_settings()

TOXIC_KEYWORDS = ("guaranteed", "trust me", "never lied", "promise", "action", "marriage speedrun")


def _is_messages_post(request: Request) -> bool:
    return request.method == "POST" and request.url.path.startswith("/api/v1/messages")


def _log_suitability_flags(request: Request, body: bytes) -> None:
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
            print(f"[GUARD] Suitability flag detected: '{keyword}' in message from IP {host}")
            break


@asynccontextmanager
async def lifespan(app: FastAPI):
    await reconcile_legacy_schema()
    # Startup: Start background scheduler
    scheduler = setup_scheduler()
    yield
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

@app.middleware("http")
async def suitability_guard(request: Request, call_next):
    if not _is_messages_post(request):
        return await call_next(request)

    body = await request.body()
    _log_suitability_flags(request, body)

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    replay_request = Request(request.scope, receive)
    return await call_next(replay_request)

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
app.include_router(support.router, prefix="/api/v1", tags=["support"])
app.include_router(video.router, prefix="/api/v1", tags=["video"])
app.include_router(video_rooms.router, prefix="/api/v1", tags=["video-rooms"])
app.include_router(double_dates.router, prefix="/api/v1", tags=["double-dates"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(waitlist.router, prefix="/api/v1", tags=["waitlist"])

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
