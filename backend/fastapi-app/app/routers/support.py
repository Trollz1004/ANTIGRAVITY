"""Support chat and escalation routes."""

from __future__ import annotations

import hashlib
import hmac
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import Settings, get_settings
from app.database import get_db
from app.models import SupportTicket, User
from app.schemas import (
    SupportChatRequest,
    SupportChatResponse,
    SupportTicketOperatorResponse,
    SupportTicketResponse,
)
from app.support_service import (
    build_bot_likelihood_profile,
    generate_support_decision,
    notify_support_ticket,
    user_can_view_operator_queue,
)

router = APIRouter(prefix="/support")

WHATSAPP_TICKET_ID_PATTERN = re.compile(
    r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b",
    re.IGNORECASE,
)


def _serialize_transcript(
    payload: SupportChatRequest, reply: str | None = None
) -> list[dict[str, str]]:
    transcript = [item.model_dump() for item in payload.transcript]
    transcript.append({"role": "user", "content": payload.message})
    if reply:
        transcript.append({"role": "assistant", "content": reply})
    return transcript


def _normalize_phone(value: str | None) -> str:
    return re.sub(r"\D+", "", value or "")


def _extract_whatsapp_messages(payload: dict) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    for entry in payload.get("entry", []) or []:
        for change in entry.get("changes", []) or []:
            value = change.get("value") or {}
            for message in value.get("messages", []) or []:
                text = (message.get("text") or {}).get("body")
                sender = message.get("from")
                if sender and text:
                    messages.append({"from": str(sender), "text": str(text)})
    return messages


def _verify_whatsapp_signature(
    *, body: bytes, signature_header: str | None, settings: Settings
) -> bool:
    secret = str(settings.whatsapp_app_secret or "").strip()
    if not secret:
        return False
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    supplied = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, supplied)


def _referenced_ticket_id(text: str) -> uuid.UUID | None:
    match = WHATSAPP_TICKET_ID_PATTERN.search(text)
    if not match:
        return None
    try:
        return uuid.UUID(match.group(0))
    except ValueError:
        return None


async def _record_whatsapp_owner_reply(
    *,
    text: str,
    sender: str,
    db: AsyncSession,
) -> dict[str, str | bool]:
    ticket_id = _referenced_ticket_id(text)
    if not ticket_id:
        return {"processed": False, "reason": "no_ticket_id"}

    ticket = await db.get(SupportTicket, ticket_id)
    if ticket is None:
        return {"processed": False, "reason": "ticket_not_found"}

    transcript = list(ticket.transcript or [])
    transcript.append(
        {
            "role": "assistant",
            "content": f"Operator WhatsApp note from {sender}: {text.strip()}",
        }
    )
    ticket.transcript = transcript
    if text.strip().lower().startswith(("close ", "closed ", "resolve ", "resolved ")):
        ticket.status = "closed"

    await db.commit()
    return {"processed": True, "reason": "ticket_updated"}


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
    bot_likelihood_score, bot_likelihood_signals = await build_bot_likelihood_profile(
        db=db,
        user=user,
        customer_message=payload.message,
    )
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
        bot_likelihood_score=bot_likelihood_score,
        bot_likelihood_signals=bot_likelihood_signals,
        profile_completeness_score=bot_likelihood_signals.get(
            "profile_completeness_score", 0.0
        ),
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


@router.get("/operator/tickets", response_model=list[SupportTicketOperatorResponse])
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
    return [SupportTicketOperatorResponse.model_validate(ticket) for ticket in tickets]


@router.get("/whatsapp/webhook")
async def verify_whatsapp_webhook(
    hub_mode: str = Query("", alias="hub.mode"),
    hub_verify_token: str = Query("", alias="hub.verify_token"),
    hub_challenge: str = Query("", alias="hub.challenge"),
) -> Response:
    settings = get_settings()
    expected_token = str(settings.whatsapp_webhook_verify_token or "").strip()
    if not expected_token:
        raise HTTPException(
            status_code=503, detail="WhatsApp webhook is not configured"
        )
    if hub_mode == "subscribe" and hmac.compare_digest(
        hub_verify_token, expected_token
    ):
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="WhatsApp verification failed")


@router.post("/whatsapp/webhook")
async def receive_whatsapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    settings = get_settings()
    body = await request.body()
    if not _verify_whatsapp_signature(
        body=body,
        signature_header=request.headers.get("x-hub-signature-256"),
        settings=settings,
    ):
        raise HTTPException(
            status_code=403, detail="WhatsApp signature verification failed"
        )

    payload = await request.json()
    owner_phone = _normalize_phone(
        settings.whatsapp_owner_phone or settings.whatsapp_to
    )
    if not owner_phone:
        raise HTTPException(
            status_code=503, detail="WhatsApp owner phone is not configured"
        )

    results = []
    for message in _extract_whatsapp_messages(payload):
        sender = _normalize_phone(message["from"])
        if sender != owner_phone:
            results.append({"processed": False, "reason": "sender_not_allowed"})
            continue
        results.append(
            await _record_whatsapp_owner_reply(
                text=message["text"],
                sender=sender,
                db=db,
            )
        )

    return {"received": True, "results": results}
