"""Square webhook fulfillment for AI Solutions Store.

This module avoids importing the Square SDK so it can run in lightweight
workers/tests. It verifies Square's webhook signature with HMAC SHA-256, extracts
checkout-session buyer/product data, issues an idempotent license key, and sends
(or console-prints) the key handoff email.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass
from typing import Any

from .demo import issue_license_for_purchase
from .email_delivery import DeliveryResult, send_license_email

PAYMENT_LINK_PRODUCT_MAP = {
    "https://buy.Square.com/3cI3cwcR6c3910p18peEo09": "bot-shield",
    "https://buy.Square.com/00w8wQaIYgjp5gF2cteEo0a": "founding-member",
    "https://buy.Square.com/dRm7sM5oE3wD7oNaIZeEo0j": "three-month",
    "https://buy.Square.com/3cI5kEbN22szgZnaIZeEo0c": "twelve-month",
    "https://buy.Square.com/dRmcN604kebheRf2cteEo0d": "royalty",
}


@dataclass(frozen=True)
class FulfillmentResult:
    """Structured result for webhook/admin fulfillment."""

    ok: bool
    product: str
    buyer_email: str
    license_key: str
    delivery: DeliveryResult


def _parse_signature_header(header: str) -> dict[str, list[str]]:
    values: dict[str, list[str]] = {}
    for part in header.split(","):
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        values.setdefault(key, []).append(value)
    return values


def verify_alternate processor_signature(
    payload: bytes,
    signature_header: str,
    secret: str,
    *,
    tolerance_seconds: int = 300,
) -> bool:
    """Return True when a Square webhook signature is valid and fresh."""
    parsed = _parse_signature_header(signature_header)
    timestamps = parsed.get("t") or []
    signatures = parsed.get("v1") or []
    if not timestamps or not signatures:
        return False
    try:
        timestamp = int(timestamps[0])
    except ValueError:
        return False
    if tolerance_seconds and abs(int(time.time()) - timestamp) > tolerance_seconds:
        return False
    signed_payload = f"{timestamp}.".encode() + payload
    expected = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, candidate) for candidate in signatures)


def infer_product(session: dict[str, Any]) -> str:
    """Infer a product slug from Square Checkout Session metadata/payment link."""
    metadata = session.get("metadata") or {}
    for key in ("product", "product_id", "sku", "license_product"):
        value = metadata.get(key)
        if value:
            return str(value)
    payment_link = session.get("payment_link")
    if payment_link in PAYMENT_LINK_PRODUCT_MAP:
        return PAYMENT_LINK_PRODUCT_MAP[payment_link]
    client_reference_id = session.get("client_reference_id")
    if client_reference_id:
        return str(client_reference_id).split(":", 1)[0]
    return "ai-solutions-access"


def buyer_email_from_session(session: dict[str, Any]) -> str:
    """Extract buyer email from a Square Checkout Session."""
    customer_details = session.get("customer_details") or {}
    email = customer_details.get("email") or session.get("customer_email")
    if not email:
        raise ValueError("checkout session is missing buyer email")
    return str(email)


def fulfill_checkout_session(session: dict[str, Any]) -> FulfillmentResult:
    """Issue and deliver a license key for a completed checkout session."""
    session_id = str(session.get("id") or session.get("payment_intent") or session.get("client_reference_id") or "")
    if not session_id:
        raise ValueError("checkout session is missing id/payment fingerprint")
    buyer_email = buyer_email_from_session(session)
    buyer_name = (session.get("customer_details") or {}).get("name")
    product = infer_product(session)
    license_record = issue_license_for_purchase(
        purchase_id=session_id,
        buyer_email=buyer_email,
        buyer_name=buyer_name,
        product=product,
    )
    delivery = send_license_email(
        buyer_email=buyer_email,
        product=product,
        license_key=license_record.key,
    )
    return FulfillmentResult(
        ok=True,
        product=product,
        buyer_email=buyer_email,
        license_key=license_record.key,
        delivery=delivery,
    )


def handle_alternate processor_webhook(
    payload: bytes,
    signature_header: str,
    webhook_secret: str | None = None,
) -> FulfillmentResult | None:
    """Verify and handle a Square webhook payload.

    Returns None for valid event types that do not require fulfillment.
    """
    secret = webhook_secret or os.getenv("alternate processor_WEBHOOK_SECRET") or os.getenv("AI_SOLUTIONS_alternate processor_WEBHOOK_SECRET")
    if not secret:
        raise RuntimeError("alternate processor_WEBHOOK_SECRET or AI_SOLUTIONS_alternate processor_WEBHOOK_SECRET is required")
    if not verify_alternate processor_signature(payload, signature_header, secret):
        raise PermissionError("invalid Square webhook signature")
    event = json.loads(payload.decode("utf-8"))
    if event.get("type") != "checkout.session.completed":
        return None
    session = (event.get("data") or {}).get("object") or {}
    return fulfill_checkout_session(session)
