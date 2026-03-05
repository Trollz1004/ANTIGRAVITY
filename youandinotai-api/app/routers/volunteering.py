"""Volunteering opportunities router."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, VolunteerOpportunity, VolunteerSignup
from app.schemas import VolunteerCreateRequest, VolunteerResponse

router = APIRouter(prefix="/volunteer")


@router.get("", response_model=list[VolunteerResponse])
async def list_opportunities(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 30,
) -> list[VolunteerResponse]:
    opps = (
        await db.scalars(
            select(VolunteerOpportunity).order_by(VolunteerOpportunity.created_at.desc()).limit(limit)
        )
    ).all()

    results = []
    for opp in opps:
        signup_count = await db.scalar(
            select(func.count()).select_from(VolunteerSignup).where(VolunteerSignup.opportunity_id == opp.id)
        )
        results.append(
            VolunteerResponse(
                id=opp.id,
                created_by=opp.created_by,
                title=opp.title,
                organization=opp.organization,
                description=opp.description,
                location=opp.location,
                event_date=opp.event_date,
                spots=opp.spots,
                signup_count=signup_count or 0,
                created_at=opp.created_at,
            )
        )
    return results


@router.post("", response_model=VolunteerResponse, status_code=201)
async def create_opportunity(
    payload: VolunteerCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VolunteerResponse:
    opp = VolunteerOpportunity(
        id=uuid.uuid4(),
        created_by=user.id,
        title=payload.title,
        organization=payload.organization,
        description=payload.description,
        location=payload.location,
        event_date=payload.event_date,
        spots=payload.spots,
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)

    return VolunteerResponse(
        id=opp.id,
        created_by=user.id,
        title=opp.title,
        organization=opp.organization,
        description=opp.description,
        location=opp.location,
        event_date=opp.event_date,
        spots=opp.spots,
        signup_count=0,
        created_at=opp.created_at,
    )


@router.post("/{opp_id}/signup")
async def signup_volunteer(
    opp_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    opp = await db.get(VolunteerOpportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    existing = await db.scalar(
        select(VolunteerSignup).where(
            VolunteerSignup.opportunity_id == opp_id,
            VolunteerSignup.user_id == user.id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already signed up")

    if opp.spots:
        count = await db.scalar(
            select(func.count()).select_from(VolunteerSignup).where(VolunteerSignup.opportunity_id == opp_id)
        )
        if count >= opp.spots:
            raise HTTPException(status_code=400, detail="No spots left")

    signup = VolunteerSignup(id=uuid.uuid4(), opportunity_id=opp_id, user_id=user.id)
    db.add(signup)
    await db.commit()
    return {"status": "signed_up", "opportunity_id": str(opp_id)}
