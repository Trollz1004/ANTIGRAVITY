"""Tests for Square payment-link creation helpers."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.square_checkout import create_square_payment_link


class FakeSettings:
    square_access_token = "test-token"
    square_location_id = "test-location"
    square_api_base_url = "https://connect.squareup.com"
    square_api_version = "2026-01-22"


@pytest.mark.asyncio
async def test_create_payment_link_happy_path():
    settings = FakeSettings()
    request_body = {
        "idempotency_key": "test-key",
        "quick_pay": {
            "name": "Bot-Shield",
            "price_money": {"amount": 100, "currency": "USD"},
            "location_id": "test-location",
        },
    }
    fake_url = "https://square.link/u/test"

    mock_response = MagicMock(spec=httpx.Response)
    mock_response.json.return_value = {
        "payment_link": {"url": fake_url, "id": "test-link-id"}
    }

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.__aenter__.return_value = mock_client
    mock_client.post.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await create_square_payment_link(
            request_body=request_body, settings=settings
        )

    assert result == fake_url
    mock_client.post.assert_called_once_with(
        "/v2/online-checkout/payment-links",
        headers={
            "Authorization": "Bearer test-token",
            "Square-Version": "2026-01-22",
            "Content-Type": "application/json",
        },
        json=request_body,
    )


@pytest.mark.asyncio
async def test_create_payment_link_missing_credentials():
    settings = FakeSettings()
    settings.square_access_token = ""
    request_body = {"name": "test"}
    result = await create_square_payment_link(
        request_body=request_body, settings=settings
    )
    assert result is None

    settings.square_access_token = "test-token"
    settings.square_location_id = ""
    result = await create_square_payment_link(
        request_body=request_body, settings=settings
    )
    assert result is None


@pytest.mark.asyncio
async def test_create_payment_link_http_error():
    settings = FakeSettings()
    request_body = {"name": "test"}

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.__aenter__.return_value = mock_client
    mock_client.post.side_effect = httpx.HTTPStatusError(
        "402 Payment Required",
        request=MagicMock(),
        response=MagicMock(status_code=402),
    )

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await create_square_payment_link(
            request_body=request_body, settings=settings
        )

    assert result is None


@pytest.mark.asyncio
async def test_create_payment_link_value_error():
    settings = FakeSettings()
    request_body = {"name": "test"}

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.__aenter__.return_value = mock_client
    mock_client.post.side_effect = ValueError("Invalid JSON")

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await create_square_payment_link(
            request_body=request_body, settings=settings
        )

    assert result is None


@pytest.mark.asyncio
async def test_create_payment_link_empty_url():
    settings = FakeSettings()
    request_body = {"name": "test"}

    mock_response = MagicMock(spec=httpx.Response)
    mock_response.json.return_value = {"payment_link": {"url": ""}}

    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.__aenter__.return_value = mock_client
    mock_client.post.return_value = mock_response

    with patch("httpx.AsyncClient", return_value=mock_client):
        result = await create_square_payment_link(
            request_body=request_body, settings=settings
        )

    assert result is None
