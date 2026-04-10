"""Health router for service status and dependency checks."""

from collections.abc import Iterable

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import check_db_health, get_db
from app.models import User
from app.payment_truth import extract_payment_proof_label, proof_label_is_wallet
from app.schemas import HealthResponse
from app.webhook_event_store import recent_processed_payment_payloads

router = APIRouter()
settings = get_settings()


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


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_connected = await check_db_health()

    user_count = 0
    if db_connected:
        count_result = await db.scalar(select(func.count(User.id)))
        user_count = int(count_result or 0)

    square_connected = _square_health_ready()
    square_signature_configured = _square_signature_configured()
    payment_proof_labels: list[str] = []
    if db_connected:
        payment_proof_labels = await _runtime_payment_proof_labels(db)
    wallet_rails_proven = any(
        proof_label_is_wallet(label) for label in payment_proof_labels
    )
    wallet_rails_status = "proven" if wallet_rails_proven else "unproven"

    status_value = (
        "ok"
        if db_connected and square_connected and square_signature_configured
        else "degraded"
    )
    return HealthResponse(
        status=status_value,
        db_connected=db_connected,
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
        result = await db.execute(text("SELECT square_payment_id, gross_amount_cents, charitable_amount_cents, operating_amount_cents, status FROM revenue_allocations ORDER BY created_at DESC LIMIT 5"))
        rows = result.mappings().all()
        return {"allocations": [dict(r) for r in rows]}
    except Exception as e:
        return {"error": str(e)}
