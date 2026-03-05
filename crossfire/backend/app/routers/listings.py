from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Listing, PlatformListing
from ..schemas import ListingCreate, ListingUpdate, ListingOut

router = APIRouter(prefix="/api/listings", tags=["listings"])


@router.get("/", response_model=list[ListingOut])
async def get_listings(status: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Listing).options(selectinload(Listing.platform_listings)).order_by(Listing.created_at.desc())
    if status:
        q = q.where(Listing.status == status)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{listing_id}", response_model=ListingOut)
async def get_listing(listing_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Listing).options(selectinload(Listing.platform_listings)).where(Listing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(404, "Listing not found")
    return listing


@router.post("/", response_model=ListingOut)
async def create_listing(data: ListingCreate, db: AsyncSession = Depends(get_db)):
    listing = Listing(**data.model_dump())
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing


@router.put("/{listing_id}", response_model=ListingOut)
async def update_listing(listing_id: int, data: ListingUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(404, "Listing not found")

    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(listing, key, val)

    await db.commit()
    await db.refresh(listing)
    return listing


@router.delete("/{listing_id}")
async def delete_listing(listing_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(404, "Listing not found")

    await db.delete(listing)
    await db.commit()
    return {"ok": True}
