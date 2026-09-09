"""
Revenue Ledger — every transaction committed and tracked.

Persistent revenue tracking for the platform. External systems (Square,
Stripe, Cloudflare workers, etc.) post to the webhook endpoints and the
totals propagate to the revenue ribbon visible on every screen.

Doctrine compliance:
  - All amounts are recorded — never claim contributions or requests.
  - "contributed" / "committed" wording only.
  - The kids-funded estimate uses a configurable per-kid threshold so the UI
    can render an honest count, not a fabricated one.
"""
from __future__ import annotations

import hmac
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from mongo import get_db
from pydantic import BaseModel, Field

_db = get_db()
LEDGER = _db.ledger

# Per-kid funding threshold — covers a meaningful unit of medical-care
# contribution (configurable so Joshua can adjust as the program scales).
KID_THRESHOLD_USD = float(os.environ.get("KID_THRESHOLD_USD", "250"))

BUCKET_NAMES = {
    1: "Kids Fund - Infrastructure Immunity (Security Cleanup)",          2: "Platform Build - Orchestration Engine (Agentic Workflows)",     3: "Hermes Ops",
    4: "Recycle Intake",     5: "AI-Solutions Store - Digital Storefront Accelerator (Storefront Deployment)", 6: "Super Likes Match",
    7: "Content Sprint - Legacy Modernizer (Tech Debt Cleanup)",     8: "Paperclip Scale - Guardian Gateway (API Management)",    9: "Antigravity Reserve",
    10: "Founder Four Trust",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


class ContributionCreate(BaseModel):
    amount_usd: float = Field(gt=0)
    bucket: int = Field(ge=1, le=10)
    source: str = "manual"   # square | stripe | cloudflare | manual | webhook
    note: Optional[str] = ""
    actor: Optional[str] = "Mission Control"


router = APIRouter(prefix="/api/ledger")


@router.post("/contribute")
async def contribute(payload: ContributionCreate, request: Request):
    require_admin(request)
    if payload.bucket not in BUCKET_NAMES:
        raise HTTPException(status_code=400, detail=f"unknown bucket {payload.bucket}")
    entry = {
        "id": _new_id(),
        "amount_usd": round(payload.amount_usd, 2),
        "bucket": payload.bucket,
        "bucket_name": BUCKET_NAMES[payload.bucket],
        "source": payload.source,
        "note": (payload.note or "")[:280],
        "actor": payload.actor,
        "at": _now(),
    }
    await LEDGER.insert_one(entry.copy())
    return entry


@router.get("")
async def list_contributions(limit: int = 50, bucket: Optional[int] = None, source: Optional[str] = None):
    q: Dict[str, Any] = {}
    if bucket is not None: q["bucket"] = bucket
    if source: q["source"] = source
    rows = await LEDGER.find(q, {"_id": 0}).sort("at", -1).to_list(limit)
    return {"entries": rows, "count": len(rows)}


@router.get("/stats")
async def stats():
    """Aggregate stats — drives the Mission ribbon."""
    pipeline = [
        {"$group": {"_id": "$bucket", "amount": {"$sum": "$amount_usd"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    by_bucket_raw = await LEDGER.aggregate(pipeline).to_list(20)
    by_bucket = []
    total = 0.0
    for n in range(1, 11):
        row = next((r for r in by_bucket_raw if r["_id"] == n), None)
        amount = float(row["amount"]) if row else 0.0
        count = int(row["count"]) if row else 0
        total += amount
        by_bucket.append({"bucket": n, "name": BUCKET_NAMES[n], "amount_usd": round(amount, 2), "count": count})

    kids_fund = next((b for b in by_bucket if b["bucket"] == 1), {"amount_usd": 0})
    by_source_raw = await LEDGER.aggregate([
        {"$group": {"_id": "$source", "amount": {"$sum": "$amount_usd"}, "count": {"$sum": 1}}},
    ]).to_list(20)

    return {
        "total_usd": round(total, 2),
        "kids_fund_usd": round(kids_fund["amount_usd"], 2),
        "kids_threshold_usd": KID_THRESHOLD_USD,
        "kids_estimate": int(kids_fund["amount_usd"] / KID_THRESHOLD_USD) if KID_THRESHOLD_USD else 0,
        "by_bucket": by_bucket,
        "by_source": [{"source": r["_id"], "amount_usd": round(float(r["amount"]), 2), "count": int(r["count"])} for r in by_source_raw],
        "tag": "#UntilNoKidInNeed",
    }


# ── Webhooks (permissive — every external system speaks slightly differently) ──
class WebhookPayload(BaseModel):
    amount_usd: Optional[float] = None
    amount_cents: Optional[int] = None
    bucket: Optional[int] = 1
    note: Optional[str] = ""
    raw: Optional[Dict[str, Any]] = None


def _verify_webhook_secret(provided: Optional[str]) -> None:
    """Shared-secret gate for ledger intake.

    Fails closed: with no LEDGER_WEBHOOK_SECRET configured the endpoint is
    disabled rather than accepting anonymous writes to the money ledger.
    """
    expected = os.environ.get("LEDGER_WEBHOOK_SECRET", "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="ledger webhook not configured — set LEDGER_WEBHOOK_SECRET in /app/backend/.env",
        )
    if not provided or not hmac.compare_digest(provided.strip(), expected):
        raise HTTPException(status_code=401, detail="invalid or missing X-Ledger-Secret header")


@router.post("/webhook/{source}")
async def webhook(
    source: str,
    body: WebhookPayload,
    x_ledger_secret: Optional[str] = Header(default=None, alias="X-Ledger-Secret"),
):
    """Permissive intake. Square (Location LY5GN09F5AN83) is the only live
    payment processor — Stripe is dead per doctrine, any stripe hit returns 410.
    Cloudflare workers + manual + test accepted. Default bucket 1 (Kids Fund)."""
    if source == "stripe":
        raise HTTPException(
            status_code=410,
            detail="stripe is dead per doctrine — use /api/ledger/webhook/square (Location LY5GN09F5AN83)",
        )
    _verify_webhook_secret(x_ledger_secret)
    if source not in {"square", "cloudflare", "manual", "test"}:
        raise HTTPException(status_code=400, detail=f"unknown source '{source}' — use square|cloudflare|manual|test")
    amount_usd = body.amount_usd
    if amount_usd is None and body.amount_cents is not None:
        amount_usd = body.amount_cents / 100.0
    if amount_usd is None or amount_usd <= 0:
        raise HTTPException(status_code=400, detail="missing positive amount_usd or amount_cents")
    bucket = body.bucket or 1
    if bucket not in BUCKET_NAMES:
        raise HTTPException(status_code=400, detail=f"unknown bucket {bucket}")

    entry = {
        "id": _new_id(),
        "amount_usd": round(amount_usd, 2),
        "bucket": bucket,
        "bucket_name": BUCKET_NAMES[bucket],
        "source": source,
        "note": (body.note or "")[:280],
        "actor": f"webhook · {source}",
        "raw": body.raw,
        "at": _now(),
    }
    await LEDGER.insert_one(entry.copy())
    return {"ok": True, "id": entry["id"], "amount_usd": entry["amount_usd"], "bucket": bucket}


@router.delete("/{entry_id}")
async def delete_entry(entry_id: str, request: Request):
    require_admin(request)
    res = await LEDGER.delete_one({"id": entry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="entry not found")
    return {"ok": True, "deleted": entry_id}
