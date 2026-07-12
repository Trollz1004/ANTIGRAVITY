"""Support chat helpers with preset responses, optional Ollama, and ticket alerts."""

from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models import Profile, SupportTicket, User

logger = logging.getLogger(__name__)

MAX_SUBJECT_LENGTH = 120
ANYTHINGLLM_RESPONSE_KEYS = ("textResponse", "response", "text")
FREEFORM_SUPPORT_BLOCKLIST = (
    "paypal",
    "stripe",
    "aws",
    "donation",
    "donations",
    "tax",
    "taxes",
    "dao",
    "token",
    "investment",
    "investor",
    "beneficiary",
    "nonprofit",
    "non-profit",
    "charity",
    "private accounting",
    "medical-benefit",
    "refund guarantee",
)


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
    return clean[: limit - 3].rstrip() + "..."


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


PROFILE_COMPLETENESS_FIELDS = [
    "bio",
    "age",
    "gender",
    "looking_for",
    "location",
    "photos",
    "interests",
]


def _profile_field_filled(profile: Profile | None, field: str) -> bool:
    if profile is None:
        return False
    value = getattr(profile, field, None)
    if field in ("photos", "interests"):
        return isinstance(value, list) and len(value) > 0
    if field == "age":
        return value is not None
    return bool(value and str(value).strip())


def _count_filled_profile_fields(profile: Profile | None) -> int:
    return sum(
        1 for field in PROFILE_COMPLETENESS_FIELDS
        if _profile_field_filled(profile, field)
    )


def compute_profile_completeness_score(
    profile: Profile | None,
    recent_signups_last_hour: int,
) -> float:
    """Return a 0-100 completeness score: 70% profile fields, 30% signup velocity.

    More filled fields increase the score. Rapid signups from the same email
    domain in the last hour reduce the velocity portion.
    """
    filled_count = _count_filled_profile_fields(profile)
    field_score = (filled_count / len(PROFILE_COMPLETENESS_FIELDS)) * 70.0

    signup_risk = _analyze_rapid_signup_patterns(recent_signups_last_hour)["score"]
    # Map the 0-24 risk scale onto a 0-30 completeness bonus.
    velocity_score = max(0.0, 30.0 - (signup_risk * 30.0 / 24.0))

    return round(min(field_score + velocity_score, 100.0), 1)


async def refresh_profile_completeness_score(
    *, db: AsyncSession, user: User, create_if_missing: bool = True
) -> Profile | None:
    """Compute and persist the user's profile completeness score.

    Creates a blank profile only when ``create_if_missing`` is ``True``.
    Returns ``None`` if no profile exists and creation is disabled.
    """
    now = datetime.now(timezone.utc)
    profile = await db.scalar(
        select(Profile).where(Profile.user_id == user.id).limit(1)
    )
    if profile is None:
        if not create_if_missing:
            return None
        profile = Profile(id=uuid.uuid4(), user_id=user.id)
        db.add(profile)

    domain = (user.email.split("@", 1)[1] if "@" in user.email else "").lower()
    one_hour_cutoff = now - timedelta(hours=1)
    recent_signups = (
        await db.scalar(
            select(func.count(User.id))
            .where(User.created_at >= one_hour_cutoff)
            .where(User.email.ilike(f"%@{domain}"))
        )
    ) or 0

    profile.profile_completeness_score = compute_profile_completeness_score(
        profile, recent_signups
    )
    await db.commit()
    await db.refresh(profile)
    return profile


def _analyze_profile_completeness(profile: Profile | None) -> dict[str, object]:
    if profile is None:
        return {
            "score": 25.0,
            "missing_fields": [
                "bio",
                "age",
                "gender",
                "looking_for",
                "location",
                "photos",
                "interests",
            ],
        }

    missing_fields: list[str] = [
        field
        for field in PROFILE_COMPLETENESS_FIELDS
        if not _profile_field_filled(profile, field)
    ]

    missing_ratio = len(missing_fields) / len(PROFILE_COMPLETENESS_FIELDS)
    return {
        "score": round(missing_ratio * 20.0, 1),
        "missing_fields": missing_fields,
    }


def _analyze_rapid_signup_patterns(users_created_last_hour: int) -> dict[str, object]:
    rolling_count = max(0, users_created_last_hour)
    score = 0.0
    if rolling_count >= 5:
        score += 8.0
    if rolling_count >= 8:
        score += 8.0
    if rolling_count >= 12:
        score += 8.0

    return {
        "score": min(score, 24.0),
        "recent_signups_last_60m": rolling_count,
    }


def _analyze_text_patterns(message: str) -> dict[str, object]:
    normalized = (message or "").strip()
    if not normalized:
        return {"score": 9.0, "matches": ["empty_message"]}

    lowered = normalized.lower()
    matches: list[str] = []
    pattern_tests = {
        "has_link": r"https?://",
        "contains_email": r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        "contains_phone": r"\+?\d[\d\-\s]{7,}\d",
        "repeated_chars": r"(.)\\1{4,}",
        "excessive_caps": r"[A-Z]{10,}",
        "bot_prompts": r"\b(urgent|immediate|contact me|dm me|click here|join now)\b",
    }
    for label, pattern in pattern_tests.items():
        if re.search(pattern, normalized if label == "excessive_caps" else lowered, re.IGNORECASE):
            matches.append(label)

    score = min(len(matches) * 7.0, 27.0)
    upper_ratio = sum(1 for c in normalized if c.isupper()) / max(
        1, len(normalized)
    )
    if upper_ratio >= 0.22:
        score += 4.0

    return {
        "score": round(min(score, 33.0), 1),
        "matches": matches,
        "length": len(normalized),
    }


async def build_bot_likelihood_profile(
    *, db: AsyncSession, user: User, customer_message: str
) -> tuple[float, dict[str, object]]:
    """Build a support-safe bot-likelihood score and red-flag summary."""
    now = datetime.now(timezone.utc)
    profile = await db.scalar(
        select(Profile).where(Profile.user_id == user.id).limit(1)
    )
    domain = (user.email.split("@", 1)[1] if "@" in user.email else "").lower()
    one_hour_cutoff = now - timedelta(hours=1)
    users_created_last_hour = (
        await db.scalar(
            select(func.count(User.id))
            .where(User.created_at >= one_hour_cutoff)
            .where(User.email.ilike(f"%@{domain}"))
        )
    ) or 0

    profile_risk = _analyze_profile_completeness(profile)
    signup_risk = _analyze_rapid_signup_patterns(users_created_last_hour)
    text_risk = _analyze_text_patterns(customer_message)

    # Persist the dedicated profile completeness score and expose it to support.
    refreshed_profile = await refresh_profile_completeness_score(db=db, user=user)
    score = min(
        round(
            profile_risk["score"] + signup_risk["score"] + text_risk["score"], 1
        ),
        100.0,
    )
    signals = {
        "profile": profile_risk,
        "rapid_signup": signup_risk,
        "text_patterns": text_risk,
        "profile_completeness_score": refreshed_profile.profile_completeness_score,
    }
    return score, signals


def _match_preset_support_reply(message: str) -> SupportDecision | None:
    normalized = _normalize_text(message).lower()

    if any(
        keyword in normalized
        for keyword in (
            "unsafe",
            "harass",
            "abuse",
            "minor",
            "scam",
            "fraud",
            "threat",
            "report user",
        )
    ):
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

    if any(
        keyword in normalized
        for keyword in (
            "refund",
            "charged twice",
            "double charged",
            "cancel subscription",
            "billing dispute",
            "payment issue",
        )
    ):
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

    if any(
        keyword in normalized
        for keyword in (
            "receipt",
            "bot-shield",
            "bot shield",
            "founding member",
            "subscription",
            "payment",
            "square",
        )
    ):
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

    if any(
        keyword in normalized
        for keyword in (
            "delete account",
            "delete my account",
            "export my data",
            "privacy",
            "location tracking",
        )
    ):
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

    if any(
        keyword in normalized
        for keyword in (
            "can’t log in",
            "cant log in",
            "locked out",
            "password reset",
            "login issue",
            "sign in issue",
        )
    ):
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

    if any(
        keyword in normalized
        for keyword in (
            "verify",
            "liveness",
            "verified human",
            "verification",
            "face check",
        )
    ):
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

    if any(
        keyword in normalized
        for keyword in (
            "bug",
            "not working",
            "error",
            "crash",
            "stuck",
            "message failed",
            "video not working",
        )
    ):
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

    if any(
        keyword in normalized
        for keyword in ("human", "agent", "person", "open a ticket", "support ticket")
    ):
        return _decision(
            reply="I’m opening a support ticket now so a human can review the conversation.",
            category="general",
            preset_key="manual_escalation",
            should_escalate=True,
            escalation_reason="user_requested_human",
            message=message,
        )

    return None


def _build_support_prompt(message: str, transcript: list[dict[str, str]]) -> str:
    transcript_lines = "\n".join(
        f"{item.get('role', 'user')}: {item.get('content', '').strip()}"
        for item in transcript[-6:]
        if item.get("content")
    )
    return (
        "You are the YouAndINotAI support assistant. "
        "Answer in 1-3 short sentences. Never invent refunds, policy exceptions, or account actions. "
        "Never invent links, forms, phone numbers, emails, or support portals. "
        "Square receipts go to the email used at checkout. If a receipt email is missing, "
        "ask for the account email, payment email, approximate checkout date/time, and short issue summary. "
        "Escalate for safety, billing disputes, account-access problems, legal/privacy exceptions, or anything uncertain. "
        "Return JSON only with keys: reply, should_escalate, category, subject, escalation_reason.\n\n"
        f"Recent transcript:\n{transcript_lines or '(none)'}\n\n"
        f"Latest user message:\n{message}"
    )


def _json_payload_from_text(raw: str) -> dict[str, object] | None:
    clean = raw.strip()
    if not clean:
        return None
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\s*```$", "", clean)

    try:
        parsed = json.loads(clean)
    except json.JSONDecodeError:
        start = clean.find("{")
        if start == -1:
            return None
        try:
            parsed, _ = json.JSONDecoder().raw_decode(clean[start:])
        except json.JSONDecodeError:
            return None

    if isinstance(parsed, dict):
        return parsed
    return None


def _payload_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes"}
    return bool(value)


def _decision_from_payload(
    *,
    parsed: dict[str, object],
    message: str,
    preset_key: str,
) -> SupportDecision | None:
    reply = _normalize_text(str(parsed.get("reply") or ""))
    if not reply:
        return None

    category = (
        _normalize_text(str(parsed.get("category") or "general"))
        .lower()
        .replace(" ", "_")
    )
    subject = _truncate(
        _normalize_text(str(parsed.get("subject") or ""))
        or _build_subject(category, message),
        MAX_SUBJECT_LENGTH,
    )
    escalation_reason = (
        _normalize_text(str(parsed.get("escalation_reason") or "")) or None
    )

    return SupportDecision(
        reply=reply,
        category=category or "general",
        preset_key=preset_key,
        should_escalate=_payload_bool(parsed.get("should_escalate")),
        escalation_reason=escalation_reason,
        subject=subject,
    )


def _decision_from_safe_freeform(
    *,
    raw: str,
    message: str,
    preset_key: str,
) -> SupportDecision | None:
    reply = _normalize_text(raw)
    if len(reply) < 12:
        return None

    lowered = reply.lower()
    if any(term in lowered for term in FREEFORM_SUPPORT_BLOCKLIST):
        return None

    return _decision(
        reply=(
            "I’m opening a support ticket so a human can review this with the "
            "conversation context."
        ),
        category="general",
        preset_key=preset_key,
        should_escalate=True,
        escalation_reason="unstructured_ai_review",
        message=message,
    )


async def _ask_anythingllm_support(
    *,
    message: str,
    transcript: list[dict[str, str]],
    settings: Settings,
) -> SupportDecision | None:
    api_url = str(settings.support_anythingllm_api_url or "").strip().rstrip("/")
    api_key = str(settings.support_anythingllm_api_key or "").strip()
    workspace_slug = str(settings.support_anythingllm_workspace_slug or "").strip()
    if not (api_url and api_key and workspace_slug):
        return None

    try:
        async with httpx.AsyncClient(
            base_url=api_url,
            timeout=settings.support_anythingllm_timeout_seconds,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        ) as client:
            response = await client.post(
                f"/workspace/{workspace_slug}/chat",
                json={
                    "message": _build_support_prompt(message, transcript),
                    "mode": "chat",
                },
            )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Support AnythingLLM reply failed: %s", exc)
        return None

    raw = ""
    if isinstance(payload, dict) and payload.get("reply"):
        parsed = payload
    elif isinstance(payload, dict):
        for key in ANYTHINGLLM_RESPONSE_KEYS:
            value = payload.get(key)
            if value:
                raw = str(value)
                break
        parsed = _json_payload_from_text(raw) if raw else None
    else:
        parsed = None

    if not parsed:
        decision = _decision_from_safe_freeform(
            raw=raw,
            message=message,
            preset_key="anythingllm_support",
        )
        if decision:
            logger.info("Support AnythingLLM reply was safe freeform text.")
            return decision
        logger.warning("Support AnythingLLM reply was not structured JSON.")
        return None

    return _decision_from_payload(
        parsed=parsed,
        message=message,
        preset_key="anythingllm_support",
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
        options = {
            "num_ctx": max(
                256, int(getattr(settings, "support_ollama_context_tokens", 1024))
            ),
            "num_predict": max(
                64, int(getattr(settings, "support_ollama_num_predict", 220))
            ),
        }
        num_gpu = int(getattr(settings, "support_ollama_num_gpu", 0))
        if num_gpu >= 0:
            options["num_gpu"] = num_gpu

        async with httpx.AsyncClient(
            base_url=base_url, timeout=settings.support_ollama_timeout_seconds
        ) as client:
            response = await client.post(
                "/api/generate",
                json={
                    "model": settings.support_ollama_model,
                    "prompt": _build_support_prompt(message, transcript),
                    "stream": False,
                    "format": "json",
                    "options": options,
                },
            )
        response.raise_for_status()
        payload = response.json()
        raw = payload.get("response") or ""
        parsed = _json_payload_from_text(raw)
    except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
        logger.warning("Support Ollama reply failed: %s", exc)
        return None

    if not parsed:
        return None

    return _decision_from_payload(
        parsed=parsed,
        message=message,
        preset_key="ollama_support",
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

    prompt = _build_support_prompt(message, transcript)

    try:
        async with httpx.AsyncClient(
            timeout=settings.support_openclaw_timeout_seconds
        ) as client:
            response = await client.post(
                f"{base_url}/chat",
                json={
                    "sessionId": f"support-{session_key}",
                    "message": prompt,
                },
            )
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, dict) and payload.get("reply"):
            parsed = payload
        else:
            raw = str(payload.get("response") or "").strip()
            parsed = _json_payload_from_text(raw)
    except (httpx.HTTPError, ValueError, json.JSONDecodeError, AttributeError) as exc:
        logger.warning("Support OpenClaw reply failed: %s", exc)
        return None

    if not parsed:
        return None

    return _decision_from_payload(
        parsed=parsed,
        message=message,
        preset_key="supportclaw",
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

    # One shared deadline across the full AnythingLLM -> OpenClaw -> Ollama
    # chain — otherwise the per-provider timeouts stack additively and a slow
    # rail can push total latency past ~40s under the individual defaults.
    total_budget = max(
        1.0, float(getattr(settings, "support_total_timeout_seconds", 20.0))
    )

    async def _run_chain() -> SupportDecision | None:
        anythingllm_decision = await _ask_anythingllm_support(
            message=message,
            transcript=transcript,
            settings=settings,
        )
        if anythingllm_decision:
            return anythingllm_decision

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

        return None

    try:
        decision = await asyncio.wait_for(_run_chain(), timeout=total_budget)
    except asyncio.TimeoutError:
        logger.warning(
            "Support decision chain exceeded overall budget %.1fs; falling back to escalation.",
            total_budget,
        )
        decision = None

    if decision:
        return decision

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


def _support_ticket_alert_message(*, ticket: SupportTicket, user: User) -> str:
    return "\n".join(
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


async def _send_telegram_support_alert(*, message: str, settings: Settings) -> bool:
    token = str(settings.telegram_bot_token or "").strip()
    chat_id = str(settings.telegram_chat_id or "").strip()
    if not token or not chat_id:
        logger.info(
            "Skipping support ticket Telegram alert; Telegram is not configured."
        )
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                },
            )
        if response.is_error:
            logger.warning(
                "Support ticket Telegram alert failed with status %s",
                response.status_code,
            )
            return False
    except httpx.HTTPError as exc:
        logger.warning(
            "Support ticket Telegram alert failed: %s", exc.__class__.__name__
        )
        return False

    return True


async def _send_whatsapp_support_alert(*, message: str, settings: Settings) -> bool:
    phone_id = str(settings.whatsapp_phone_id or "").strip()
    token = str(settings.whatsapp_token or "").strip()
    recipient = str(settings.whatsapp_to or "").strip()
    api_version = str(settings.whatsapp_api_version or "v21.0").strip() or "v21.0"
    if not (phone_id and token and recipient):
        logger.info(
            "Skipping support ticket WhatsApp alert; WhatsApp is not configured."
        )
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://graph.facebook.com/{api_version}/{phone_id}/messages",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "messaging_product": "whatsapp",
                    "to": recipient,
                    "type": "text",
                    "text": {"body": message},
                },
            )
        if response.is_error:
            logger.warning(
                "Support ticket WhatsApp alert failed with status %s",
                response.status_code,
            )
            return False
    except httpx.HTTPError as exc:
        logger.warning(
            "Support ticket WhatsApp alert failed: %s", exc.__class__.__name__
        )
        return False

    return True


async def notify_support_ticket(
    *,
    ticket: SupportTicket,
    user: User,
    settings: Settings,
) -> bool:
    message = _support_ticket_alert_message(ticket=ticket, user=user)
    alert_sent = await _send_whatsapp_support_alert(message=message, settings=settings)
    alert_sent = (
        await _send_telegram_support_alert(message=message, settings=settings)
        or alert_sent
    )

    return alert_sent


def user_can_view_operator_queue(*, user: User, settings: Settings) -> bool:
    return user.email.strip().lower() in settings.support_operator_email_list
