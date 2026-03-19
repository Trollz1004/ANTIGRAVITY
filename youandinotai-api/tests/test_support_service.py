import asyncio
from types import SimpleNamespace

from app.support_service import _ask_support_openclaw


def test_support_openclaw_accepts_direct_reply_payload(monkeypatch):
    class DummyResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "sessionId": "sabertooth-smoke-test",
                "reply": "Square sends receipts to the payment email used at checkout.",
                "should_escalate": False,
                "category": "billing",
                "subject": "Billing: receipt help",
                "escalation_reason": None,
            }

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, *args, **kwargs):
            return DummyResponse()

    monkeypatch.setattr("app.support_service.httpx.AsyncClient", DummyClient)

    settings = SimpleNamespace(
        support_openclaw_url="http://192.168.0.15:18895",
        support_openclaw_timeout_seconds=15.0,
    )

    decision = asyncio.run(
        _ask_support_openclaw(
            message="Where is my Square receipt?",
            transcript=[],
            session_key="user-123",
            settings=settings,
        )
    )

    assert decision is not None
    assert decision.reply.startswith("Square sends receipts")
    assert decision.category == "billing"
    assert decision.should_escalate is False
