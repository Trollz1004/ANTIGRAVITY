"""FastAPI entrypoint for the YouAndINotAI REST API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health, match, users, webhooks

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="REST backend for registration, Stripe webhooks, and matching.",
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

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(webhooks.router, prefix="/api/v1", tags=["webhooks"])
app.include_router(match.router, prefix="/api/v1", tags=["match"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with service metadata."""
    return {
        "service": settings.app_name,
        "status": "running",
        "version": settings.app_version,
        "docs_url": "/api/v1/docs",
    }