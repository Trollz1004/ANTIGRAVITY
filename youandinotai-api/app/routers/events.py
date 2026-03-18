"""Events and meetups router."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Event, EventRSVP, User
from app.schemas import EventCreateRequest, EventResponse

router = APIRouter(prefix="/events")


@router.get("", response_model=list[EventResponse])
async def list_events(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    category: str | None = None,
    limit: int = 30,
) -> list[EventResponse]:
    query = select(Event).order_by(Event.event_date.asc()).limit(limit)
    if category:
        query = query.where(Event.category == category)

    events = (await db.scalars(query)).all()

    results = []
    for event in events:
        organizer = await db.get(User, event.organizer_id)
        attendee_count = await db.scalar(
            select(func.count()).select_from(EventRSVP).where(EventRSVP.event_id == event.id)
        )
        results.append(
            EventResponse(
                id=event.id,
                organizer_id=event.organizer_id,
                organizer_name=organizer.display_name if organizer else "Unknown",
                title=event.title,
                description=event.description,
                location=event.location,
                event_date=event.event_date,
                max_attendees=event.max_attendees,
                attendee_count=attendee_count or 0,
                category=event.category,
                created_at=event.created_at,
            )
        )
    return results


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    payload: EventCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventResponse:
    event = Event(
        id=uuid.uuid4(),
        organizer_id=user.id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        event_date=payload.event_date,
        max_attendees=payload.max_attendees,
        category=payload.category,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    return EventResponse(
        id=event.id,
        organizer_id=user.id,
        organizer_name=user.display_name,
        title=event.title,
        description=event.description,
        location=event.location,
        event_date=event.event_date,
        max_attendees=event.max_attendees,
        attendee_count=0,
        category=event.category,
        created_at=event.created_at,
    )


@router.post("/{event_id}/rsvp", response_model=EventRSVPResponse)
async def rsvp_event(
    event_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventRSVP:
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = await db.scalar(
        select(EventRSVP).where(EventRSVP.event_id == event_id, EventRSVP.user_id == user.id)
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already RSVP'd")

    if event.max_attendees:
        count = await db.scalar(
            select(func.count()).select_from(EventRSVP).where(EventRSVP.event_id == event_id)
        )
        if count >= event.max_attendees:
            raise HTTPException(status_code=400, detail="Event is full")

    rsvp = EventRSVP(id=uuid.uuid4(), event_id=event_id, user_id=user.id, status="going")
    db.add(rsvp)
    await db.commit()
    await db.refresh(rsvp)
    return rsvp
