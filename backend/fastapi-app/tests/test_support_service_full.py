"""Full coverage tests for app/support_service.py."""

import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.config import Settings
from app.models import SupportTicket, User
from app.support_service import (
    SupportDecision,
    _ask_ollama_support,
    _ask_support_openclaw,
    _build_ollama_prompt,
    _build_subject,
    _match_preset_support_reply,
    _normalize_text,
    _send_telegram_support_alert,
    _send_whatsapp_support_alert,
    _support_ticket_alert_message,
    _truncate,
    generate_support_decision,
    notify_support_ticket,
    user_can_view_operator_queue,
)


def _settings(**overrides) -> Settings:
    base = {
        "support_ollama_base_url": "",
        "support_openclaw_url": "",
        "telegram_bot_token": "",
        "telegram_chat_id": "",
        "whatsapp_phone_id": "",
        "whatsapp_token": "",
        "whatsapp_to": "",
        "support_operator_emails": "ops@youandinotai.com",
    }
    base.update(overrides)
    return Settings(**base)


class TestTextHelpers:
    def test_normalize_text_collapses_whitespace(self):
        assert _normalize_text("  a\n b\t c ") == "a b c"
        assert _normalize_text(None) == ""

    def test_truncate_short_and_long(self):
        assert _truncate("short", 10) == "short"
        long_value = "x" * 100
        result = _truncate(long_value, 20)
        assert result.endswith("...")
        assert len(result) <= 20

    def test_build_subject_shapes(self):
        assert _build_subject("billing", "where is my refund") == (
            "Billing: where is my refund"
        )
        assert _build_subject("account_access", "") == "Account Access support request"


class TestPresetReplies:
    @pytest.mark.parametrize(
        "message,expected_category,should_escalate",
        [
            ("I feel unsafe with this user", "safety", True),
            ("someone is trying to scam me", "safety", True),
            ("I was charged twice", "billing", True),
            ("how do I cancel subscription", "billing", True),
            ("where is my receipt", "billing", False),
            ("bot-shield status", "billing", False),
            ("delete my account please", "privacy", False),
            ("export my data", "privacy", False),
            ("i cant log in", "account_access", True),
            ("password reset broken", "account_access", True),
            ("how does verify work", "verification", False),
            ("liveness check question", "verification", False),
            ("the app keeps crash", "technical", True),
            ("message failed to send", "technical", True),
            ("i want a human", "general", True),
            ("open a ticket", "general", True),
        ],
    )
    def test_preset_match(self, message, expected_category, should_escalate):
        decision = _match_preset_support_reply(message)
        assert decision is not None
        assert decision.category == expected_category
        assert decision.should_escalate is should_escalate
        assert decision.reply
        assert decision.subject

    def test_unmatched_message_returns_none(self):
        assert _match_preset_support_reply("what is the weather like") is None

    def test_normalization_matches_mixed_whitespace(self):
        decision = _match_preset_support_reply("  I   was CHARGED   twice ")
        assert decision is not None
        assert decision.category == "billing"


class TestOllamaSupport:
    @pytest.mark.asyncio
    async def test_no_base_url_returns_none(self):
        result = await _ask_ollama_support(
            message="hi", transcript=[], settings=_settings()
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_successful_json_reply(self):
        settings = _settings(
            support_ollama_base_url="http://ollama.test",
            support_ollama_model="m",
            support_ollama_timeout_seconds=5,
        )
        reply_payload = {
            "reply": "Here is the answer",
            "category": "General Help",
            "subject": "Subject line",
            "should_escalate": True,
            "escalation_reason": "manual_review",
        }
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.return_value = {"response": json.dumps(reply_payload)}

        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=client):
            decision = await _ask_ollama_support(
                message="help me",
                transcript=[{"role": "user", "content": "earlier"}],
                settings=settings,
            )
        assert decision is not None
        assert decision.reply == "Here is the answer"
        assert decision.category == "general_help"
        assert decision.should_escalate is True
        assert decision.escalation_reason == "manual_review"

    @pytest.mark.asyncio
    async def test_http_error_returns_none(self):
        settings = _settings(support_ollama_base_url="http://ollama.test")
        client = AsyncMock()
        client.post = AsyncMock(side_effect=httpx.ConnectError("down"))
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _ask_ollama_support(
                    message="hi", transcript=[], settings=settings
                )
                is None
            )

    @pytest.mark.asyncio
    async def test_invalid_json_returns_none(self):
        settings = _settings(support_ollama_base_url="http://ollama.test")
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.return_value = {"response": "not-json"}
        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _ask_ollama_support(
                    message="hi", transcript=[], settings=settings
                )
                is None
            )

    @pytest.mark.asyncio
    async def test_empty_reply_returns_none(self):
        settings = _settings(support_ollama_base_url="http://ollama.test")
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.return_value = {"response": json.dumps({"reply": ""})}
        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _ask_ollama_support(
                    message="hi", transcript=[], settings=settings
                )
                is None
            )


class TestOpenClawSupport:
    @pytest.mark.asyncio
    async def test_no_url_returns_none(self):
        assert (
            await _ask_support_openclaw(
                message="hi",
                transcript=[],
                session_key="s1",
                settings=_settings(),
            )
            is None
        )

    @pytest.mark.asyncio
    async def test_direct_reply_payload(self):
        settings = _settings(
            support_openclaw_url="http://claw.test",
            support_openclaw_timeout_seconds=5,
        )
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.return_value = {
            "reply": "Claw answer",
            "category": "billing",
            "subject": "Billing help",
            "should_escalate": False,
        }
        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            decision = await _ask_support_openclaw(
                message="billing q",
                transcript=[],
                session_key="s1",
                settings=settings,
            )
        assert decision is not None
        assert decision.preset_key == "supportclaw"
        assert decision.reply == "Claw answer"

        # sessionId and message forwarded
        body = client.post.call_args.kwargs["json"]
        assert body["sessionId"] == "support-s1"
        assert "billing q" in body["message"]

    @pytest.mark.asyncio
    async def test_response_wrapped_payload_parsed(self):
        settings = _settings(support_openclaw_url="http://claw.test")
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.return_value = {
            "response": json.dumps({"reply": "Wrapped answer"})
        }
        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            decision = await _ask_support_openclaw(
                message="q", transcript=[], session_key="s", settings=settings
            )
        assert decision is not None
        assert decision.reply == "Wrapped answer"
        # subject synthesized from message when missing
        assert decision.subject

    @pytest.mark.asyncio
    async def test_bad_payload_returns_none(self):
        settings = _settings(support_openclaw_url="http://claw.test")
        response = MagicMock()
        response.raise_for_status = MagicMock()
        response.json.side_effect = ValueError("um")
        client = AsyncMock()
        client.post = AsyncMock(return_value=response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _ask_support_openclaw(
                    message="q", transcript=[], session_key="s", settings=settings
                )
                is None
            )


class TestGenerateDecisionCascade:
    @pytest.mark.asyncio
    async def test_preset_short_circuits_providers(self):
        with patch(
            "app.support_service._ask_support_openclaw", new=AsyncMock()
        ) as claw:
            decision = await generate_support_decision(
                message="I was charged twice",
                transcript=[],
                session_key="s",
                settings=_settings(),
            )
        assert decision.preset_key == "billing_escalation"
        claw.assert_not_called()

    @pytest.mark.asyncio
    async def test_openclaw_then_ollama_then_fallback(self):
        # OpenClaw wins
        claw_decision = SupportDecision(
            reply="claw",
            category="general",
            preset_key="supportclaw",
            should_escalate=False,
            escalation_reason=None,
            subject="s",
        )
        with patch(
            "app.support_service._ask_support_openclaw",
            new=AsyncMock(return_value=claw_decision),
        ):
            decision = await generate_support_decision(
                message="unmatched question",
                transcript=[],
                session_key="s",
                settings=_settings(),
            )
        assert decision.preset_key == "supportclaw"

        # Ollama wins when OpenClaw declines
        ollama_decision = SupportDecision(
            reply="ollama",
            category="general",
            preset_key="ollama_support",
            should_escalate=False,
            escalation_reason=None,
            subject="s",
        )
        with (
            patch(
                "app.support_service._ask_support_openclaw",
                new=AsyncMock(return_value=None),
            ),
            patch(
                "app.support_service._ask_ollama_support",
                new=AsyncMock(return_value=ollama_decision),
            ),
        ):
            decision = await generate_support_decision(
                message="unmatched question",
                transcript=[],
                session_key="s",
                settings=_settings(),
            )
        assert decision.preset_key == "ollama_support"

        # Both decline → deterministic fallback escalation
        with (
            patch(
                "app.support_service._ask_support_openclaw",
                new=AsyncMock(return_value=None),
            ),
            patch(
                "app.support_service._ask_ollama_support",
                new=AsyncMock(return_value=None),
            ),
        ):
            decision = await generate_support_decision(
                message="unmatched question",
                transcript=[],
                session_key="s",
                settings=_settings(),
            )
        assert decision.preset_key == "fallback_escalation"
        assert decision.should_escalate is True
        assert decision.escalation_reason == "unclassified_request"


class TestAlertDelivery:
    def test_alert_message_shape(self):
        user = User(
            id=uuid.uuid4(),
            email="user@example.com",
            password_hash="h",
            display_name="User A",
        )
        ticket = SupportTicket(
            id=uuid.uuid4(),
            user_id=user.id,
            category="billing",
            subject="Billing: refund",
            customer_email="user@example.com",
            customer_message="I want a refund " * 50,
            bot_response=None,
            escalation_reason="billing_review",
        )
        message = _support_ticket_alert_message(ticket=ticket, user=user)
        assert "New support ticket" in message
        assert "user@example.com" in message
        assert "billing_review" in message
        assert "Bot reply: (none)" in message

    @pytest.mark.asyncio
    async def test_telegram_unconfigured(self):
        assert (
            await _send_telegram_support_alert(message="m", settings=_settings())
            is False
        )

    @pytest.mark.asyncio
    async def test_telegram_success_and_failures(self):
        settings = _settings(telegram_bot_token="tok", telegram_chat_id="chat")

        ok_response = MagicMock(is_error=False)
        client = AsyncMock()
        client.post = AsyncMock(return_value=ok_response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _send_telegram_support_alert(message="m", settings=settings)
                is True
            )
        payload = client.post.call_args.kwargs["json"]
        assert payload["chat_id"] == "chat"

        err_response = MagicMock(is_error=True, status_code=500)
        client.post = AsyncMock(return_value=err_response)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _send_telegram_support_alert(message="m", settings=settings)
                is False
            )

        client.post = AsyncMock(side_effect=httpx.ConnectError("down"))
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _send_telegram_support_alert(message="m", settings=settings)
                is False
            )

    @pytest.mark.asyncio
    async def test_whatsapp_unconfigured(self):
        assert (
            await _send_whatsapp_support_alert(message="m", settings=_settings())
            is False
        )

    @pytest.mark.asyncio
    async def test_whatsapp_success_and_failures(self):
        settings = _settings(
            whatsapp_phone_id="pid",
            whatsapp_token="tok",
            whatsapp_to="+1555000111",
        )

        ok_response = MagicMock(is_error=False)
        client = AsyncMock()
        client.post = AsyncMock(return_value=ok_response)
        client.__aenter__ = AsyncMock(return_value=client)
        client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _send_whatsapp_support_alert(message="m", settings=settings)
                is True
            )
        url = client.post.call_args.args[0]
        assert "graph.facebook.com" in url

        err_response = MagicMock(is_error=True, status_code=403)
        client.post = AsyncMock(return_value=err_response)
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _send_whatsapp_support_alert(message="m", settings=settings)
                is False
            )

        client.post = AsyncMock(side_effect=httpx.ReadTimeout("slow"))
        with patch("httpx.AsyncClient", return_value=client):
            assert (
                await _send_whatsapp_support_alert(message="m", settings=settings)
                is False
            )

    @pytest.mark.asyncio
    async def test_notify_support_ticket_combines_channels(self):
        user = User(
            id=uuid.uuid4(),
            email="user@example.com",
            password_hash="h",
            display_name="User A",
        )
        ticket = SupportTicket(
            id=uuid.uuid4(),
            user_id=user.id,
            category="general",
            subject="Help",
            customer_email="user@example.com",
            customer_message="help",
        )
        with (
            patch(
                "app.support_service._send_whatsapp_support_alert",
                new=AsyncMock(return_value=True),
            ),
            patch(
                "app.support_service._send_telegram_support_alert",
                new=AsyncMock(return_value=False),
            ),
        ):
            assert (
                await notify_support_ticket(
                    ticket=ticket, user=user, settings=_settings()
                )
                is True
            )

        with (
            patch(
                "app.support_service._send_whatsapp_support_alert",
                new=AsyncMock(return_value=False),
            ),
            patch(
                "app.support_service._send_telegram_support_alert",
                new=AsyncMock(return_value=False),
            ),
        ):
            assert (
                await notify_support_ticket(
                    ticket=ticket, user=user, settings=_settings()
                )
                is False
            )


class TestOperatorQueue:
    def test_operator_email_match(self):
        user = User(
            id=uuid.uuid4(),
            email="Ops@YouAndINotAI.com",
            password_hash="h",
            display_name="Op",
        )
        assert user_can_view_operator_queue(user=user, settings=_settings()) is True

    def test_non_operator_rejected(self):
        user = User(
            id=uuid.uuid4(),
            email="member@example.com",
            password_hash="h",
            display_name="Member",
        )
        assert user_can_view_operator_queue(user=user, settings=_settings()) is False


class TestPromptBuilder:
    def test_prompt_contains_transcript_and_message(self):
        prompt = _build_ollama_prompt(
            "latest question",
            [
                {"role": "user", "content": "first"},
                {"role": "assistant", "content": "second"},
                {"role": "user", "content": ""},
            ]
            * 5,
        )
        assert "latest question" in prompt
        assert "user: first" in prompt
        # At most the last 6 transcript entries are included
        assert prompt.count("user: first") <= 2
        assert "1-3 short sentences" in prompt

    def test_prompt_handles_empty_transcript(self):
        assert "(none)" in _build_ollama_prompt("q", [])
