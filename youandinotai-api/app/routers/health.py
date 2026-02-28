"""Health router for service status and dependency checks."""

from fastapi import APIRouter, Depends
import stripe
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import check_db_health, get_db
from app.models import User
from app.schemas import HealthResponse

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_connected = await check_db_health()

    user_count = 0
    if db_connected:
        count_result = await db.scalar(select(func.count(User.id)))
        user_count = int(count_result or 0)

    stripe_connected = False
    if settings.stripe_secret_key:
        stripe.api_key = settings.stripe_secret_key
        try:
            stripe.Account.retrieve()
            stripe_connected = True
        except Exception:
            stripe_connected = False

    status_value = "ok" if db_connected else "degraded"
    return HealthResponse(
        status=status_value,
        db_connected=db_connected,
        stripe_connected=stripe_connected,
        user_count=user_count,
    )