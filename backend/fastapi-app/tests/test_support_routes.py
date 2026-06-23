import asyncio
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

from sqlalchemy import select

from app.auth import get_current_user
from app.main import app
from app.models import SupportTicket, User
from app.support_service import SupportDecision


def _make_user(*, email: str, display_name: str) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed",
        display_name=display_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_support_chat_uses_preset_without_escalation(client, db_session_factory):
    user = _make_user(email="support@example.com", display_name="Support User")

    async def seed_data():
        async with db_session_factory() as session:
            session.add(user)
            await session.commit()

    asyncio.run(seed_data())

    async def override_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.post(
            "/api/v1/support/chat",
            json={"message": "Where is my Square receipt for Bot-Shield?"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["escalated"] is False
        assert payload["category"] == "billing"
        assert "Square sends the checkout receipt" in payload["reply"]

        tickets_response = client.get("/api/v1/support/tickets")
        assert tickets_response.status_code == 200
        assert tickets_response.json() == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_support_chat_escalates_and_operator_can_see_ticket(
    client, db_session_factory, monkeypatch
):
    from app.routers import support as support_router

    operator = _make_user(email="operator@example.com", display_name="Operator")

    async def seed_data():
        async with db_session_factory() as session:
            session.add(operator)
            await session.commit()

    asyncio.run(seed_data())

    async def override_current_user():
        return operator

    monkeypatch.setattr(
        support_router,
        "generate_support_decision",
        AsyncMock(
            return_value=SupportDecision(
                reply="I’m escalating this billing issue to a human review queue now.",
                category="billing",
                preset_key="billing_escalation",
                should_escalate=True,
                escalation_reason="billing_review",
                subject="Billing: charged twice",
            )
        ),
    )
    notify_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(support_router, "notify_support_ticket", notify_mock)
    monkeypatch.setattr(
        support_router,
        "get_settings",
        lambda: SimpleNamespace(
            support_operator_email_list=["operator@example.com"],
            telegram_bot_token="",
            telegram_chat_id="",
            support_ollama_base_url="",
            support_ollama_model="qwen2.5:7b",
            support_ollama_timeout_seconds=10.0,
        ),
    )

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = client.post(
            "/api/v1/support/chat",
            json={"message": "I was charged twice for Founding Member"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["escalated"] is True
        assert payload["ticket"]["category"] == "billing"
        assert payload["ticket"]["escalation_reason"] == "billing_review"
        notify_mock.assert_awaited_once()

        async def fetch_ticket_count():
            async with db_session_factory() as session:
                tickets = (await session.scalars(select(SupportTicket))).all()
                return len(tickets)

        assert asyncio.run(fetch_ticket_count()) == 1

        operator_queue = client.get("/api/v1/support/operator/tickets")
        assert operator_queue.status_code == 200
        queue = operator_queue.json()
        assert len(queue) == 1
        assert queue[0]["customer_email"] == "operator@example.com"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_whatsapp_webhook_verification_challenge(client, monkeypatch):
    from app.routers import support as support_router

    monkeypatch.setattr(
        support_router,
        "get_settings",
        lambda: SimpleNamespace(whatsapp_webhook_verify_token="verify-membership record"),
    )

    response = client.get(
        "/api/v1/support/whatsapp/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "verify-membership record",
            "hub.challenge": "challenge-123",
        },
    )

    assert response.status_code == 200
    assert response.text == "challenge-123"


def test_whatsapp_owner_reply_updates_ticket(client, db_session_factory, monkeypatch):
    from app.routers import support as support_router

    owner = _make_user(email="operator@example.com", display_name="Operator")
    ticket_id = uuid.uuid4()

    async def seed_data():
        async with db_session_factory() as session:
            session.add(owner)
            session.add(
                SupportTicket(
                    id=ticket_id,
                    user_id=owner.id,
                    status="open",
                    category="billing",
                    subject="Billing: charged twice",
                    customer_email=owner.email,
                    customer_message="I was charged twice.",
                    bot_response="I am opening a billing ticket.",
                    escalation_reason="billing_review",
                    transcript=[],
                )
            )
            await session.commit()

    asyncio.run(seed_data())

    secret = "whatsapp-app-secret"
    monkeypatch.setattr(
        support_router,
        "get_settings",
        lambda: SimpleNamespace(
            whatsapp_app_secret=secret,
            whatsapp_owner_phone="13529735909",
            whatsapp_to="13529735909",
        ),
    )
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "messages": [
                                {
                                    "from": "13529735909",
                                    "text": {
                                        "body": f"close {ticket_id} Customer refunded in Square."
                                    },
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    }
    body = json.dumps(payload).encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()

    response = client.post(
        "/api/v1/support/whatsapp/webhook",
        content=body,
        headers={
            "content-type": "application/json",
            "x-hub-signature-256": f"sha256={signature}",
        },
    )

    assert response.status_code == 200
    assert response.json()["results"] == [
        {"processed": True, "reason": "ticket_updated"}
    ]

    async def fetch_ticket():
        async with db_session_factory() as session:
            return await session.get(SupportTicket, ticket_id)

    ticket = asyncio.run(fetch_ticket())
    assert ticket.status == "closed"
    assert ticket.transcript[-1]["role"] == "assistant"
    assert "Customer refunded in Square." in ticket.transcript[-1]["content"]
