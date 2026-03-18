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


def _payment_signature_key() -> str:
    return str(
        getattr(settings, "square_payment_webhook_signature_key", "")
        or getattr(settings, "square_webhook_signature_key", "")
        or ""
    ).strip()


def _payment_notification_url() -> str:
    return str(
        getattr(settings, "square_payment_webhook_notification_url", "")
        or getattr(settings, "square_webhook_notification_url", "")
        or ""
    ).strip()


def _square_health_ready() -> bool:
    payment_link_ready = bool(str(settings.square_access_token or "").strip()) and bool(
        str(settings.square_location_id or "").strip()
    )
    return payment_link_ready


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
