import uuid
from typing import Annotated

from fastapi import Depends, Query, WebSocket, WebSocketException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import decode_token, ensure_active_user
from app.database import get_db
from app.models import User


async def get_current_websocket_user(
    websocket: WebSocket,
    token: Annotated[str, Query(alias="token")],
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token payload"
            )

        parsed_user_id = uuid.UUID(str(user_id))
    except Exception:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Could not validate credentials",
        )

    user = await db.scalar(select(User).where(User.id == parsed_user_id))
    if not user:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="User not found"
        )

    try:
        ensure_active_user(user)
    except Exception:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Account is inactive"
        )

    return user
