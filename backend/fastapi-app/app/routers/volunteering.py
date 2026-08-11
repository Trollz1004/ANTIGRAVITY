"""Volunteering hub router for verified member activities.

Endpoints:
- GET /volunteer — list opportunities (filterable by location, category)
- POST /volunteer — create opportunity
- POST /volunteer/{id}/signup — sign up for an opportunity
- GET /volunteer/impact — aggregate volunteer activity stats
- GET /volunteer/my-signups — user's own volunteer history
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_verified_profile
from app.database import get_db
from app.models import User, VolunteerOpportunity, VolunteerSignup
from app.schemas import (
    MySignupResponse,
    VolunteerCreateRequest,
    VolunteerImpactResponse,
    VolunteerResponse,
)

router = APIRouter(prefix="/volunteer")


@router.get("/impact", response_model=VolunteerImpactResponse)
async def volunteer_impact(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    near: str | None = Query(
        None, description="Filter activity by location (case-insensitive substring)"
    ),
) -> VolunteerImpactResponse:
    """Aggregate volunteer activity shown on the Volunteering Hub dashboard."""

    # Base filter for location
    location_filter = VolunteerOpportunity.location.ilike(f"%{near}%") if near else True

    # Total opportunities
    total_opps = (
        await db.scalar(
            select(func.count(VolunteerOpportunity.id)).where(location_filter)
        )
        or 0
    )

    # Total signups (join through opportunities for location filter)
    if near:
        signup_q = (
            select(func.count(VolunteerSignup.id))
            .join(
                VolunteerOpportunity,
                VolunteerSignup.opportunity_id == VolunteerOpportunity.id,
            )
            .where(location_filter)
        )
    else:
        signup_q = select(func.count(VolunteerSignup.id))
    total_signups = await db.scalar(signup_q) or 0

    # Total hours committed (sum hours_estimate * signup count per opportunity)
    if near:
        hours_q = (
            select(func.coalesce(func.sum(VolunteerOpportunity.hours_estimate), 0))
            .join(
                VolunteerSignup,
                VolunteerSignup.opportunity_id == VolunteerOpportunity.id,
            )
            .where(location_filter)
        )
    else:
        hours_q = select(
            func.coalesce(func.sum(VolunteerOpportunity.hours_estimate), 0)
        ).join(
            VolunteerSignup, VolunteerSignup.opportunity_id == VolunteerOpportunity.id
        )
    total_hours = float(await db.scalar(hours_q) or 0)

    # Unique organizations
    unique_orgs = (
        await db.scalar(
            select(func.count(distinct(VolunteerOpportunity.organization))).where(
                location_filter
            )
        )
        or 0
    )

    # Unique volunteers
    if near:
        vol_q = (
            select(func.count(distinct(VolunteerSignup.user_id)))
            .join(
                VolunteerOpportunity,
                VolunteerSignup.opportunity_id == VolunteerOpportunity.id,
            )
            .where(location_filter)
        )
    else:
        vol_q = select(func.count(distinct(VolunteerSignup.user_id)))
    unique_volunteers = await db.scalar(vol_q) or 0

    # Category breakdown
    cat_rows = (
        await db.execute(
            select(
                VolunteerOpportunity.category,
                func.count(VolunteerSignup.id),
            )
            .join(
                VolunteerSignup,
                VolunteerSignup.opportunity_id == VolunteerOpportunity.id,
            )
            .where(location_filter)
            .group_by(VolunteerOpportunity.category)
        )
    ).all()
    category_breakdown = {row[0]: row[1] for row in cat_rows}

    # Top organizations (by signup count)
    org_rows = (
        await db.execute(
            select(
                VolunteerOpportunity.organization,
                func.count(VolunteerSignup.id).label("signups"),
                func.coalesce(func.sum(VolunteerOpportunity.hours_estimate), 0).label(
                    "hours"
                ),
            )
            .join(
                VolunteerSignup,
                VolunteerSignup.opportunity_id == VolunteerOpportunity.id,
            )
            .where(location_filter)
            .group_by(VolunteerOpportunity.organization)
            .order_by(func.count(VolunteerSignup.id).desc())
            .limit(5)
        )
    ).all()
    top_organizations = [
        {"name": row[0], "signups": row[1], "hours": float(row[2])} for row in org_rows
    ]

    # Local count (always filtered)
    local_count = total_opps if near else 0

    return VolunteerImpactResponse(
        total_opportunities=total_opps,
        total_signups=total_signups,
        total_hours_committed=total_hours,
        unique_organizations=unique_orgs,
        unique_volunteers=unique_volunteers,
        category_breakdown=category_breakdown,
        top_organizations=top_organizations,
        local_opportunities=local_count,
    )


@router.get("/my-signups", response_model=list[MySignupResponse])
async def my_signups(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MySignupResponse]:
    """Get the current user's volunteer signup history."""
    rows = (
        await db.execute(
            select(VolunteerSignup, VolunteerOpportunity)
            .join(
                VolunteerOpportunity,
                VolunteerSignup.opportunity_id == VolunteerOpportunity.id,
            )
            .where(VolunteerSignup.user_id == user.id)
            .order_by(VolunteerSignup.created_at.desc())
        )
    ).all()

    return [
        MySignupResponse(
            signup_id=signup.id,
            opportunity_id=opp.id,
            title=opp.title,
            organization=opp.organization,
            location=opp.location,
            category=opp.category,
            hours_estimate=opp.hours_estimate,
            event_date=opp.event_date,
            signed_up_at=signup.created_at,
        )
        for signup, opp in rows
    ]


@router.get("", response_model=list[VolunteerResponse])
async def list_opportunities(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    near: str | None = Query(
        None, description="Filter by location (case-insensitive substring)"
    ),
    category: str | None = Query(None, description="Filter by category"),
    limit: int = 30,
) -> list[VolunteerResponse]:
    """List volunteer opportunities with optional location and category filters."""
    query = select(VolunteerOpportunity).order_by(
        VolunteerOpportunity.created_at.desc()
    )

    if near:
        query = query.where(VolunteerOpportunity.location.ilike(f"%{near}%"))
    if category:
        query = query.where(VolunteerOpportunity.category == category)

    query = query.limit(limit)
    opps = (await db.scalars(query)).all()

    results = []
    for opp in opps:
        signup_count = await db.scalar(
            select(func.count())
            .select_from(VolunteerSignup)
            .where(VolunteerSignup.opportunity_id == opp.id)
        )
        creator = await db.get(User, opp.created_by)
        results.append(
            VolunteerResponse(
                id=opp.id,
                created_by=opp.created_by,
                creator_name=creator.display_name if creator else "Unknown",
                title=opp.title,
                organization=opp.organization,
                description=opp.description,
                location=opp.location,
                category=opp.category,
                hours_estimate=opp.hours_estimate,
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
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> VolunteerResponse:
    opp = VolunteerOpportunity(
        id=uuid.uuid4(),
        created_by=user.id,
        title=payload.title,
        organization=payload.organization,
        description=payload.description,
        location=payload.location,
        category=payload.category,
        hours_estimate=payload.hours_estimate,
        event_date=payload.event_date,
        spots=payload.spots,
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)

    return VolunteerResponse(
        id=opp.id,
        created_by=user.id,
        creator_name=user.display_name,
        title=opp.title,
        organization=opp.organization,
        description=opp.description,
        location=opp.location,
        category=opp.category,
        hours_estimate=opp.hours_estimate,
        event_date=opp.event_date,
        spots=opp.spots,
        signup_count=0,
        created_at=opp.created_at,
    )


@router.post("/{opp_id}/signup")
async def signup_volunteer(
    opp_id: uuid.UUID,
    user: User = Depends(require_verified_profile),
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
            select(func.count())
            .select_from(VolunteerSignup)
            .where(VolunteerSignup.opportunity_id == opp_id)
        )
        if count >= opp.spots:
            raise HTTPException(status_code=400, detail="No spots left")

    signup = VolunteerSignup(id=uuid.uuid4(), opportunity_id=opp_id, user_id=user.id)
    db.add(signup)
    await db.commit()
    return {"status": "signed_up", "opportunity_id": str(opp_id)}
