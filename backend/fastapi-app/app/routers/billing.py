"""Authenticated checkout launch routes.

Rails allowed on dating surface:
  - Square (primary, live)
  - PayPal
  - Cash App Business
  - Plaid (verification only — not card charge)

STRIPE IS HARD-BANNED on this surface.
"""

from __future__ import annotations

import base64
import logging
from datetime import datetime, timezone
from typing import Literal
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.error_responses import bad_request, service_unavailable
from app.models import User, VerificationEvent
from app.payment_truth import (
    build_account_bound_checkout_request,
    build_checkout_reference,
    email_supported_for_square_checkout,
)
from app.square_checkout import create_square_payment_link

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing")

TierLiteral = Literal["founding_member", "3_month", "12_month", "royalty"]

TIER_AMOUNTS_USD = {
    "founding_member": "14.99",
    "3_month": "39.99",
    "12_month": "99.99",
    "royalty": "2500.00",
}

TIER_LABELS = {
    "founding_member": "Founding Member",
    "3_month": "3-Month Founder",
    "12_month": "12-Month Founder",
    "royalty": "Elite Card",
}


class CheckoutLinkRequest(BaseModel):
    tier: TierLiteral


class CheckoutLinkResponse(BaseModel):
    checkout_url: str
    session_id: str
    rail: str = "square"


class PayPalCreateOrderRequest(BaseModel):
    tier: TierLiteral


class PayPalCreateOrderResponse(BaseModel):
    approve_url: str
    order_id: str
    rail: str = "paypal"


class CashAppCheckoutRequest(BaseModel):
    tier: TierLiteral


class CashAppCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    rail: str = "cashapp"


class PlaidLinkTokenResponse(BaseModel):
    link_token: str
    expiration: str | None = None
    rail: str = "plaid"


class RailsStatusResponse(BaseModel):
    square: bool
    paypal: bool
    paypal_qr: bool = True
    cashapp: bool
    plaid: bool
    stripe: bool = False  # always false — iron wall
    paypal_qr_primary: str | None = None
    paypal_qr_tip_jar: str | None = None


def _assert_not_stripe(path_hint: str = "") -> None:
    """Defense in depth — never route dating payments through Stripe."""
    if "stripe" in path_hint.lower():
        raise bad_request(message="Stripe is not available on the dating surface.")


@router.get("/rails", response_model=RailsStatusResponse)
async def rails_status() -> RailsStatusResponse:
    s = get_settings()
    return RailsStatusResponse(
        square=bool(str(getattr(s, "square_access_token", "") or "").strip()),
        paypal=bool(
            str(getattr(s, "paypal_client_id", "") or "").strip()
            and str(getattr(s, "paypal_client_secret", "") or "").strip()
        ),
        paypal_qr=bool(str(getattr(s, "paypal_qr_primary_url", "") or "").strip()),
        cashapp=bool(
            str(getattr(s, "cashapp_checkout_base_url", "") or "").strip()
            or str(getattr(s, "cashapp_cashtag", "") or "").strip()
            or str(getattr(s, "square_access_token", "") or "").strip()
        ),
        plaid=bool(
            str(getattr(s, "plaid_client_id", "") or "").strip()
            and str(getattr(s, "plaid_secret", "") or "").strip()
        ),
        stripe=False,
        paypal_qr_primary=str(getattr(s, "paypal_qr_primary_url", "") or "").strip()
        or None,
        paypal_qr_tip_jar=str(getattr(s, "paypal_qr_tip_jar_url", "") or "").strip()
        or None,
    )


@router.post("/checkout-link", response_model=CheckoutLinkResponse)
async def create_checkout_link(
    payload: CheckoutLinkRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutLinkResponse:
    _assert_not_stripe("square")
    settings = get_settings()

    if not email_supported_for_square_checkout(user.email):
        raise bad_request(message="Use a real email address to launch Square checkout.")

    checkout_event = VerificationEvent(
        user_id=user.id,
        challenge_type="payment",
        status="pending",
    )
    db.add(checkout_event)
    await db.flush()

    checkout_ref = build_checkout_reference(
        user_id=user.id,
        event_id=checkout_event.id,
        tier=payload.tier,
        secret=settings.jwt_secret,
    )
    checkout_event.challenge_token = checkout_ref

    request_body = build_account_bound_checkout_request(
        app_url=str(
            getattr(settings, "app_url", "https://youandinotai.com")
            or "https://youandinotai.com"
        ),
        location_id=str(getattr(settings, "square_location_id", "") or "").strip(),
        buyer_email=user.email,
        checkout_ref=checkout_ref,
        tier=payload.tier,
        redirect_path=f"/app/profile?checkout=success&tier={payload.tier}",
    )
    checkout_url = await create_square_payment_link(
        request_body=request_body,
        settings=settings,
    )

    if not checkout_url:
        checkout_event.status = "failed"
        checkout_event.completed_at = datetime.now(timezone.utc)
        await db.commit()
        raise service_unavailable(
            message="Secure Square checkout is temporarily unavailable. Please try again shortly."
        )

    await db.commit()
    return CheckoutLinkResponse(
        checkout_url=checkout_url,
        session_id=str(checkout_event.id),
        rail="square",
    )


async def _paypal_access_token(settings) -> str | None:
    client_id = str(getattr(settings, "paypal_client_id", "") or "").strip()
    client_secret = str(getattr(settings, "paypal_client_secret", "") or "").strip()
    base = str(
        getattr(settings, "paypal_api_base_url", "https://api-m.paypal.com")
        or "https://api-m.paypal.com"
    ).rstrip("/")
    if not client_id or not client_secret:
        return None
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.post(
                f"{base}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {basic}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={"grant_type": "client_credentials"},
            )
        res.raise_for_status()
        return str(res.json().get("access_token") or "").strip() or None
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("PayPal OAuth failed: %s", exc)
        return None


@router.post("/paypal/create-order", response_model=PayPalCreateOrderResponse)
async def paypal_create_order(
    payload: PayPalCreateOrderRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PayPalCreateOrderResponse:
    _assert_not_stripe("paypal")
    settings = get_settings()
    token = await _paypal_access_token(settings)
    if not token:
        raise service_unavailable(
            message="PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
        )

    amount = TIER_AMOUNTS_USD[payload.tier]
    label = TIER_LABELS[payload.tier]
    app_url = str(getattr(settings, "app_url", "https://youandinotai.com") or "").rstrip(
        "/"
    )
    base = str(
        getattr(settings, "paypal_api_base_url", "https://api-m.paypal.com")
        or "https://api-m.paypal.com"
    ).rstrip("/")

    event = VerificationEvent(
        user_id=user.id,
        challenge_type="payment_paypal",
        status="pending",
    )
    db.add(event)
    await db.flush()

    body = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": f"yai-{user.id}-{event.id}-{payload.tier}",
                "description": f"YouAndINotAI {label}",
                "custom_id": f"user:{user.id}|tier:{payload.tier}|evt:{event.id}",
                "amount": {
                    "currency_code": "USD",
                    "value": amount,
                },
            }
        ],
        "application_context": {
            "brand_name": "YouAndINotAI",
            "landing_page": "NO_PREFERENCE",
            "user_action": "PAY_NOW",
            "return_url": f"{app_url}/app/profile?checkout=success&rail=paypal&tier={payload.tier}",
            "cancel_url": f"{app_url}/app/pay?checkout=cancel&rail=paypal",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(
                f"{base}/v2/checkout/orders",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
        res.raise_for_status()
        data = res.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("PayPal create order failed: %s", exc)
        event.status = "failed"
        event.completed_at = datetime.now(timezone.utc)
        await db.commit()
        raise service_unavailable(message="PayPal checkout is temporarily unavailable.")

    order_id = str(data.get("id") or "")
    event.challenge_token = order_id or None
    approve = ""
    for link in data.get("links") or []:
        if str(link.get("rel") or "") == "approve":
            approve = str(link.get("href") or "")
            break

    if not approve or not order_id:
        event.status = "failed"
        event.completed_at = datetime.now(timezone.utc)
        await db.commit()
        raise service_unavailable(message="PayPal did not return an approve URL.")

    await db.commit()
    return PayPalCreateOrderResponse(
        approve_url=approve, order_id=order_id, rail="paypal"
    )


@router.post("/cashapp/checkout", response_model=CashAppCheckoutResponse)
async def cashapp_checkout(
    payload: CashAppCheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CashAppCheckoutResponse:
    """Cash App Business path.

    Preference order:
      1) CASHAPP_CHECKOUT_BASE_URL (hosted)
      2) Square payment link (Cash App Pay often available on Square checkout)
      3) cashtag deep-link assist (manual — last resort)
    """
    _assert_not_stripe("cashapp")
    settings = get_settings()

    event = VerificationEvent(
        user_id=user.id,
        challenge_type="payment_cashapp",
        status="pending",
    )
    db.add(event)
    await db.flush()

    hosted = str(getattr(settings, "cashapp_checkout_base_url", "") or "").strip()
    if hosted:
        sep = "&" if "?" in hosted else "?"
        url = f"{hosted}{sep}tier={payload.tier}&uid={user.id}&evt={event.id}"
        event.challenge_token = f"cashapp-hosted:{event.id}"
        await db.commit()
        return CashAppCheckoutResponse(
            checkout_url=url, session_id=str(event.id), rail="cashapp"
        )

    # Fall through to Square (supports Cash App Pay on many merchant accounts)
    if email_supported_for_square_checkout(user.email):
        checkout_ref = build_checkout_reference(
            user_id=user.id,
            event_id=event.id,
            tier=payload.tier,
            secret=settings.jwt_secret,
        )
        event.challenge_token = checkout_ref
        request_body = build_account_bound_checkout_request(
            app_url=str(
                getattr(settings, "app_url", "https://youandinotai.com")
                or "https://youandinotai.com"
            ),
            location_id=str(getattr(settings, "square_location_id", "") or "").strip(),
            buyer_email=user.email,
            checkout_ref=checkout_ref,
            tier=payload.tier,
            redirect_path=f"/app/profile?checkout=success&rail=cashapp&tier={payload.tier}",
        )
        checkout_url = await create_square_payment_link(
            request_body=request_body,
            settings=settings,
        )
        if checkout_url:
            await db.commit()
            return CashAppCheckoutResponse(
                checkout_url=checkout_url,
                session_id=str(event.id),
                rail="cashapp",
            )

    cashtag = str(getattr(settings, "cashapp_cashtag", "") or "").strip().lstrip("$")
    if cashtag:
        amount = TIER_AMOUNTS_USD[payload.tier]
        # Cash App open URL — user confirms amount; reconcile via support/webhook later
        url = f"https://cash.app/${quote(cashtag)}/{amount}"
        event.challenge_token = f"cashapp-tag:{cashtag}:{event.id}"
        await db.commit()
        return CashAppCheckoutResponse(
            checkout_url=url, session_id=str(event.id), rail="cashapp"
        )

    event.status = "failed"
    event.completed_at = datetime.now(timezone.utc)
    await db.commit()
    raise service_unavailable(
        message="Cash App checkout is not configured. Set CASHAPP_CHECKOUT_BASE_URL, CASHAPP_CASHTAG, or Square credentials."
    )


@router.post("/plaid/link-token", response_model=PlaidLinkTokenResponse)
async def plaid_link_token(
    user: User = Depends(get_current_user),
) -> PlaidLinkTokenResponse:
    """Create a Plaid Link token for bank identity / auth verification (not a card charge)."""
    _assert_not_stripe("plaid")
    settings = get_settings()
    client_id = str(getattr(settings, "plaid_client_id", "") or "").strip()
    secret = str(getattr(settings, "plaid_secret", "") or "").strip()
    env = str(getattr(settings, "plaid_env", "sandbox") or "sandbox").strip().lower()
    if not client_id or not secret:
        raise service_unavailable(
            message="Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET."
        )

    host = {
        "sandbox": "https://sandbox.plaid.com",
        "development": "https://development.plaid.com",
        "production": "https://production.plaid.com",
    }.get(env, "https://sandbox.plaid.com")

    products = [
        p.strip()
        for p in str(getattr(settings, "plaid_products", "auth,identity") or "").split(
            ","
        )
        if p.strip()
    ] or ["auth", "identity"]
    countries = [
        c.strip()
        for c in str(getattr(settings, "plaid_country_codes", "US") or "").split(",")
        if c.strip()
    ] or ["US"]

    body = {
        "client_id": client_id,
        "secret": secret,
        "client_name": "YouAndINotAI",
        "language": "en",
        "country_codes": countries,
        "user": {"client_user_id": str(user.id)},
        "products": products,
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.post(f"{host}/link/token/create", json=body)
        res.raise_for_status()
        data = res.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Plaid link token failed: %s", exc)
        raise service_unavailable(message="Plaid Link is temporarily unavailable.")

    token = str(data.get("link_token") or "").strip()
    if not token:
        raise service_unavailable(message="Plaid did not return a link_token.")

    return PlaidLinkTokenResponse(
        link_token=token,
        expiration=str(data.get("expiration") or "") or None,
        rail="plaid",
    )
