"""Daily.co video room creation router."""

import time
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.config import get_settings
from app.models import Match, User

router = APIRouter(prefix="/video/rooms")
settings = get_settings()


@router.post("/{match_id}")
async def create_video_room(
    match_id: uuid.UUID,
    user: User = Depends(get_current_user),
):
    """Creates a Daily.co video room for a match session."""
    # Logic follows the exact requested patterns
    room_name = f"match-{match_id}"

    # If API key is missing, return a mock room for development
    if not settings.daily_api_key:
        return {
            "room_url": f"https://youandinotai.daily.co/{room_name}",
            "room_name": room_name,
            "is_mock": True,
        }

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
