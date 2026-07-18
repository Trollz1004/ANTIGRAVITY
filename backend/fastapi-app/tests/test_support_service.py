"""Tests for support chat helpers."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from httpx import HTTPError, Response

from app.support_service import (
    _build_ollama_prompt,
    _build_subject,
    _decision,
    _match_preset_support_reply,
    _normalize_text,
    _support_ticket_alert_message,
    _truncate,
    generate_support_decision,
    notify_support_ticket,
    user_can_view_operator_queue,
    SupportDecision,
)

# Unicode right single quotation mark used by the source code
RSQUO = "\u2019"


class TestNormalizeText:
    def test_trims_whitespace(self):
        assert _normalize_text("  hello  world  ") == "hello world"

    def test_empty_string(self):
        assert _normalize_text("") == ""

    def test_none_becomes_empty(self):
        assert _normalize_text(None) == ""


class TestTruncate:
    def test_short_text(self):
        assert _truncate("hello", 10) == "hello"

    def test_exact_limit(self):
        assert _truncate("1234567890", 10) == "1234567890"

    def test_truncates_with_ellipsis(self):
        result = _truncate("hello world this is long", 10)
        assert result == "hello w..."
        assert len(result) == 10

    def test_handles_none(self):
        assert _truncate(None, 10) == ""


class TestBuildSubject:
    def test_with_message(self):
        result = _build_subject("billing_issue", "I was charged twice")
        assert "Billing Issue" in result
        assert "charged" in result

    def test_without_message(self):
        result = _build_subject("general", "")
        assert result == "General support request"


class TestMatchPresetSupportReply:
    def test_safety_escalation(self):
        result = _match_preset_support_reply("this user is harassing me")
        assert result is not None
        assert result.preset_key == "safety_escalation"
        assert result.should_escalate is True

    def test_billing_escalation(self):
        result = _match_preset_support_reply("I need a refund")
        assert result is not None
        assert result.preset_key == "billing_escalation"
        assert result.should_escalate is True

    def test_payment_receipt(self):
        result = _match_preset_support_reply("I need my receipt")
        assert result is not None
        assert result.preset_key == "payment_receipt"
        assert result.should_escalate is False

    def test_privacy_controls(self):
        result = _match_preset_support_reply("delete my account")
        assert result is not None
        assert result.preset_key == "privacy_controls"
        assert result.should_escalate is False

    def test_account_access_escalation(self):
        result = _match_preset_support_reply(f"I can{RSQUO}t log in")
        assert result is not None
        assert result.preset_key == "account_access_escalation"
        assert result.should_escalate is True

    def test_verification_help(self):
        result = _match_preset_support_reply("I need verification help")
        assert result is not None
        assert result.preset_key == "verification_help"

    def test_technical_escalation(self):
        result = _match_preset_support_reply("the app keeps crashing")
        assert result is not None
        assert result.preset_key == "technical_escalation"
        assert result.should_escalate is True

    def test_manual_escalation(self):
        result = _match_preset_support_reply("I need a human agent")
        assert result is not None
        assert result.preset_key == "manual_escalation"
        assert result.should_escalate is True

    def test_no_match_returns_none(self):
        result = _match_preset_support_reply("hello, what time is it?")
        assert result is None

    def test_safety_takes_priority_over_billing(self):
        result = _match_preset_support_reply("refund and harassment")
        assert result is not None
        assert result.preset_key == "safety_escalation"

    def test_handles_extra_whitespace(self):
        result = _match_preset_support_reply(f"  CAN{RSQUO}T   LOG   IN  ")
        assert result is not None
        assert result.preset_key == "account_access_escalation"


class TestBuildOllamaPrompt:
    def test_basic_prompt_structure(self):
        prompt = _build_ollama_prompt("my message", [])
        assert "my message" in prompt
        assert "JSON" in prompt
        assert "support assistant" in prompt

    def test_includes_transcript(self):
        transcript = [
            {"role": "user", "content": "hello"},
            {"role": "assistant", "content": "hi there"},
        ]
        prompt = _build_ollama_prompt("need help", transcript)
        assert "hello" in prompt
        assert "hi there" in prompt
        assert "need help" in prompt

    def test_limits_transcript_to_last_6(self):
        transcript = [
            {"role": "user", "content": f"msg{i}"} for i in range(10)
        ]
        prompt = _build_ollama_prompt("latest", transcript)
        # msg0 through msg3 should not appear (only last 6 of 10)
        for i in range(4):
            assert f"msg{i}" not in prompt
        for i in range(4, 10):
            assert f"msg{i}" in prompt

    def test_handles_empty_transcript(self):
        prompt = _build_ollama_prompt("help", [{"role": "user", "content": ""}])
        assert "help" in prompt


class TestSupportTicketAlertMessage:
    def test_basic_alert(self):
        ticket = MagicMock()
        ticket.id = "ticket-123"
        ticket.category = "billing"
        ticket.escalation_reason = "billing_review"
        ticket.customer_message = "I need a refund"
        ticket.bot_response = "Opening a ticket"

        user = MagicMock()
        user.display_name = "Test User"
        user.email = "test@example.com"

        result = _support_ticket_alert_message(ticket=ticket, user=user)
        assert "ticket-123" in result
        assert "Test User" in result
        assert "test@example.com" in result
        assert "billing" in result
        assert "billing_review" in result
        assert "I need a refund" in result
        assert "Opening a ticket" in result

    def test_alert_without_bot_response(self):
        ticket = MagicMock()
        ticket.id = "ticket-456"
        ticket.category = "general"
        ticket.escalation_reason = None
        ticket.customer_message = "hello"
        ticket.bot_response = None

        user = MagicMock()
        user.display_name = "User"
        user.email = "u@example.com"

        result = _support_ticket_alert_message(ticket=ticket, user=user)
        assert "(none)" in result


class TestUserCanViewOperatorQueue:
    def test_allowed_email(self):
        user = MagicMock()
        user.email = "operator@example.com"

        settings = MagicMock()
        settings.support_operator_email_list = ["operator@example.com"]

        assert user_can_view_operator_queue(user=user, settings=settings) is True

    def test_disallowed_email(self):
        user = MagicMock()
        user.email = "regular@example.com"

        settings = MagicMock()
        settings.support_operator_email_list = ["operator@example.com"]

        assert user_can_view_operator_queue(user=user, settings=settings) is False

    def test_empty_list(self):
        user = MagicMock()
        user.email = "anyone@example.com"

        settings = MagicMock()
        settings.support_operator_email_list = []

        assert user_can_view_operator_queue(user=user, settings=settings) is False


class TestGenerateSupportDecision:

    @pytest.mark.asyncio
    async def test_preset_match_returns_early(self):
        settings = MagicMock()
        result = await generate_support_decision(
            message="harassment report",
            transcript=[],
            session_key="sess_1",
            settings=settings,
        )
        assert result.preset_key == "safety_escalation"

    @pytest.mark.asyncio
    async def test_openclaw_fallback(self):
        settings = MagicMock()
        settings.support_openclaw_url = "http://openclaw:3200"
        settings.support_openclaw_timeout_seconds = 10

        mock_response = MagicMock(spec=Response)
        mock_response.json.return_value = {
            "reply": "OpenClaw reply",
            "should_escalate": False,
            "category": "general",
            "subject": "test",
        }

        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_response

        with patch("app.support_service.httpx.AsyncClient", return_value=mock_client):
            result = await generate_support_decision(
                message="something not in presets",
                transcript=[],
                session_key="sess_2",
                settings=settings,
            )
        assert result is not None

    @pytest.mark.asyncio
    async def test_ollama_fallback(self):
        settings = MagicMock()
        settings.support_openclaw_url = ""
        settings.support_ollama_base_url = "http://ollama:11434"
        settings.support_ollama_timeout_seconds = 10
        settings.support_ollama_model = "qwen2.5:7b"

        mock_response = MagicMock(spec=Response)
        mock_response.json.return_value = {"response": '{"reply": "Ollama reply", "should_escalate": false, "category": "general"}'}

        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_response

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await generate_support_decision(
                message="something not in presets",
                transcript=[],
                session_key="sess_3",
                settings=settings,
            )
        assert result is not None
        assert result.preset_key == "ollama_support"

    @pytest.mark.asyncio
    async def test_fallback_escalation(self):
        settings = MagicMock()
        settings.support_openclaw_url = ""
        settings.support_ollama_base_url = ""

        result = await generate_support_decision(
            message="something completely unknown",
            transcript=[],
            session_key="sess_4",
            settings=settings,
        )
        assert result.preset_key == "fallback_escalation"
        assert result.should_escalate is True


class TestNotifySupportTicket:

    @pytest.mark.asyncio
    async def test_telegram_only_sent(self):
        ticket = MagicMock()
        ticket.id = "ticket-1"
        ticket.category = "general"
        ticket.escalation_reason = None
        ticket.customer_message = "test"
        ticket.bot_response = None

        user = MagicMock()
        user.display_name = "User"
        user.email = "u@example.com"

        settings = MagicMock()
        settings.telegram_bot_token = "bot-token"
        settings.telegram_chat_id = "chat-id"
        settings.whatsapp_phone_id = ""
        settings.whatsapp_token = ""
        settings.whatsapp_to = ""
        settings.whatsapp_api_version = "v21.0"

        mock_response = MagicMock(spec=Response)
        mock_response.is_error = False

        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_response

        with patch("app.support_service.httpx.AsyncClient", return_value=mock_client):
            result = await notify_support_ticket(
                ticket=ticket, user=user, settings=settings
            )

        assert result is True

    @pytest.mark.asyncio
    async def test_both_unconfigured(self):
        ticket = MagicMock()
        ticket.id = "ticket-2"
        ticket.category = "general"
        ticket.escalation_reason = ""
        ticket.customer_message = "test"
        ticket.bot_response = None

        user = MagicMock()
        user.display_name = "User"
        user.email = "u@example.com"

        settings = MagicMock()
        settings.telegram_bot_token = ""
        settings.telegram_chat_id = ""
        settings.whatsapp_phone_id = ""
        settings.whatsapp_token = ""
        settings.whatsapp_to = ""
        settings.whatsapp_api_version = "v21.0"

        result = await notify_support_ticket(
            ticket=ticket, user=user, settings=settings
        )

        assert result is False
