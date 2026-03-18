"""FastAPI entrypoint for the YouAndINotAI REST API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.routers import auth, boards, double_dates, events, health, messages, metrics, privacy, profiles, swipe, verify, video, volunteering, webhooks

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="YouAndINotAI — Social Platform for Good",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
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
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(profiles.router, prefix="/api/v1", tags=["profiles"])
app.include_router(swipe.router, prefix="/api/v1", tags=["swipe"])
app.include_router(messages.router, prefix="/api/v1", tags=["messages"])
app.include_router(boards.router, prefix="/api/v1", tags=["boards"])
app.include_router(events.router, prefix="/api/v1", tags=["events"])
app.include_router(volunteering.router, prefix="/api/v1", tags=["volunteering"])
app.include_router(webhooks.router, prefix="/api/v1", tags=["webhooks"])
app.include_router(verify.router, prefix="/api/v1", tags=["verification"])
app.include_router(metrics.router, prefix="/api/v1", tags=["metrics"])
app.include_router(privacy.router, prefix="/api/v1", tags=["privacy"])
app.include_router(video.router, prefix="/api/v1", tags=["video"])
app.include_router(double_dates.router, prefix="/api/v1", tags=["double-dates"])

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
