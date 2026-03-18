"""Double Date orchestration router."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DoubleDateAcceptance, DoubleDateSession, Match, User
from app.schemas import DoubleDateSessionResponse

router = APIRouter(prefix="/double-dates")


@router.post("/{session_id}/accept", response_model=DoubleDateSessionResponse)
async def accept_double_date(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DoubleDateSession:
    """Record acceptance from a couple side. If both sides accept, confirm session."""
    session = await db.get(DoubleDateSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Determine which match the user belongs to
    match_a = await db.get(Match, session.match_a_id)
    match_b = await db.get(Match, session.match_b_id)

    current_match_id = None
    if match_a and user.id in [match_a.user_a, match_a.user_b]:
        current_match_id = session.match_a_id
    elif match_b and user.id in [match_b.user_a, match_b.user_b]:
        current_match_id = session.match_b_id

    if not current_match_id:
        raise HTTPException(status_code=403, detail="User not part of this session")

    # Record acceptance for this match/couple
    existing_acceptance = await db.scalar(
        select(DoubleDateAcceptance).where(
            DoubleDateAcceptance.session_id == session_id,
            DoubleDateAcceptance.match_id == current_match_id,
        )
    )

    if not existing_acceptance:
        acceptance = DoubleDateAcceptance(
            id=uuid.uuid4(),
            session_id=session_id,
            match_id=current_match_id,
            accepted=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(acceptance)

    # Check if both matches have now accepted
    other_match_id = session.match_b_id if current_match_id == session.match_a_id else session.match_a_id
    other_acceptance = await db.scalar(
        select(DoubleDateAcceptance).where(
            DoubleDateAcceptance.session_id == session_id,
            DoubleDateAcceptance.match_id == other_match_id,
            DoubleDateAcceptance.accepted == True,  # noqa: E712
        )
    )

    if other_acceptance:
        session.status = "confirmed"

    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/decline", response_model=DoubleDateSessionResponse)
async def decline_double_date(
    session_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DoubleDateSession:
    """Decline the double date session."""
    session = await db.get(DoubleDateSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check authorization
    match_a = await db.get(Match, session.match_a_id)
    match_b = await db.get(Match, session.match_b_id)

    is_part_of_session = (
        (match_a and user.id in [match_a.user_a, match_a.user_b])
        or (match_b and user.id in [match_b.user_a, match_b.user_b])
    )

    if not is_part_of_session:
        raise HTTPException(status_code=403, detail="Access denied")

    session.status = "declined"
    await db.commit()
    await db.refresh(session)
    return session
