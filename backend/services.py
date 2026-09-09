"""
Watchdog + Image generation backends.

Watchdog: synthetic per-tick heartbeats for tier-0 agents (CEO/CFO/CMO/CTO)
and an alert ribbon endpoint that surfaces any agent silent > 5 minutes.

Image gen: Gemini Nano Banana via Emergent universal key.
"""
from __future__ import annotations

import asyncio
import base64
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from mongo import get_db
from pydantic import BaseModel, Field

log = logging.getLogger("watchdog")

_db = get_db()
HEARTBEATS = _db.heartbeats
IMAGES = _db.images

TIER_ZERO = ["ceo", "cfo", "cmo", "cto", "e1"]
SILENT_THRESHOLD = timedelta(minutes=5)

router = APIRouter(prefix="/api")


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Watchdog ────────────────────────────────────────────────────────────── #
@router.get("/watchdog/status")
async def watchdog_status():
    """Returns current alerts + last-seen timestamps for tier-0 agents."""
    alerts: List[Dict[str, Any]] = []
    seen: List[Dict[str, Any]] = []
    cutoff = _now() - SILENT_THRESHOLD
    for agent in TIER_ZERO:
        hb = await HEARTBEATS.find_one({"agent": agent}, {"_id": 0})
        if not hb:
            alerts.append({"agent": agent, "level": "warn", "reason": "no heartbeat recorded"})
            seen.append({"agent": agent, "at": None, "stale": True})
            continue
        try:
            at = datetime.fromisoformat(hb["at"].replace("Z", "+00:00"))
        except Exception:
            at = _now()
        stale = at < cutoff
        seen.append({"agent": agent, "at": hb["at"], "stale": stale})
        if stale:
            alerts.append({"agent": agent, "level": "alert", "reason": f"silent > 5min · last {hb['at']}"})
    return {"alerts": alerts, "agents": seen, "ok": len(alerts) == 0, "checked_at": _now().isoformat()}


async def _heartbeat_loop():
    """Background tick — synthetic 'alive' beat for tier-0 agents every 60s.
    Joshua's real workstation can override these with explicit POSTs."""
    while True:
        try:
            for agent in TIER_ZERO:
                doc = {"agent": agent, "at": _now().isoformat(), "state": "alive", "note": "auto"}
                await HEARTBEATS.update_one({"agent": agent}, {"$set": doc}, upsert=True)
        except Exception as e:  # noqa: BLE001 — keep the loop alive
            log.exception("watchdog tick failed: %s", e)
        await asyncio.sleep(60)


def install_watchdog(app):
    """FastAPI startup hook — kicks off the background tick task."""
    @app.on_event("startup")
    async def _start_watchdog():
        asyncio.create_task(_heartbeat_loop())


# ── Image generation · Gemini Nano Banana ──────────────────────────────── #
class ImageRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=600)
    model: str = "gemini-3.1-flash-image-preview"


@router.post("/images/generate")
async def generate_image(body: ImageRequest, request: Request):
    """Generate one image via Gemini Nano Banana, persist metadata, return base64."""
    require_admin(request)
    api_key = os.environ.get("EMERGENT_LLM_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="EMERGENT_LLM_KEY missing")

    from emergentintegrations.llm.chat import LlmChat, UserMessage  # late import

    session_id = f"image-{uuid.uuid4().hex[:8]}"
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message="You are a precise creative image-generation assistant for OpusPawClaw.",
    ).with_model("gemini", body.model).with_params(modalities=["image", "text"])

    try:
        text, images = await chat.send_message_multimodal_response(UserMessage(text=body.prompt))
    except Exception as e:
        log.exception("nano-banana failed")
        raise HTTPException(status_code=502, detail=f"image gen failed: {e}") from e

    if not images:
        raise HTTPException(status_code=502, detail="model returned no image")

    # Base64 from emergentintegrations is the raw payload — wrap it as a data URI.
    img = images[0]
    data_uri = f"data:{img.get('mime_type','image/png')};base64,{img['data']}"
    record = {
        "id": uuid.uuid4().hex[:12],
        "prompt": body.prompt,
        "model": body.model,
        "mime_type": img.get("mime_type", "image/png"),
        "text": text or "",
        "data_uri": data_uri,
        "created_at": _now().isoformat(),
    }
    # Store everything except the bulky data_uri snippet — keep first 60 chars only.
    await IMAGES.insert_one({**record, "data_preview": data_uri[:60]})
    return record


@router.get("/images")
async def list_images(limit: int = 24):
    """Recent generations — without the heavy base64 payload."""
    rows = await IMAGES.find({}, {"_id": 0, "data_uri": 0}).sort("created_at", -1).to_list(limit)
    return {"images": rows, "count": len(rows)}
