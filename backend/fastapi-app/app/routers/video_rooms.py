"""Daily.co video room creation router."""

import time
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_verified_profile
from app.config import get_settings
from app.database import get_db
from app.models import Match, User

router = APIRouter(prefix="/video/rooms")
settings = get_settings()


@router.post("/{match_id}")
async def create_video_room(
    match_id: uuid.UUID,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
):
    """Creates a Daily.co video room for a match session.

    This is the actual entry point VideoCall.tsx calls before connecting to
    /ws/video/{call_id} -- gating only the signaling WebSocket left this
    route reachable by any authenticated (even unverified) caller with an
    arbitrary match_id, handing out a public, joinable Daily.co room URL
    with no membership or verification check at all. Requires the caller to
    be verified and an actual participant in an active match, and the other
    participant to be currently verified too, matching /ws/video.
    """
    match = await db.get(Match, match_id)
    if (
        not match
        or match.status != "active"
        or user.id
        not in (
            match.user_a,
            match.user_b,
        )
    ):
        raise HTTPException(status_code=404, detail="Match not found")

    other_id = match.user_b if match.user_a == user.id else match.user_a
    other_user = await db.get(User, other_id)
    if not other_user or not other_user.bot_shield_verified:
        raise HTTPException(status_code=403, detail="The other member is not verified")

    room_name = f"match-{match_id}"

    # A missing Daily.co API key is a server configuration error — never
    # fabricate a fake room URL that cannot be joined.
    if not settings.daily_api_key:
        raise HTTPException(
            status_code=503,
            detail="Video provider is not configured (DAILY_API_KEY missing)",
        )

    # Prepare room expiry (1 hour from now)
    expiry = int(time.time()) + 3600

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.daily.co/v1/rooms",
                headers={
                    "Authorization": f"Bearer {settings.daily_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "name": room_name,
                    "privacy": "public",
                    "properties": {
                        "enable_chat": True,
                        "max_participants": 2,
                        "exp": expiry,
                    },
                },
                timeout=10.0,
            )

            # Handle existing room conflict
            if response.status_code == 400 and "already exists" in response.text:
                # Retrieve existing room info
                get_response = await client.get(
                    f"https://api.daily.co/v1/rooms/{room_name}",
                    headers={"Authorization": f"Bearer {settings.daily_api_key}"},
                )
                if get_response.status_code == 200:
                    room_data = get_response.json()
                    return {
                        "room_url": room_data["url"],
                        "room_name": room_data["name"],
                    }

            if response.status_code != 200:
                raise HTTPException(
                    status_code=502, detail=f"Daily.co API error: {response.text}"
                )

            room_data = response.json()
            return {"room_url": room_data["url"], "room_name": room_data["name"]}

        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502, detail=f"Connection to Daily.co failed: {exc}"
            )
