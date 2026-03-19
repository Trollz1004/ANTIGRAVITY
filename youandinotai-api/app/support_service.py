"""Support chat helpers with preset responses, optional Ollama, and ticket alerts."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import Settings
from app.models import SupportTicket, User

logger = logging.getLogger(__name__)

MAX_SUBJECT_LENGTH = 120


@dataclass(slots=True)
class SupportDecision:
    reply: str
    category: str
    preset_key: str | None
    should_escalate: bool
    escalation_reason: str | None
    subject: str


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _truncate(value: str, limit: int) -> str:
    clean = _normalize_text(value)
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rstrip() + "…"


def _build_subject(category: str, message: str) -> str:
    summary = _truncate(message, MAX_SUBJECT_LENGTH)
    if summary:
        return f"{category.replace('_', ' ').title()}: {summary}"
    return f"{category.replace('_', ' ').title()} support request"


def _decision(
    *,
    reply: str,
    category: str,
    preset_key: str | None,
    should_escalate: bool,
    escalation_reason: str | None,
    message: str,
) -> SupportDecision:
    return SupportDecision(
        reply=_normalize_text(reply),
        category=category,
        preset_key=preset_key,
        should_escalate=should_escalate,
        escalation_reason=escalation_reason,
        subject=_build_subject(category, message),
    )


def _match_preset_support_reply(message: str) -> SupportDecision | None:
    normalized = _normalize_text(message).lower()

    if any(keyword in normalized for keyword in ("unsafe", "harass", "abuse", "minor", "scam", "fraud", "threat", "report user")):
        return _decision(
            reply=(
                "I’m escalating this to a human review queue now. "
                "For immediate danger, contact local emergency services first."
            ),
            category="safety",
            preset_key="safety_escalation",
            should_escalate=True,
            escalation_reason="safety_review",
            message=message,
        )

    if any(keyword in normalized for keyword in ("refund", "charged twice", "double charged", "cancel subscription", "billing dispute", "payment issue")):
        return _decision(
            reply=(
                "I’m opening a billing ticket so this can be reviewed by a human. "
                "Square also sends the original checkout receipt to the payment email address."
            ),
            category="billing",
            preset_key="billing_escalation",
            should_escalate=True,
            escalation_reason="billing_review",
            message=message,
        )

    if any(keyword in normalized for keyword in ("receipt", "bot-shield", "bot shield", "founding member", "subscription", "payment", "square")):
        return _decision(
            reply=(
                "Square sends the checkout receipt directly to the email used during payment. "
                "If your verified access or subscription still looks wrong after a short delay, say 'open a ticket' and I’ll escalate it."
            ),
            category="billing",
            preset_key="payment_receipt",
            should_escalate=False,
            escalation_reason=None,
            message=message,
        )

    if any(keyword in normalized for keyword in ("delete account", "delete my account", "export my data", "privacy", "location tracking")):
        return _decision(
            reply=(
                "You can manage data export, deletion requests, and location tracking from the Data & Privacy area in the app. "
                "If the privacy request did not process correctly, say 'open a ticket' and I’ll escalate it."
            ),
            category="privacy",
            preset_key="privacy_controls",
            should_escalate=False,
            escalation_reason=None,
            message=message,
        )

    if any(keyword in normalized for keyword in ("can’t log in", "cant log in", "locked out", "password reset", "login issue", "sign in issue")):
        return _decision(
            reply=(
                "I’m escalating this to a human support ticket because account-access issues need review. "
                "If you still have access on another device, keep that session active until follow-up."
            ),
            category="account_access",
            preset_key="account_access_escalation",
            should_escalate=True,
            escalation_reason="account_access_review",
            message=message,
        )

    if any(keyword in normalized for keyword in ("verify", "liveness", "verified human", "verification", "face check")):
        return _decision(
            reply=(
                "Verified-human access usually requires the liveness check plus the Bot-Shield payment. "
                "If you already completed both and the badge still has not updated, I can open a ticket for manual review."
            ),
            category="verification",
            preset_key="verification_help",
            should_escalate=False,
            escalation_reason=None,
            message=message,
        )

    if any(keyword in normalized for keyword in ("bug", "not working", "error", "crash", "stuck", "message failed", "video not working")):
        return _decision(
            reply=(
                "I’m opening a technical support ticket so the issue can be reviewed with the exact app response. "
                "If you can, include the screen and action that triggered the problem in your next message."
            ),
            category="technical",
            preset_key="technical_escalation",
            should_escalate=True,
            escalation_reason="technical_review",
            message=message,
        )

    if any(keyword in normalized for keyword in ("human", "agent", "person", "open a ticket", "support ticket")):
        return _decision(
            reply="I’m opening a support ticket now so a human can review the conversation.",
            category="general",
            preset_key="manual_escalation",
            should_escalate=True,
            escalation_reason="user_requested_human",
            message=message,
        )

    return None


def _build_ollama_prompt(message: str, transcript: list[dict[str, str]]) -> str:
    transcript_lines = "\n".join(
        f"{item.get('role', 'user')}: {item.get('content', '').strip()}"
        for item in transcript[-6:]
        if item.get("content")
    )
    return (
        "You are the YouAndINotAI support assistant. "
        "Answer in 1-3 short sentences. Never invent refunds, policy exceptions, or account actions. "
        "Escalate for safety, billing disputes, account-access problems, legal/privacy exceptions, or anything uncertain. "
        "Return JSON only with keys: reply, should_escalate, category, subject, escalation_reason.\n\n"
        f"Recent transcript:\n{transcript_lines or '(none)'}\n\n"
        f"Latest user message:\n{message}"
    )


async def _ask_ollama_support(
    *,
    message: str,
    transcript: list[dict[str, str]],
    settings: Settings,
) -> SupportDecision | None:
    base_url = str(settings.support_ollama_base_url or "").strip().rstrip("/")
    if not base_url:
        return None

    try:
        async with httpx.AsyncClient(base_url=base_url, timeout=settings.support_ollama_timeout_seconds) as client:
            response = await client.post(
                "/api/generate",
                json={
                    "model": settings.support_ollama_model,
                    "prompt": _build_ollama_prompt(message, transcript),
                    "stream": False,
                    "format": "json",
                },
            )
        response.raise_for_status()
        payload = response.json()
        raw = payload.get("response") or ""
        parsed = json.loads(raw)
    except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Support Ollama reply failed: %s", exc)
        return None

    reply = _normalize_text(str(parsed.get("reply") or ""))
    if not reply:
        return None

    category = _normalize_text(str(parsed.get("category") or "general")).lower().replace(" ", "_")
    subject = _truncate(
        _normalize_text(str(parsed.get("subject") or "")) or _build_subject(category, message),
        MAX_SUBJECT_LENGTH,
    )
    escalation_reason = _normalize_text(str(parsed.get("escalation_reason") or "")) or None

    return SupportDecision(
        reply=reply,
        category=category or "general",
        preset_key="ollama_support",
        should_escalate=bool(parsed.get("should_escalate")),
        escalation_reason=escalation_reason,
        subject=subject,
    )


async def _ask_support_openclaw(
    *,
    message: str,
    transcript: list[dict[str, str]],
    session_key: str,
    settings: Settings,
) -> SupportDecision | None:
    base_url = str(settings.support_openclaw_url or "").strip().rstrip("/")
    if not base_url:
        return None

    prompt = _build_ollama_prompt(message, transcript)

    try:
        async with httpx.AsyncClient(timeout=settings.support_openclaw_timeout_seconds) as client:
            response = await client.post(
                f"{base_url}/chat",
                json={
                    "sessionId": f"support-{session_key}",
                    "message": prompt,
                },
            )
        response.raise_for_status()
        payload = response.json()
        raw = str(payload.get("response") or "").strip()
        parsed = json.loads(raw)
    except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Support OpenClaw reply failed: %s", exc)
        return None

    reply = _normalize_text(str(parsed.get("reply") or ""))
    if not reply:
        return None

    category = _normalize_text(str(parsed.get("category") or "general")).lower().replace(" ", "_")
    subject = _truncate(
        _normalize_text(str(parsed.get("subject") or "")) or _build_subject(category, message),
        MAX_SUBJECT_LENGTH,
    )
    escalation_reason = _normalize_text(str(parsed.get("escalation_reason") or "")) or None

    return SupportDecision(
        reply=reply,
        category=category or "general",
        preset_key="supportclaw",
        should_escalate=bool(parsed.get("should_escalate")),
        escalation_reason=escalation_reason,
        subject=subject,
    )


async def generate_support_decision(
    *,
    message: str,
    transcript: list[dict[str, str]],
    session_key: str,
    settings: Settings,
) -> SupportDecision:
    preset = _match_preset_support_reply(message)
    if preset:
        return preset

    openclaw_decision = await _ask_support_openclaw(
        message=message,
        transcript=transcript,
        session_key=session_key,
        settings=settings,
    )
    if openclaw_decision:
        return openclaw_decision

    ollama_decision = await _ask_ollama_support(
        message=message,
        transcript=transcript,
        settings=settings,
    )
    if ollama_decision:
        return ollama_decision

    return _decision(
        reply=(
            "I can route this to a human so it does not get lost. "
            "I’m opening a support ticket with the conversation context."
        ),
        category="general",
        preset_key="fallback_escalation",
        should_escalate=True,
        escalation_reason="unclassified_request",
        message=message,
    )


async def notify_support_ticket(
    *,
    ticket: SupportTicket,
    user: User,
    settings: Settings,
) -> bool:
    token = str(settings.telegram_bot_token or "").strip()
    chat_id = str(settings.telegram_chat_id or "").strip()
    if not token or not chat_id:
        logger.info("Skipping support ticket Telegram alert; Telegram is not configured.")
        return False

    message = "\n".join(
        [
            "New support ticket",
            f"Ticket: {ticket.id}",
            f"User: {user.display_name} <{user.email}>",
            f"Category: {ticket.category}",
            f"Reason: {ticket.escalation_reason or 'manual_review'}",
            f"Customer: {_truncate(ticket.customer_message, 400)}",
            f"Bot reply: {_truncate(ticket.bot_response or '(none)', 400)}",
        ]
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                },
            )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Support ticket Telegram alert failed: %s", exc)
        return False

    return True


def user_can_view_operator_queue(*, user: User, settings: Settings) -> bool:
    return user.email.strip().lower() in settings.support_operator_email_list
