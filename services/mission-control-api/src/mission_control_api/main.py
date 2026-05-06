from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .routes import health, deploy, runbooks, hermes, tasks

app = FastAPI(title="Mission Control API")

origins = settings.ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(deploy.router)
app.include_router(runbooks.router)
app.include_router(hermes.router)
app.include_router(tasks.router)

# Mount the built Mission Control dashboard so one process serves API + UI.
# Build once with `pnpm --dir ../../apps/mission-control build`. If dist/ is
# missing, a friendly message is served at "/" instead of crashing the API.
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
            "api_base": "http://127.0.0.1:8787",
            "endpoints": ["/health/all", "/runbooks/list", "/hermes/models", "/tasks"],
        }
    )


if DASHBOARD_DIST.exists():
    app.mount("/assets", StaticFiles(directory=DASHBOARD_DIST / "assets"), name="dashboard-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str, request: Request):
        # Anything not matched by API routes falls through to the SPA index.
        # Skip API namespaces so 404s remain real for unknown API calls.
        if full_path.startswith(("health", "deploy", "runbooks", "hermes", "tasks", "assets", "api")):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        index = DASHBOARD_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse({"detail": "Not Found"}, status_code=404)
