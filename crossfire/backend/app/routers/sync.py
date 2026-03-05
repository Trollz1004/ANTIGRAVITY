from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import SyncEvent
from ..schemas import SyncEventOut

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.get("/events", response_model=list[SyncEventOut])
async def get_sync_events(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get recent sync events."""
    result = await db.execute(
        select(SyncEvent).order_by(SyncEvent.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.get("/stats")
async def get_sync_stats(db: AsyncSession = Depends(get_db)):
    """Quick stats: total listings, cross-posted count, sold count."""
    from ..models import Listing, PlatformListing
    from sqlalchemy import func

    total = await db.scalar(select(func.count()).select_from(Listing))
    active = await db.scalar(select(func.count()).select_from(Listing).where(Listing.status == "active"))
    sold = await db.scalar(select(func.count()).select_from(Listing).where(Listing.status == "sold"))
    crossposted = await db.scalar(
        select(func.count(func.distinct(PlatformListing.listing_id))).select_from(PlatformListing).where(PlatformListing.status == "active")
    )

    return {
        "total_listings": total or 0,
        "active": active or 0,
        "sold": sold or 0,
        "crossposted": crossposted or 0,
    }
