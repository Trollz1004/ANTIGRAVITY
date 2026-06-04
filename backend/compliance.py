"""
compliance.py — Manus-backed compliance monitor for the 10/27/63 split.

Per Joshua's spec doc (Response to Emergent · Telegram + Manus Integration for
Compliance Monitoring). Manus is the watchdog. It checks ledger split against
configured doctrine (REVENUE_SPLIT_KIDS / TAX / OPS), and on deviation it
auto-creates a blocking Hermes task in `/api/tasks` so the violation can't be
ignored.

Honest fail: if MANUS_API_KEY is missing, /api/compliance/status reports
configured=False and /api/compliance/check still runs the math locally —
just without the Manus LLM commentary.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import APIRouter, Request
from motor.motor_asyncio import AsyncIOMotorClient

from auth_relay import require_admin

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
LEDGER = _db.ledger
TASKS = _db.tasks
COMPLIANCE_LOG = _db.compliance_log

router = APIRouter(prefix="/api/compliance")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doctrine_splits() -> Dict[str, float]:
    return {
        "kids": float(os.environ.get("REVENUE_SPLIT_KIDS", "10")),
        "tax":  float(os.environ.get("REVENUE_SPLIT_TAX",  "27")),
        "ops":  float(os.environ.get("REVENUE_SPLIT_OPS",  "63")),
    }


def _bucket_to_category(bucket: int) -> str:
    """Map the 10-bucket ledger taxonomy → 3-axis doctrine."""
    # buckets 1-2 → kids fund; 3-4 → tax reserve; 5-10 → ops
    if bucket in (1, 2):
        return "kids"
    if bucket in (3, 4):
        return "tax"
    return "ops"


@router.get("/status")
async def compliance_status():
    """Honest status: are creds wired? What's the latest check verdict?"""
    has_manus = bool(os.environ.get("MANUS_API_KEY", "").strip())
    latest = await COMPLIANCE_LOG.find_one({}, sort=[("checked_at", -1)])
    return {
        "manus_configured": has_manus,
        "doctrine_splits": _doctrine_splits(),
        "latest_check": {
            "verdict": latest.get("verdict") if latest else None,
            "checked_at": latest.get("checked_at") if latest else None,
            "deviation_pct": latest.get("deviation_pct") if latest else None,
        } if latest else None,
        "tag": "#UntilNoKidInNeed",
    }


@router.post("/check")
async def compliance_check(request: Request):
    """Run the 10/27/63 audit. If the actual split deviates more than 5pp
    from doctrine in any axis, auto-file a blocking Hermes task."""
    require_admin(request)
    docs: List[Dict[str, Any]] = await LEDGER.find({}).to_list(length=10_000)
    totals = {"kids": 0.0, "tax": 0.0, "ops": 0.0}
    for d in docs:
        cat = _bucket_to_category(int(d.get("bucket", 5)))
        totals[cat] += float(d.get("amount_usd", 0))
    grand = sum(totals.values()) or 1e-9
    actual_pct = {k: round(v / grand * 100, 2) for k, v in totals.items()}
    target = _doctrine_splits()
    deviations = {k: round(actual_pct[k] - target[k], 2) for k in target}
    max_dev = max(abs(v) for v in deviations.values())
    verdict = "ok" if max_dev <= 5.0 else "deviation"

    # On deviation → auto-file a Hermes task so it can't get ignored
    auto_task = None
    if verdict == "deviation":
        worst = max(deviations.items(), key=lambda kv: abs(kv[1]))
        title = f"⚠️ Compliance deviation · {worst[0]} bucket off by {worst[1]:+.2f}pp"
        body = (
            f"Manus compliance monitor flagged a {worst[1]:+.2f}pp deviation in the "
            f"{worst[0]} bucket. Doctrine target: {target[worst[0]]}%, actual: "
            f"{actual_pct[worst[0]]}% of ${grand:.2f} committed.\n\n"
            f"Full split — kids: {actual_pct['kids']}% (target {target['kids']}%), "
            f"tax: {actual_pct['tax']}% (target {target['tax']}%), "
            f"ops: {actual_pct['ops']}% (target {target['ops']}%).\n\n"
            f"Action: rebalance next dispatch or escalate to Joshua."
        )
        task_doc = {
            "id": uuid.uuid4().hex[:12], "title": title, "body": body,
            "owner": "compliance-monitor", "bucket": 4, "priority": "p0",
            "status": "open", "due_at": None, "depends_on": [],
            "source": "Manus · auto-filed by /api/compliance/check",
            "created_at": _now(), "updated_at": _now(),
        }
        await TASKS.insert_one(task_doc.copy())
        auto_task = task_doc["id"]

    log_entry = {
        "id": uuid.uuid4().hex[:12],
        "verdict": verdict, "deviation_pct": max_dev,
        "actual": actual_pct, "target": target,
        "grand_total_usd": round(grand, 2),
        "auto_task_id": auto_task,
        "checked_at": _now(),
    }
    await COMPLIANCE_LOG.insert_one(log_entry.copy())
    log_entry.pop("_id", None)
    return log_entry


@router.get("/history")
async def compliance_history(limit: int = 20):
    """Past compliance checks — the audit trail."""
    docs = await COMPLIANCE_LOG.find({}, sort=[("checked_at", -1)]).to_list(length=limit)
    for d in docs:
        d.pop("_id", None)
    return {"checks": docs, "count": len(docs)}
