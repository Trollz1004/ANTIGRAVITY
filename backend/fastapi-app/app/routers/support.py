"""Support chat and escalation routes."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import SupportTicket, User
from app.schemas import SupportChatRequest, SupportChatResponse, SupportTicketResponse
from app.support_service import (
    generate_support_decision,
    notify_support_ticket,
    user_can_view_operator_queue,
)

router = APIRouter(prefix="/support")


def _serialize_transcript(payload: SupportChatRequest, reply: str | None = None) -> list[dict[str, str]]:
    transcript = [item.model_dump() for item in payload.transcript]
    transcript.append({"role": "user", "content": payload.message})
    if reply:
        transcript.append({"role": "assistant", "content": reply})
    return transcript


async def _create_ticket(
    *,
    payload: SupportChatRequest,
    user: User,
    decision_reply: str,
    category: str,
    escalation_reason: str | None,
    subject: str,
    db: AsyncSession,
    settings: Settings,
) -> SupportTicket:
    ticket = SupportTicket(
        id=uuid.uuid4(),
        user_id=user.id,
        status="open",
        category=category,
        subject=subject,
        customer_email=user.email,
        customer_message=payload.message,
        bot_response=decision_reply,
        escalation_reason=escalation_reason,
        transcript=_serialize_transcript(payload, decision_reply),
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    await notify_support_ticket(ticket=ticket, user=user, settings=settings)
    return ticket


@router.post("/chat", response_model=SupportChatResponse)
async def support_chat(
    payload: SupportChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SupportChatResponse:
    settings = get_settings()
    transcript = _serialize_transcript(payload)
    decision = await generate_support_decision(
        message=payload.message,
        transcript=transcript,
        session_key=str(user.id),
        settings=settings,
    )

    if payload.force_ticket or decision.should_escalate:
        ticket = await _create_ticket(
            payload=payload,
            user=user,
            decision_reply=decision.reply,
            category=decision.category,
            escalation_reason=decision.escalation_reason or "manual_review",
            subject=decision.subject,
            db=db,
            settings=settings,
        )
        return SupportChatResponse(
            reply=decision.reply,
            escalated=True,
            category=ticket.category,
            preset_key=decision.preset_key,
            ticket=SupportTicketResponse.model_validate(ticket),
        )

    return SupportChatResponse(
        reply=decision.reply,
        escalated=False,
        category=decision.category,
        preset_key=decision.preset_key,
        ticket=None,
    )


@router.post("/tickets", response_model=SupportTicketResponse, status_code=201)
async def create_support_ticket(
    payload: SupportChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SupportTicketResponse:
    settings = get_settings()
    ticket = await _create_ticket(
        payload=payload,
        user=user,
        decision_reply="A human support review has been queued.",
        category="general",
        escalation_reason="manual_ticket",
        subject=f"General support: {payload.message[:96].strip()}",
        db=db,
        settings=settings,
    )
    return SupportTicketResponse.model_validate(ticket)


@router.get("/tickets", response_model=list[SupportTicketResponse])
async def list_my_support_tickets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SupportTicketResponse]:
    tickets = (
        await db.scalars(
            select(SupportTicket)
            .where(SupportTicket.user_id == user.id)
            .order_by(SupportTicket.created_at.desc())
        )
    ).all()
    return [SupportTicketResponse.model_validate(ticket) for ticket in tickets]


@router.get("/operator/tickets", response_model=list[SupportTicketResponse])
async def list_operator_support_tickets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SupportTicketResponse]:
    settings = get_settings()
    if not user_can_view_operator_queue(user=user, settings=settings):
        raise HTTPException(status_code=403, detail="Operator access required")

    tickets = (
        await db.scalars(
            select(SupportTicket).order_by(SupportTicket.created_at.desc())
        )
    ).all()
    return [SupportTicketResponse.model_validate(ticket) for ticket in tickets]
