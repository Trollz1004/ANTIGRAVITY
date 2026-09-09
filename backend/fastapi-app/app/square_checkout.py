"""Shared Square payment-link creation helpers."""

from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)


async def create_square_payment_link(
    *,
    request_body: dict[str, object],
    settings,
) -> str | None:
    square_access_token = str(
        getattr(settings, "square_access_token", "") or ""
    ).strip()
    square_location_id = str(getattr(settings, "square_location_id", "") or "").strip()
    square_api_base_url = str(
        getattr(settings, "square_api_base_url", "https://connect.squareup.com")
        or "https://connect.squareup.com"
    ).rstrip("/")
    square_api_version = str(
        getattr(settings, "square_api_version", "2026-01-22") or "2026-01-22"
    )

    if not square_access_token or not square_location_id:
        return None

    try:
        async with httpx.AsyncClient(
            base_url=square_api_base_url,
            timeout=10.0,
        ) as client:
            response = await client.post(
                "/v2/online-checkout/payment-links",
                headers={
                    "Authorization": f"Bearer {square_access_token}",
                    "Square-Version": square_api_version,
                    "Content-Type": "application/json",
                },
                json=request_body,
            )
        response.raise_for_status()
        response_json = response.json()
        payment_link = response_json.get("payment_link") or {}
        checkout_url = str(payment_link.get("url") or "").strip()
        return checkout_url or None
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Square CreatePaymentLink failed: %s", exc)
        return None
