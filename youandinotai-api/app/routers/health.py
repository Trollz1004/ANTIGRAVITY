"""Health router for service status and dependency checks."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import check_db_health, get_db
from app.models import User
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_connected = await check_db_health()

    user_count = 0
    if db_connected:
        count_result = await db.scalar(select(func.count(User.id)))
        user_count = int(count_result or 0)

    # Square uses payment links — no API key to validate at health check.
    # Payment processing is confirmed via webhooks.
    square_active = True

    status_value = "ok" if db_connected else "degraded"
    return HealthResponse(
        status=status_value,
        db_connected=db_connected,
        square_active=square_active,
        user_count=user_count,
    )