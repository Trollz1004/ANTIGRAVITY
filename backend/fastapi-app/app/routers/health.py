"""Health router for service status and dependency checks."""

import logging
from collections.abc import Iterable

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache import redis_health_check
from app.config import get_settings
from app.database import check_db_health, get_db
from app.error_responses import internal_error
from app.models import User
from app.payment_truth import extract_payment_proof_label, proof_label_is_wallet
from app.schemas import HealthResponse
from app.webhook_event_store import recent_processed_payment_payloads

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


def _payment_signature_key() -> str:
    return str(
        getattr(settings, "square_payment_webhook_signature_key", "")
        or getattr(settings, "square_webhook_signature_key", "")
        or ""
    ).strip()


def _payment_notification_url() -> str:
    return str(
        getattr(settings, "square_payment_webhook_notification_url", "")
        or getattr(settings, "square_webhook_notification_url", "")
        or ""
    ).strip()


def _square_health_ready() -> bool:
    payment_link_ready = bool(str(settings.square_access_token or "").strip()) and bool(
        str(settings.square_location_id or "").strip()
    )
    return payment_link_ready


def _square_signature_configured() -> bool:
    if not bool(getattr(settings, "square_webhook_verify_signature", False)):
        return False
    return bool(_payment_signature_key()) and bool(_payment_notification_url())


def _iter_payment_objects(payload: object) -> Iterable[dict]:
    if isinstance(payload, dict):
        payment = payload.get("data", {}).get("object", {}).get("payment")
        if isinstance(payment, dict):
            yield payment
        nested_payment = payload.get("payment")
        if isinstance(nested_payment, dict):
            yield nested_payment


async def _runtime_payment_proof_labels(db: AsyncSession) -> list[str]:
    labels: list[str] = []
    seen: set[str] = set()
    for payload in await recent_processed_payment_payloads(db):
        for payment_obj in _iter_payment_objects(payload):
            label = extract_payment_proof_label(payment_obj)
            if label and label not in seen:
                seen.add(label)
                labels.append(label)
    return labels


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={
        200: {
            "description": "Service is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "db_connected": True,
                        "redis_connected": True,
                        "square_connected": True,
                        "square_signature_configured": True,
                        "wallet_rails_proven": False,
                        "wallet_rails_status": "unproven",
                        "payment_proof_labels": [],
                        "user_count": 42,
                    }
                }
            },
        },
        503: {
            "description": "Service is degraded",
            "content": {
                "application/json": {
                    "example": {
                        "status": "degraded",
                        "db_connected": False,
                        "redis_connected": False,
                        "square_connected": True,
                        "square_signature_configured": False,
                        "wallet_rails_proven": False,
                        "wallet_rails_status": "unproven",
                        "payment_proof_labels": [],
                        "user_count": 0,
                    }
                }
            },
        },
    },
    summary="Health check",
    description="Returns app readiness status including database and Redis, with Square configuration reported separately.",
)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    try:
        db_connected = await check_db_health()
    except Exception:
        logger.exception("Health check database probe failed")
        db_connected = False

    user_count = 0
    if db_connected:
        try:
            count_result = await db.scalar(select(func.count(User.id)))
            user_count = int(count_result or 0)
        except Exception:
            logger.exception("Health check user count failed")
            db_connected = False

    redis_connected = False
    try:
        redis_connected = (await redis_health_check()).get("status") == "ok"
    except Exception:
        logger.exception("Health check Redis probe failed")

    square_connected = _square_health_ready()
    square_signature_configured = _square_signature_configured()
    payment_proof_labels: list[str] = []
    if db_connected:
        try:
            payment_proof_labels = await _runtime_payment_proof_labels(db)
        except Exception:
            logger.exception("Health check payment proof lookup failed")
            payment_proof_labels = []
    wallet_rails_proven = any(
        proof_label_is_wallet(label) for label in payment_proof_labels
    )
    wallet_rails_status = "proven" if wallet_rails_proven else "unproven"

    status_value = "ok" if db_connected and redis_connected else "degraded"
    return HealthResponse(
        status=status_value,
        db_connected=db_connected,
        redis_connected=redis_connected,
        square_connected=square_connected,
        square_signature_configured=square_signature_configured,
        wallet_rails_proven=wallet_rails_proven,
        wallet_rails_status=wallet_rails_status,
        payment_proof_labels=payment_proof_labels,
        user_count=user_count,
    )


@router.get("/health/allocations")
async def check_allocations(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    try:
        result = await db.execute(
            text(
                "SELECT square_payment_id, payer_type, gross_amount_cents, status "
                "FROM revenue_allocations ORDER BY created_at DESC LIMIT 5"
            )
        )
        rows = result.mappings().all()
        return {"allocations": [dict(r) for r in rows]}
    except Exception as e:
        raise internal_error(message=f"Failed to retrieve allocations: {e}")


@router.get("/health/allocations/summary")
async def allocations_summary(db: AsyncSession = Depends(get_db)):
    """Two-figure revenue summary: gross-with-test vs customer-only.

    customer_only is real customer revenue. with_test keeps founder-test
    payments visible for audit without counting them as customers.
    """
    from sqlalchemy import text

    try:
        result = await db.execute(
            text(
                "SELECT payer_type, "
                "COUNT(*) AS payments, "
                "COALESCE(SUM(gross_amount_cents), 0) AS gross_cents "
                "FROM revenue_allocations "
                "GROUP BY payer_type"
            )
        )
        by_payer = {row["payer_type"]: dict(row) for row in result.mappings().all()}

        def _tot(key: str) -> dict:
            row = by_payer.get(key) or {"payments": 0, "gross_cents": 0}
            return {
                "payments": int(row["payments"]),
                "gross_cents": int(row["gross_cents"]),
            }

        customer = _tot("customer")
        founder_test = _tot("founder_test")
        with_test = {
            "payments": customer["payments"] + founder_test["payments"],
            "gross_cents": customer["gross_cents"] + founder_test["gross_cents"],
        }
        return {
            "customer_only": customer,
            "founder_test": founder_test,
            "with_test": with_test,
        }
    except Exception as e:
        raise internal_error(message=f"Failed to summarize allocations: {e}")


# Temporarily removed wipe-users endpoint


@router.get("/health/webhooks")
async def check_webhooks(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    try:
        result = await db.execute(
            text(
                "SELECT event_source_id, event_type, created_at, processed FROM webhook_events ORDER BY created_at DESC LIMIT 10"
            )
        )
        rows = result.mappings().all()
        return {"webhooks": [dict(r) for r in rows]}
    except Exception as e:
        raise internal_error(message=f"Failed to retrieve webhooks: {e}")
