"""Shared payment truth helpers for Square checkout and webhook handling."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
import time
import uuid
from dataclasses import dataclass
from typing import Iterable, Iterator
from urllib.parse import quote

BOT_SHIELD_CENTS = 100
FOUNDING_MEMBER_CENTS = 1499
THREE_MONTH_FOUNDER_CENTS = 3999
TWELVE_MONTH_FOUNDER_CENTS = 9999
ROYALTY_CARD_CENTS = 250_000
SQUARE_CURRENCY = "USD"
CHECKOUT_REF_VERSION = "v1"
CHECKOUT_REF_MARKER = "agref:"
BOT_SHIELD_PRODUCT_NAME = "Bot-Shield Verification"
BOT_SHIELD_CHECKOUT_DESCRIPTION = "YouAndINotAI Bot-Shield verification checkout"
FOUNDING_MEMBER_PRODUCT_NAME = "YouAndINotAI Founding Member"
FOUNDING_MEMBER_CHECKOUT_DESCRIPTION = "YouAndINotAI founding member monthly checkout"
THREE_MONTH_PRODUCT_NAME = "YouAndINotAI 3-Month Founder"
THREE_MONTH_CHECKOUT_DESCRIPTION = "YouAndINotAI 3-month founder checkout"
TWELVE_MONTH_PRODUCT_NAME = "YouAndINotAI 12-Month Founder"
TWELVE_MONTH_CHECKOUT_DESCRIPTION = "YouAndINotAI 12-month founder checkout"
ROYALTY_CARD_PRODUCT_NAME = "YouAndINotAI Royalty Card"
ROYALTY_CARD_CHECKOUT_DESCRIPTION = "YouAndINotAI royalty card checkout"
CHECKOUT_REF_RE = re.compile(r"agref:([A-Za-z0-9._-]+)")
NORMALIZE_TEXT_RE = re.compile(r"[^a-z0-9]+")
WALLET_PROOF_PREFIX = "wallet:"


@dataclass(frozen=True)
class PaymentProductSpec:
    tier: str
    amount_cents: int
    hint_texts: tuple[str, ...]


LIVE_PAYMENT_PRODUCTS: tuple[PaymentProductSpec, ...] = (
    PaymentProductSpec(
        tier="bot_shield",
        amount_cents=BOT_SHIELD_CENTS,
        hint_texts=("bot shield", "bot-shield", "botshield", "verified human"),
    ),
    PaymentProductSpec(
        tier="founding_member",
        amount_cents=FOUNDING_MEMBER_CENTS,
        hint_texts=("founding member", "founder monthly", "cxwjcn0s"),
    ),
    PaymentProductSpec(
        tier="3_month",
        amount_cents=THREE_MONTH_FOUNDER_CENTS,
        hint_texts=("3 month", "3-month", "3 month founder", "oY7qEfRM".lower()),
    ),
    PaymentProductSpec(
        tier="12_month",
        amount_cents=TWELVE_MONTH_FOUNDER_CENTS,
        hint_texts=("12 month", "12-month", "12 month founder", "6GHpbvvl".lower()),
    ),
    PaymentProductSpec(
        tier="royalty",
        amount_cents=ROYALTY_CARD_CENTS,
        hint_texts=("royalty", "royalty card", "cafhorus"),
    ),
)

CATALOG_DRIFT_HINTS = (
    "basic monthly subscription",
    "premium monthly subscription",
    "elite monthly subscription",
    "9 99 weekly subscription",
    "9.99 weekly subscription",
    "cic2fnig",
)


def _urlsafe_b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return NORMALIZE_TEXT_RE.sub(" ", value.strip().lower()).strip()


def iter_text_hints(values: Iterable[object]) -> Iterator[str]:
    for value in values:
        if value is None:
            continue
        if isinstance(value, str):
            normalized = _normalize_text(value)
            if normalized:
                yield normalized
            continue
        if isinstance(value, dict):
            yield from iter_text_hints(value.values())
            continue
        if isinstance(value, (list, tuple, set)):
            yield from iter_text_hints(value)
            continue
        normalized = _normalize_text(str(value))
        if normalized:
            yield normalized


def build_checkout_reference(
    *,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
    tier: str,
    secret: str,
    issued_at: int | None = None,
) -> str:
    payload = {
        "u": str(user_id),
        "e": str(event_id),
        "t": tier,
        "iat": issued_at or int(time.time()),
    }
    payload_part = _urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature_part = _urlsafe_b64encode(
        hmac.new(
            secret.encode("utf-8"),
            payload_part.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    )
    return f"{CHECKOUT_REF_VERSION}.{payload_part}.{signature_part}"


def parse_checkout_reference(
    token: str | None,
    *,
    secret: str,
    max_age_seconds: int = 172_800,
) -> dict[str, object] | None:
    if not token:
        return None

    try:
        version, payload_part, signature_part = token.split(".", 2)
    except ValueError:
        return None
    if version != CHECKOUT_REF_VERSION:
        return None

    expected_signature = _urlsafe_b64encode(
        hmac.new(
            secret.encode("utf-8"),
            payload_part.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    )
    if not hmac.compare_digest(expected_signature, signature_part):
        return None

    try:
        payload = json.loads(_urlsafe_b64decode(payload_part).decode("utf-8"))
        user_id = uuid.UUID(str(payload["u"]))
        event_id = uuid.UUID(str(payload["e"]))
        tier = str(payload["t"])
        issued_at = int(payload["iat"])
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return None

    if max_age_seconds > 0 and int(time.time()) - issued_at > max_age_seconds:
        return None

    return {
        "user_id": user_id,
        "event_id": event_id,
        "tier": tier,
        "issued_at": issued_at,
    }


def build_checkout_reference_note(tier: str, checkout_ref: str) -> str:
    return f"{tier} {CHECKOUT_REF_MARKER}{checkout_ref}"


def extract_checkout_reference(*texts: str | None) -> str | None:
    for text in texts:
        if not text:
            continue
        match = CHECKOUT_REF_RE.search(text)
        if match:
            return match.group(1)
    return None


def infer_payment_tier(
    *,
    amount_cents: int | None,
    text_hints: Iterable[object],
) -> str | None:
    normalized_hints = tuple(iter_text_hints(text_hints))
    combined = " ".join(normalized_hints)

    if any(drift_hint in combined for drift_hint in CATALOG_DRIFT_HINTS):
        return None

    for product in LIVE_PAYMENT_PRODUCTS:
        if amount_cents == product.amount_cents:
            return product.tier

    return None


def build_bot_shield_checkout_request(
    *,
    app_url: str,
    location_id: str,
    buyer_email: str,
    checkout_ref: str,
) -> dict[str, object]:
    return build_account_bound_checkout_request(
        app_url=app_url,
        location_id=location_id,
        buyer_email=buyer_email,
        checkout_ref=checkout_ref,
        tier="bot_shield",
        redirect_path=f"/app/verify?status=success&checkout_ref={quote(checkout_ref)}",
    )


def build_account_bound_checkout_request(
    *,
    app_url: str,
    location_id: str,
    buyer_email: str,
    checkout_ref: str,
    tier: str,
    redirect_path: str,
) -> dict[str, object]:
    product_name_map = {
        "bot_shield": BOT_SHIELD_PRODUCT_NAME,
        "founding_member": FOUNDING_MEMBER_PRODUCT_NAME,
        "3_month": THREE_MONTH_PRODUCT_NAME,
        "12_month": TWELVE_MONTH_PRODUCT_NAME,
        "royalty": ROYALTY_CARD_PRODUCT_NAME,
    }
    description_map = {
        "bot_shield": BOT_SHIELD_CHECKOUT_DESCRIPTION,
        "founding_member": FOUNDING_MEMBER_CHECKOUT_DESCRIPTION,
        "3_month": THREE_MONTH_CHECKOUT_DESCRIPTION,
        "12_month": TWELVE_MONTH_CHECKOUT_DESCRIPTION,
        "royalty": ROYALTY_CARD_CHECKOUT_DESCRIPTION,
    }
    amount_map = {
        "bot_shield": BOT_SHIELD_CENTS,
        "founding_member": FOUNDING_MEMBER_CENTS,
        "3_month": THREE_MONTH_FOUNDER_CENTS,
        "12_month": TWELVE_MONTH_FOUNDER_CENTS,
        "royalty": ROYALTY_CARD_CENTS,
    }

    product_name = product_name_map.get(tier)
    description = description_map.get(tier)
    amount_cents = amount_map.get(tier)
    if not product_name or not description or amount_cents is None:
        raise ValueError(f"Unsupported checkout tier: {tier}")

    base_app_url = (app_url or "https://youandinotai.com").rstrip("/")
    redirect_url = f"{base_app_url}/{redirect_path.lstrip('/')}"
    return {
        "idempotency_key": str(uuid.uuid4()),
        "description": description,
        "order": {
            "location_id": location_id,
            "line_items": [
                {
                    "name": product_name,
                    "quantity": "1",
                    "base_price_money": {
                        "amount": amount_cents,
                        "currency": SQUARE_CURRENCY,
                    },
                }
            ],
        },
        "checkout_options": {
            "redirect_url": redirect_url,
            "allow_tipping": False,
            "enable_coupon": False,
        },
        "pre_populated_data": {
            "buyer_email": buyer_email,
        },
        "payment_note": build_checkout_reference_note(tier, checkout_ref),
    }


def extract_payment_proof_label(payment_obj: dict[str, object]) -> str:
    """Summarize the observed payment rail for audit and health reporting."""
    if payment_obj.get("cash_details"):
        return "cash"
    if payment_obj.get("bank_account_details"):
        return "bank_account"

    card_details = payment_obj.get("card_details") or {}
    if not isinstance(card_details, dict):
        card_details = {}
    card = card_details.get("card") or {}
    if not isinstance(card, dict):
        card = {}
    wallet_details = card_details.get("wallet_details") or {}
    if not isinstance(wallet_details, dict):
        wallet_details = {}

    if wallet_details.get("status"):
        wallet_type = str(
            wallet_details.get("brand") or wallet_details.get("type") or "wallet"
        ).strip()
        return f"{WALLET_PROOF_PREFIX}{wallet_type or 'wallet'}"
    if card.get("card_brand"):
        return f"card:{card.get('card_brand')}"

    source_type = str(payment_obj.get("source_type") or "").strip().lower()
    return source_type or "unknown"


def proof_label_is_wallet(label: str | None) -> bool:
    return str(label or "").strip().lower().startswith(WALLET_PROOF_PREFIX)
