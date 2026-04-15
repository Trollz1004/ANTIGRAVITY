"""Local launcher for the YouAndINotAI FastAPI backend."""

from __future__ import annotations

import os

import uvicorn

from app.config import get_settings


def main() -> None:
    settings = get_settings()
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = settings.app_env.lower() == "development"

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=reload_enabled,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )


if __name__ == "__main__":
    main()
