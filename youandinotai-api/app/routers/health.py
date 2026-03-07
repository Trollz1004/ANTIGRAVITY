"""Health router for service status and dependency checks."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import check_db_health, get_db
from app.models import User
from app.schemas import HealthResponse

router = APIRouter()
settings = get_settings()


def _square_health_ready() -> bool:
    payment_link_ready = bool(str(settings.square_bot_shield_payment_link or "").strip())
    if not settings.square_webhook_verify_signature:
        return payment_link_ready

    signature_key_ready = bool(str(settings.square_webhook_signature_key or "").strip())
    notification_url_ready = bool(str(settings.square_webhook_notification_url or "").strip())
    return payment_link_ready and signature_key_ready and notification_url_ready


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_connected = await check_db_health()

    user_count = 0
    if db_connected:
        count_result = await db.scalar(select(func.count(User.id)))
        user_count = int(count_result or 0)

    square_connected = _square_health_ready()

    status_value = "ok" if db_connected and square_connected else "degraded"
    return HealthResponse(
        status=status_value,
        db_connected=db_connected,
        square_connected=square_connected,
        user_count=user_count,
    )
