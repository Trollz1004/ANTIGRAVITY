import asyncio
import uuid
from datetime import date, datetime, timezone
from types import SimpleNamespace

from app.models import SupportTicket, User
from app.support_service import notify_support_ticket


def _user() -> User:
    return User(
        id=uuid.uuid4(),
        email="support-alert@example.com",
        password_hash="hashed",
        display_name="Support Alert",
        date_of_birth=date(1990, 1, 1),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _ticket(user: User) -> SupportTicket:
    return SupportTicket(
        id=uuid.uuid4(),
        user_id=user.id,
        category="billing",
        subject="Billing: charged twice",
        customer_email=user.email,
        customer_message="I was charged twice for Founding Member.",
        bot_response="I'm opening a billing ticket.",
        escalation_reason="billing_review",
        transcript=[],
    )


def test_support_ticket_alert_sends_whatsapp_when_configured(monkeypatch):
    calls = []

    class FakeResponse:
        status_code = 200
        is_error = False

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, *, json=None, headers=None):
            calls.append({"url": url, "json": json, "headers": headers})
            return FakeResponse()

    monkeypatch.setattr("app.support_service.httpx.AsyncClient", FakeAsyncClient)

    user = _user()
    settings = SimpleNamespace(
        whatsapp_phone_id="phone-id",
        whatsapp_token="whatsapp-membership record",
        whatsapp_to="15551234567",
        whatsapp_api_version="v21.0",
        telegram_bot_token="",
        telegram_chat_id="",
    )

    sent = asyncio.run(
        notify_support_ticket(ticket=_ticket(user), user=user, settings=settings)
    )

    assert sent is True
    assert len(calls) == 1
    call = calls[0]
    assert call["url"] == "https://graph.facebook.com/v21.0/phone-id/messages"
    assert call["headers"]["Authorization"] == "Bearer whatsapp-membership record"
    assert call["json"]["messaging_product"] == "whatsapp"
    assert call["json"]["to"] == "15551234567"
    assert "New support ticket" in call["json"]["text"]["body"]
    assert "support-alert@example.com" in call["json"]["text"]["body"]


def test_support_ticket_alert_returns_false_without_channels():
    user = _user()
    settings = SimpleNamespace(
        whatsapp_phone_id="",
        whatsapp_token="",
        whatsapp_to="",
        whatsapp_api_version="v21.0",
        telegram_bot_token="",
        telegram_chat_id="",
    )

    sent = asyncio.run(
        notify_support_ticket(ticket=_ticket(user), user=user, settings=settings)
    )

    assert sent is False
