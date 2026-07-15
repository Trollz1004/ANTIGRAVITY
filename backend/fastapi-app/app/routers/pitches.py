"""Founder pitch creation/update router."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Pitch, User
from app.schemas import PitchCreateRequest, PitchResponse, PitchUpdateRequest

router = APIRouter(prefix="/pitches")


@router.post("", response_model=PitchResponse, status_code=201)
async def create_pitch(
    payload: PitchCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Pitch:
    pitch = Pitch(
        id=uuid.uuid4(),
        founder_id=user.id,
        title=payload.title,
        summary=payload.summary,
        ask=payload.ask,
        status=payload.status,
    )
    db.add(pitch)
    await db.commit()
    await db.refresh(pitch)
    return pitch


@router.get("", response_model=list[PitchResponse])
async def list_my_pitches(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Pitch]:
    query = (
        select(Pitch)
        .where(Pitch.founder_id == user.id)
        .order_by(Pitch.created_at.desc())
    )
    return (await db.scalars(query)).all()


@router.get("/{pitch_id}", response_model=PitchResponse)
async def get_pitch(
    pitch_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Pitch:
    pitch = await db.get(Pitch, pitch_id)
    if not pitch or pitch.founder_id != user.id:
        raise HTTPException(status_code=404, detail="Pitch not found")
    return pitch


@router.patch("/{pitch_id}", response_model=PitchResponse)
async def update_pitch(
    pitch_id: uuid.UUID,
    payload: PitchUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Pitch:
    pitch = await db.get(Pitch, pitch_id)
    if not pitch or pitch.founder_id != user.id:
        raise HTTPException(status_code=404, detail="Pitch not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(pitch, field, value)

    await db.commit()
    await db.refresh(pitch)
    return pitch
