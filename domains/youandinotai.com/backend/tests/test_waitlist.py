from unittest.mock import AsyncMock


def test_waitlist_signup_sends_confirmation_and_operator_notice(client, monkeypatch):
    confirmation_mock = AsyncMock(return_value=True)
    operator_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_confirmation", confirmation_mock
    )
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_operator_notice", operator_mock
    )

    response = client.post(
        "/api/v1/waitlist",
        json={"email": "waitlist@example.com"},
    )

    assert response.status_code == 202, response.text
    assert response.json() == {
        "received": True,
        "confirmation_sent": True,
        "message": "Check your inbox for confirmation.",
    }
    confirmation_mock.assert_awaited_once()
    operator_mock.assert_awaited_once()


def test_waitlist_signup_fails_closed_when_confirmation_unavailable(
    client, monkeypatch
):
    confirmation_mock = AsyncMock(return_value=False)
    operator_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_confirmation", confirmation_mock
    )
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_operator_notice", operator_mock
    )

    response = client.post(
        "/api/v1/waitlist",
        json={"email": "waitlist@example.com"},
    )

    assert response.status_code == 503, response.text
    assert "temporarily unavailable" in response.text
    confirmation_mock.assert_awaited_once()
    operator_mock.assert_not_awaited()


def test_waitlist_rate_limit_is_active(client, monkeypatch):
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_confirmation",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_operator_notice",
        AsyncMock(return_value=True),
    )

    responses = [
        client.post(
            "/api/v1/waitlist",
            json={"email": f"waitlist-{i}@example.com"},
        )
        for i in range(6)
    ]

    assert all(r.status_code == 202 for r in responses[:5])
    assert responses[5].status_code == 429


def test_waitlist_enforces_configured_waitlist_rate_limit_per_minute(
    client, monkeypatch
):
    from app.config import get_settings

    monkeypatch.setenv("WAITLIST_RATE_LIMIT_PER_MINUTE", "2")
    get_settings.cache_clear()
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_confirmation",
        AsyncMock(return_value=True),
    )
    monkeypatch.setattr(
        "app.routers.waitlist.send_waitlist_operator_notice",
        AsyncMock(return_value=True),
    )

    try:
        r1 = client.post("/api/v1/waitlist", json={"email": "w1@example.com"})
        r2 = client.post("/api/v1/waitlist", json={"email": "w2@example.com"})
        r3 = client.post("/api/v1/waitlist", json={"email": "w3@example.com"})
        assert r1.status_code == 202
        assert r2.status_code == 202
        assert r3.status_code == 429
        assert r3.headers.get("X-RateLimit-Limit") == "2"
    finally:
        get_settings.cache_clear()
