import asyncio
from types import SimpleNamespace

from app.support_service import (
    _ask_anythingllm_support,
    _ask_ollama_support,
    _ask_support_openclaw,
)


def test_support_anythingllm_accepts_structured_text_response(monkeypatch):
    class DummyResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"textResponse": """```json
{"reply":"Founding membership includes access, verification support, safety tooling, and account support.","should_escalate":false,"category":"membership","subject":"Membership support","escalation_reason":null}
```"""}

    class DummyClient:
        def __init__(self, *args, **kwargs):
            self.headers = kwargs.get("headers", {})

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json):  # noqa: A002
            assert url == "/workspace/antigravity-support/chat"
            assert json["mode"] == "chat"
            assert "YouAndINotAI support assistant" in json["message"]
            assert self.headers["Authorization"] == "Bearer test-anythingllm-key"
            return DummyResponse()

    monkeypatch.setattr("app.support_service.httpx.AsyncClient", DummyClient)

    settings = SimpleNamespace(
        support_anythingllm_api_url="http://127.0.0.1:3001/api/v1",
        support_anythingllm_api_key="test-anythingllm-key",
        support_anythingllm_workspace_slug="antigravity-support",
        support_anythingllm_timeout_seconds=15.0,
    )

    decision = asyncio.run(
        _ask_anythingllm_support(
            message="What does founding membership include?",
            transcript=[],
            settings=settings,
        )
    )

    assert decision is not None
    assert decision.preset_key == "anythingllm_support"
    assert decision.category == "membership"
    assert decision.should_escalate is False


def test_support_anythingllm_accepts_safe_freeform_as_review(monkeypatch):
    class DummyResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "textResponse": (
                    "I can help route this support issue to a human review queue "
                    "with the account details and current app state."
                )
            }

    class DummyClient:
        def __init__(self, *args, **kwargs):
            self.headers = kwargs.get("headers", {})

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json):  # noqa: A002
            assert url == "/workspace/antigravity-support/chat"
            assert self.headers["Authorization"] == "Bearer test-anythingllm-key"
            return DummyResponse()

    monkeypatch.setattr("app.support_service.httpx.AsyncClient", DummyClient)

    settings = SimpleNamespace(
        support_anythingllm_api_url="http://127.0.0.1:3001/api/v1",
        support_anythingllm_api_key="test-anythingllm-key",
        support_anythingllm_workspace_slug="antigravity-support",
        support_anythingllm_timeout_seconds=15.0,
    )

    decision = asyncio.run(
        _ask_anythingllm_support(
            message="The onboarding screen loops.",
            transcript=[],
            settings=settings,
        )
    )

    assert decision is not None
    assert decision.preset_key == "anythingllm_support"
    assert decision.should_escalate is True
    assert decision.escalation_reason == "unstructured_ai_review"
    assert decision.reply.startswith("I’m opening a support ticket")


def test_support_anythingllm_rejects_forbidden_freeform(monkeypatch):
    class DummyResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"textResponse": "Use PayPal or Stripe to look up that payment."}

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
        support_anythingllm_api_url="http://127.0.0.1:3001/api/v1",
        support_anythingllm_api_key="test-anythingllm-key",
        support_anythingllm_workspace_slug="antigravity-support",
        support_anythingllm_timeout_seconds=15.0,
    )

    decision = asyncio.run(
        _ask_anythingllm_support(
            message="Where is my receipt?",
            transcript=[],
            settings=settings,
        )
    )

    assert decision is None


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

        async def post(self, *args, **kwargs):  # noqa: ARG002
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


def test_support_ollama_sends_cpu_safe_options(monkeypatch):
    class DummyResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "response": """{"reply":"Square receipts are sent to the checkout email.","should_escalate":false,"category":"billing","subject":"Receipt support"}"""
            }

    captured = {}

    class DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json):  # noqa: A002
            captured["url"] = url
            captured["json"] = json
            return DummyResponse()

    monkeypatch.setattr("app.support_service.httpx.AsyncClient", DummyClient)

    settings = SimpleNamespace(
        support_ollama_base_url="http://127.0.0.1:11434",
        support_ollama_model="qwen2.5:0.5b",
        support_ollama_timeout_seconds=30.0,
        support_ollama_context_tokens=1024,
        support_ollama_num_predict=220,
        support_ollama_num_gpu=0,
    )

    decision = asyncio.run(
        _ask_ollama_support(
            message="Where is my Square receipt?",
            transcript=[],
            settings=settings,
        )
    )

    assert decision is not None
    assert captured["url"] == "/api/generate"
    assert captured["json"]["model"] == "qwen2.5:0.5b"
    assert captured["json"]["options"] == {
        "num_ctx": 1024,
        "num_predict": 220,
        "num_gpu": 0,
    }
