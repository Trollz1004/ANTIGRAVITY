import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..envelope import Envelope

router = APIRouter(prefix="/hermes", tags=["hermes"])

REPO_ROOT = Path(__file__).resolve().parents[5]
STATE_DIR = REPO_ROOT / "services" / "mission-control-api" / "data"
STATE_FILE = STATE_DIR / "hermes-active.json"

MODEL_CHIPS = ["hermes", "hermes-deep", "cfo", "code", "marketing", "kimi", "fast"]


class ActiveModel(BaseModel):
    model: str


def _read_active() -> str:
    try:
        if STATE_FILE.exists():
            data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            active = data.get("active")
            if active in MODEL_CHIPS:
                return active
    except Exception:
        pass
    return "hermes"


def _write_active(model: str) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(
        json.dumps({"active": model, "updated_at": datetime.now(timezone.utc).isoformat()}, indent=2),
        encoding="utf-8",
    )


@router.get("/models")
async def get_models() -> Envelope:
    started = datetime.now(timezone.utc)
    return Envelope(
        status="ok",
        checked_at=started,
        latency_ms=0,
        details={"models": MODEL_CHIPS, "active": _read_active()},
        error=None,
    )


@router.post("/active")
async def set_active(payload: ActiveModel):
    if payload.model not in MODEL_CHIPS:
        raise HTTPException(status_code=400, detail=f"unknown model: {payload.model}")
    _write_active(payload.model)
    return {"active": payload.model, "updated": True}
