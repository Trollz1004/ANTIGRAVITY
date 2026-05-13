from unittest.mock import AsyncMock

from app.rate_limit import reset_rate_limits


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

    last_response = None
    for i in range(6):
        last_response = client.post(
            "/api/v1/waitlist",
            json={"email": f"waitlist-{i}@example.com"},
        )

    assert last_response is not None
    assert last_response.status_code == 429
    reset_rate_limits()
