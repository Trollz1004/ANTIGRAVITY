"""FastAPI entrypoint for the YouAndINotAI REST API."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import json

from app.config import get_settings
from app.scheduler import setup_scheduler
from app.routers import auth, boards, double_dates, events, health, messages, metrics, privacy, profiles, swipe, verify, video, video_rooms, volunteering, webhooks

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background scheduler
    scheduler = setup_scheduler()
    yield
    # Shutdown: Stop scheduler
    scheduler.shutdown()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="YouAndINotAI — Social Platform for Good",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# ── WebSocket Signaling for Video ─────────────────────────────────────────────

# In-memory session tracking for signaling
# In production, use Redis for multi-node support
video_sessions: dict[str, list[WebSocket]] = {}

@app.websocket("/api/v1/video/signaling/{match_id}")
async def video_signaling(websocket: WebSocket, match_id: str):
    await websocket.accept()
    if match_id not in video_sessions:
        video_sessions[match_id] = []
    
    video_sessions[match_id].append(websocket)
    
    try:
        while True:
            # Relay SDP/ICE candidates between peers in the same match
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Broadcast to other participants in this match
            for client in video_sessions[match_id]:
                if client != websocket:
                    await client.send_text(json.dumps(message))
                    
    except WebSocketDisconnect:
        video_sessions[match_id].remove(websocket)
        if not video_sessions[match_id]:
            del video_sessions[match_id]

# ── Middlewares & Routers ─────────────────────────────────────────────────────

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
app.include_router(video_rooms.router, prefix="/api/v1", tags=["video-rooms"])
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
