"""Double-date proposal router."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_verified_profile
from app.database import get_db
from app.models import DoubleDateAcceptance, DoubleDateSession, Match, Profile, User
from app.schemas import (
    DoubleDateCoupleResponse,
    DoubleDateParticipantResponse,
    DoubleDateProposeRequest,
    DoubleDateSessionResponse,
    DoubleDateSquadRecommendation,
)

router = APIRouter(prefix="/double-dates")


def _user_in_match(match: Match | None, user_id: uuid.UUID) -> bool:
    if not match:
        return False
    return user_id in {match.user_a, match.user_b}


async def _match_fully_verified(db: AsyncSession, match: Match) -> bool:
    """Both members of a match must be currently verified.

    require_verified_profile only checks the proposer/acceptor -- a double
    date pairs up to four people, and a legacy match (formed before the
    verification gate, or where a member since lost verified status) can
    still have the caller verified while their partner isn't. Without this,
    the unverified partner's name/photo would be exposed via
    _serialize_session and they'd be treated as an active session
    participant despite never passing the gate themselves.
    """
    for member_id in (match.user_a, match.user_b):
        member = await db.get(User, member_id)
        if not member or not member.bot_shield_verified:
            return False
    return True


async def _build_couple_response(
    db: AsyncSession,
    match: Match | None,
) -> DoubleDateCoupleResponse | None:
    if not match:
        return None

    members: list[DoubleDateParticipantResponse] = []
    for member_id in (match.user_a, match.user_b):
        user = await db.get(User, member_id)
        if not user:
            continue
        profile = await db.scalar(select(Profile).where(Profile.user_id == member_id))
        primary_photo = None
        if profile and profile.photos:
            primary_photo = str(profile.photos[0])
        members.append(
            DoubleDateParticipantResponse(
                user_id=user.id,
                display_name=user.display_name,
                photo_url=primary_photo,
            )
        )

    return DoubleDateCoupleResponse(match_id=match.id, members=members)


async def _serialize_session(
    db: AsyncSession,
    session: DoubleDateSession,
) -> DoubleDateSessionResponse:
    acceptances = (
        await db.scalars(
            select(DoubleDateAcceptance).where(
                DoubleDateAcceptance.session_id == session.id,
                DoubleDateAcceptance.accepted.is_(True),
            )
        )
    ).all()
    accepted_match_ids = [acceptance.match_id for acceptance in acceptances]

    match_a = await db.get(Match, session.match_a_id)
    match_b = await db.get(Match, session.match_b_id)

    return DoubleDateSessionResponse(
        id=session.id,
        match_a_id=session.match_a_id,
        match_b_id=session.match_b_id,
        status=session.status,
        created_at=session.created_at,
        accepted_match_ids=accepted_match_ids,
        couple_a=await _build_couple_response(db, match_a),
        couple_b=await _build_couple_response(db, match_b),
    )


async def _get_user_match_id(
    db: AsyncSession,
    session: DoubleDateSession,
    user_id: uuid.UUID,
) -> uuid.UUID | None:
    match_a = await db.get(Match, session.match_a_id)
    match_b = await db.get(Match, session.match_b_id)

    if _user_in_match(match_a, user_id):
        return session.match_a_id
    if _user_in_match(match_b, user_id):
        return session.match_b_id
    return None


@router.post("/propose", response_model=DoubleDateSessionResponse, status_code=201)
async def propose_double_date(
    payload: DoubleDateProposeRequest,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> DoubleDateSessionResponse:
    if payload.match_a_id == payload.match_b_id:
        raise HTTPException(status_code=400, detail="Choose two different match IDs")

    match_a = await db.get(Match, payload.match_a_id)
    match_b = await db.get(Match, payload.match_b_id)
    if (
        not match_a
        or match_a.status != "active"
        or not match_b
        or match_b.status != "active"
    ):
        raise HTTPException(
            status_code=404, detail="One or both matches are not active"
        )

    if not (_user_in_match(match_a, user.id) or _user_in_match(match_b, user.id)):
        raise HTTPException(
            status_code=403, detail="You must belong to one of the couples"
        )

    if not await _match_fully_verified(db, match_a) or not await _match_fully_verified(
        db, match_b
    ):
        raise HTTPException(
            status_code=403,
            detail="Both members of each couple must be verified for a double date",
        )

    existing = await db.scalar(
        select(DoubleDateSession).where(
            or_(
                and_(
                    DoubleDateSession.match_a_id == payload.match_a_id,
                    DoubleDateSession.match_b_id == payload.match_b_id,
                ),
                and_(
                    DoubleDateSession.match_a_id == payload.match_b_id,
                    DoubleDateSession.match_b_id == payload.match_a_id,
                ),
            ),
            DoubleDateSession.status.in_(("pending", "active")),
        )
    )
    if existing:
        raise HTTPException(
            status_code=409, detail="A proposal already exists for these couples"
        )

    session = DoubleDateSession(
        id=uuid.uuid4(),
        match_a_id=payload.match_a_id,
        match_b_id=payload.match_b_id,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(session)

    initiator_match_id = (
        payload.match_a_id if _user_in_match(match_a, user.id) else payload.match_b_id
    )
    db.add(
        DoubleDateAcceptance(
            id=uuid.uuid4(),
            session_id=session.id,
            match_id=initiator_match_id,
            accepted=True,
            created_at=datetime.now(timezone.utc),
        )
    )

    await db.commit()
    await db.refresh(session)
    return await _serialize_session(db, session)


@router.get("", response_model=list[DoubleDateSessionResponse])
async def list_double_dates(
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> list[DoubleDateSessionResponse]:
    user_match_ids = (
        await db.scalars(
            select(Match.id).where(
                or_(Match.user_a == user.id, Match.user_b == user.id)
            )
        )
    ).all()
    if not user_match_ids:
        return []

    sessions = (
        await db.scalars(
            select(DoubleDateSession)
            .where(
                or_(
                    DoubleDateSession.match_a_id.in_(user_match_ids),
                    DoubleDateSession.match_b_id.in_(user_match_ids),
                ),
                DoubleDateSession.status.in_(("pending", "active")),
            )
            .order_by(DoubleDateSession.created_at.desc())
        )
    ).all()

    results = []
    for session in sessions:
        match_a = await db.get(Match, session.match_a_id)
        match_b = await db.get(Match, session.match_b_id)
        if not await _match_fully_verified(
            db, match_a
        ) or not await _match_fully_verified(db, match_b):
            continue
        results.append(await _serialize_session(db, session))
    return results


async def _load_participant_session(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    reject_declined: bool = False,
) -> tuple[DoubleDateSession, uuid.UUID]:
    """Return the proposal plus the caller's match id, or raise."""
    session = await db.get(DoubleDateSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Double-date proposal not found")
    if reject_declined and session.status == "declined":
        raise HTTPException(
            status_code=409, detail="This proposal has already been declined"
        )

    user_match_id = await _get_user_match_id(db, session, user_id)
    if not user_match_id:
        raise HTTPException(status_code=403, detail="You are not part of this proposal")

    return session, user_match_id


async def _set_acceptance(
    db: AsyncSession,
    session: DoubleDateSession,
    match_id: uuid.UUID,
    accepted: bool,
) -> None:
    """Upsert the caller's acceptance row for a proposal."""
    acceptance = await db.scalar(
        select(DoubleDateAcceptance).where(
            DoubleDateAcceptance.session_id == session.id,
            DoubleDateAcceptance.match_id == match_id,
        )
    )
    if acceptance:
        acceptance.accepted = accepted
    else:
        db.add(
            DoubleDateAcceptance(
                id=uuid.uuid4(),
                session_id=session.id,
                match_id=match_id,
                accepted=accepted,
                created_at=datetime.now(timezone.utc),
            )
        )


@router.post("/{session_id}/accept", response_model=DoubleDateSessionResponse)
async def accept_double_date(
    session_id: uuid.UUID,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> DoubleDateSessionResponse:
    session, user_match_id = await _load_participant_session(
        db, session_id, user.id, reject_declined=True
    )

    match_a = await db.get(Match, session.match_a_id)
    match_b = await db.get(Match, session.match_b_id)
    if not await _match_fully_verified(db, match_a) or not await _match_fully_verified(
        db, match_b
    ):
        raise HTTPException(
            status_code=403,
            detail="Both members of each couple must be verified for a double date",
        )

    await _set_acceptance(db, session, user_match_id, True)

    accepted_match_ids = set(
        (
            await db.scalars(
                select(DoubleDateAcceptance.match_id).where(
                    DoubleDateAcceptance.session_id == session_id,
                    DoubleDateAcceptance.accepted.is_(True),
                )
            )
        ).all()
    )
    accepted_match_ids.add(user_match_id)
    if (
        session.match_a_id in accepted_match_ids
        and session.match_b_id in accepted_match_ids
    ):
        session.status = "active"

    await db.commit()
    await db.refresh(session)
    return await _serialize_session(db, session)


@router.post("/{session_id}/decline", response_model=DoubleDateSessionResponse)
async def decline_double_date(
    session_id: uuid.UUID,
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> DoubleDateSessionResponse:
    session, user_match_id = await _load_participant_session(db, session_id, user.id)
    await _set_acceptance(db, session, user_match_id, False)

    session.status = "declined"
    await db.commit()
    await db.refresh(session)

    # Declining (unlike propose/accept) is a safe, reject-only action that
    # should always be available -- but a legacy session can still pair the
    # caller with an unverified participant, so don't let the response leak
    # that participant's name/photo via _serialize_session.
    match_a = await db.get(Match, session.match_a_id)
    match_b = await db.get(Match, session.match_b_id)
    if not await _match_fully_verified(db, match_a) or not await _match_fully_verified(
        db, match_b
    ):
        accepted_match_ids = (
            await db.scalars(
                select(DoubleDateAcceptance.match_id).where(
                    DoubleDateAcceptance.session_id == session_id,
                    DoubleDateAcceptance.accepted.is_(True),
                )
            )
        ).all()
        return DoubleDateSessionResponse(
            id=session.id,
            match_a_id=session.match_a_id,
            match_b_id=session.match_b_id,
            status=session.status,
            created_at=session.created_at,
            accepted_match_ids=list(accepted_match_ids),
            couple_a=None,
            couple_b=None,
        )

    return await _serialize_session(db, session)


@router.get(
    "/squad-recommendations", response_model=list[DoubleDateSquadRecommendation]
)
async def get_squad_recommendations(
    user: User = Depends(require_verified_profile),
    db: AsyncSession = Depends(get_db),
) -> list[DoubleDateSquadRecommendation]:
    """Recommend matches for double-dates based on engagement score."""
    all_matches = (
        await db.scalars(
            select(Match).where(
                or_(Match.user_a == user.id, Match.user_b == user.id),
                Match.status == "active",
            )
        )
    ).all()
    recommended = []
    for m in all_matches:
        target_id = m.user_b if m.user_a == user.id else m.user_a
        target_user = await db.get(User, target_id)
        if not target_user or not target_user.bot_shield_verified:
            continue
        target_profile = await db.scalar(
            select(Profile).where(Profile.user_id == target_id)
        )
        photo = (
            str(target_profile.photos[0])
            if target_profile and target_profile.photos
            else None
        )
        recommended.append(
            DoubleDateSquadRecommendation(
                match_id=m.id,
                display_name=target_user.display_name,
                photo_url=photo,
                engagement_score=target_user.engagement_score,
                member_badge=target_user.member_badge,
            )
        )
    return sorted(recommended, key=lambda x: x.engagement_score, reverse=True)[:10]
