"""
Mission Ledger — every dollar committed to the kids fund, tracked.

Replaces the mirror DAO band with real persistent revenue tracking. External
systems (Square, Stripe, Cloudflare workers, etc.) post to the webhook
endpoints and the totals propagate to the Mission ribbon visible on every
screen.

Doctrine compliance:
  - All amounts are recorded — never claim donations or solicitations.
  - "contributed" / "committed" wording only.
  - The kids-funded estimate uses a configurable per-kid threshold so the UI
    can render an honest count, not a fabricated one.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
LEDGER = _db.ledger


async def _maybe_broadcast(entry: Dict[str, Any]) -> None:
    """Fire-and-forget encrypted me-to-me notice when a contribution lands.

    Prefers WhatsApp (E2E encrypted personal channel · Joshua's directive).
    Falls back to Telegram only if WhatsApp creds are missing.
    Either way: never raise — the webhook always succeeds even if both fail.
    """
    text = (
        f"💠 *Contribution recorded · ${entry['amount_usd']:.2f}*\n"
        f"Bucket *{entry['bucket']} · {entry['bucket_name']}* via _{entry['source']}_\n"
        f"{entry.get('note') or ''}\n\n"
        f"_OpusPawClaw Mission Control · #UntilNoKidInNeed_"
    )
    # Prefer WhatsApp (e2e encrypted me-to-me)
    wa_phone_id = os.environ.get("WHATSAPP_PHONE_ID", "").strip()
    wa_token = os.environ.get("WHATSAPP_TOKEN", "").strip()
    wa_to = os.environ.get("WHATSAPP_TO", "").strip()
    if wa_phone_id and wa_token and wa_to:
        try:
            from hub import _whatsapp_send  # late import — avoids circular at module load
            await _whatsapp_send(text)
            return
        except Exception:
            pass
    # Fallback to Telegram if configured
    tg_token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    tg_chat = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if tg_token and tg_chat:
        try:
            from hub import _telegram_send
            await _telegram_send(text)
        except Exception:
            pass


# Per-kid funding threshold — covers a meaningful unit of medical-care
# contribution (configurable so Joshua can adjust as the program scales).
KID_THRESHOLD_USD = float(os.environ.get("KID_THRESHOLD_USD", "250"))

BUCKET_NAMES = {
    1: "Kids Fund",          2: "Platform Build",     3: "Hermes Ops",
    4: "Recycle Intake",     5: "AI-Solutions Store", 6: "Super Likes Match",
    7: "Content Sprint",     8: "Paperclip Scale",    9: "Antigravity Reserve",
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
async def contribute(payload: ContributionCreate):
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
    await _maybe_broadcast(entry)
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


@router.post("/webhook/{source}")
async def webhook(source: str, body: WebhookPayload):
    """Permissive intake. Revenue surface keeps growing — every new source is
    another bucket feeding the kids fund.

    Joshua's directive (2026-03-02): maximize the # of revenue sources before
    death. Each receiver may pre-split per doctrine (10% kids / 27% tax / 63% ops)
    when bucket==-1 is passed.
    """
    allowed = {"square", "stripe", "cashapp", "paypal", "cloudflare",
               "buymeacoffee", "github_sponsors", "patreon", "kofi",
               "gospel", "manual", "test"}
    if source not in allowed:
        raise HTTPException(status_code=400, detail=f"unknown source '{source}' — use {'|'.join(sorted(allowed))}")
    amount_usd = body.amount_usd
    if amount_usd is None and body.amount_cents is not None:
        amount_usd = body.amount_cents / 100.0
    if amount_usd is None or amount_usd <= 0:
        raise HTTPException(status_code=400, detail="missing positive amount_usd or amount_cents")

    # bucket = -1 → auto-split per doctrine (kids 10% / tax 27% / ops 63%)
    if body.bucket == -1:
        return await _autosplit_insert(amount_usd, source, body.note, body.raw)

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
    await _maybe_broadcast(entry)
    return {"ok": True, "id": entry["id"], "amount_usd": entry["amount_usd"], "bucket": bucket}


async def _autosplit_insert(amount_usd: float, source: str,
                            note: Optional[str], raw: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Split one inbound contribution across the doctrine buckets.

    Default: 10% → bucket 1 (Kids), 27% → bucket 3 (Tax reserve), 63% → bucket 5 (Ops).
    Configurable via REVENUE_SPLIT_{KIDS,TAX,OPS} env vars.
    """
    kids_pct = float(os.environ.get("REVENUE_SPLIT_KIDS", "10")) / 100.0
    tax_pct  = float(os.environ.get("REVENUE_SPLIT_TAX",  "27")) / 100.0
    ops_pct  = float(os.environ.get("REVENUE_SPLIT_OPS",  "63")) / 100.0
    entries = []
    for bucket, pct, label in (
        (1, kids_pct, "kids fund"),
        (3, tax_pct,  "tax reserve"),
        (5, ops_pct,  "operations"),
    ):
        portion = round(amount_usd * pct, 2)
        if portion <= 0:
            continue
        e = {
            "id": _new_id(),
            "amount_usd": portion,
            "bucket": bucket,
            "bucket_name": BUCKET_NAMES.get(bucket, label),
            "source": source,
            "note": f"auto-split {int(pct*100)}% of ${amount_usd:.2f} from {source} · {(note or '')[:200]}",
            "actor": f"webhook · {source} (auto-split)",
            "raw": raw,
            "at": _now(),
        }
        await LEDGER.insert_one(e.copy())
        entries.append(e)
    # Broadcast a single summary, not three pings
    if entries:
        summary = {
            **entries[0],
            "amount_usd": round(amount_usd, 2),
            "bucket": 0,
            "bucket_name": f"auto-split (kids {int(kids_pct*100)}/tax {int(tax_pct*100)}/ops {int(ops_pct*100)})",
            "note": f"3-way split applied. Kids: ${entries[0]['amount_usd']}",
        }
        await _maybe_broadcast(summary)
    return {"ok": True, "auto_split": True, "amount_usd": round(amount_usd, 2),
            "entries": [{"id": e["id"], "bucket": e["bucket"], "amount_usd": e["amount_usd"]} for e in entries]}


@router.delete("/{entry_id}")
async def delete_entry(entry_id: str):
    res = await LEDGER.delete_one({"id": entry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="entry not found")
    return {"ok": True, "deleted": entry_id}
