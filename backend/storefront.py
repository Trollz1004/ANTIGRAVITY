"""
Public storefront + auto-broadcast — solo-founder revenue surface.

Joshua's reality: tapped out, free-tier compute, no funding. This module
ships the smallest possible thing that takes money in:

  GET  /api/public/products   — public catalogue (no auth)
  GET  /api/public/site       — public stats for the landing page
  POST /api/public/products   — admin only, create/replace a product
  DELETE /api/public/products/{id} — admin only

Strategy: Square hosted Online Checkout Links. Joshua creates a link once
inside Square dashboard (no API key, no payouts API integration), pastes
it into a product row, and "Buy now" sends customers straight to Square.
On payment, the Square webhook (already wired at /api/ledger/webhook/square)
records the sale and updates the public totals.

No fabricated data: empty product list returns honest empty array; storefront
mode renders an empty state with a "Seed starter SKUs" admin button.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
PRODUCTS = _db.products


def _is_production() -> bool:
    return os.environ.get("APP_ENV", "").strip().lower() == "production"


def _bot_shield_checkout_url() -> Optional[str]:
    configured = (
        os.environ.get("SQUARE_BOT_SHIELD_LINK")
        or os.environ.get("SQUARE_BOT_SHIELD_PAYMENT_LINK")
        or ""
    ).strip()
    if configured:
        return configured
    if _is_production():
        return None
    return "https://square.link/u/Qc5mxUy7"

# Reuse the admin-auth gate from auth_relay
from auth_relay import require_admin  # noqa: E402

router = APIRouter(prefix="/api/public")
admin_router = APIRouter(prefix="/api/public")  # mounted under same prefix; explicit auth inside


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProductIn(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    description: str = Field(max_length=600, default="")
    price_usd: float = Field(gt=0)
    sku: Optional[str] = None
    square_checkout_url: Optional[str] = None  # paste from Square dashboard
    image_data_uri: Optional[str] = None       # generated via Nano Banana
    bucket: int = Field(default=5, ge=1, le=10)  # default AI-Solutions Store
    active: bool = True


STARTER_SKUS: List[Dict[str, Any]] = [
    {
        "title": "Bot-Shield Verification",
        "description": "One-time verification purchase that helps keep fake profiles out and account trust high.",
        "price_usd": 1.00, "sku": "BOT-SHIELD-1", "bucket": 5,
        "square_checkout_url": _bot_shield_checkout_url(),
    },
    {
        "title": "Founding Member",
        "description": "Monthly membership for early supporters who want account access, uptime, and priority support.",
        "price_usd": 14.99, "sku": "FOUNDING-14-99", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_FOUNDING_MEMBER_LINK", "https://square.link/u/cxwjcn0s"),
    },
    {
        "title": "3-Month Founder",
        "description": "Three-month membership for users who want a longer runway on the founding rate.",
        "price_usd": 39.99, "sku": "FOUNDER-3MO-39-99", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_3MONTH_LINK", "https://square.link/u/oY7qEfRM"),
    },
    {
        "title": "12-Month Founder",
        "description": "Annual membership with the best monthly rate for committed supporters.",
        "price_usd": 99.99, "sku": "FOUNDER-12MO-99-99", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_12MONTH_LINK", "https://square.link/u/6GHpbvvl"),
    },
    {
        "title": "Royalty Card",
        "description": "Premium access tier for supporters who want the highest-touch account experience.",
        "price_usd": 2500.00, "sku": "ROYALTY-2500", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_ROYALTY_LINK", "https://square.link/u/CafhorUS"),
    },
]


# ── Public reads ──────────────────────────────────────────────────────── #
@router.get("/products")
async def list_products():
    rows = await PRODUCTS.find({"active": True}, {"_id": 0}).sort("price_usd", 1).to_list(50)
    return {"products": rows, "count": len(rows)}


@router.get("/site")
async def site_config():
    """Public landing-page payload — no admin numbers, no fabrications."""
    # Pull ledger stats (totals only, no contributor identities)
    LEDGER = _db.ledger
    total = await LEDGER.aggregate([{"$group": {"_id": None, "amount": {"$sum": "$amount_usd"}}}]).to_list(1)
    kids = await LEDGER.aggregate([
        {"$match": {"bucket": 1}}, {"$group": {"_id": None, "amount": {"$sum": "$amount_usd"}}},
    ]).to_list(1)
    threshold = float(os.environ.get("KID_THRESHOLD_USD", "250"))
    total_usd = round(float(total[0]["amount"]), 2) if total else 0.0
    kids_usd = round(float(kids[0]["amount"]), 2) if kids else 0.0
    return {
        "name": "OpusPawClaw",
        "tagline": "Solo founder, free-tier compute, building until no kid is in need.",
        "canonical_url": "opushashands.youandinotai.com",
        "mission_tag": "#UntilNoKidInNeed",
        "totals": {
            "committed_usd": total_usd,
            "kids_fund_usd": kids_usd,
            "kids_estimate": int(kids_usd / threshold) if threshold else 0,
            "kids_threshold_usd": threshold,
        },
        "products_url": "/api/public/products",
        "checkout_processor": "Square (hosted)",
    }


# ── Admin writes ──────────────────────────────────────────────────────── #
@router.post("/products")
async def upsert_product(payload: ProductIn, request: Request):
    require_admin(request)
    doc = payload.model_dump()
    doc["id"] = uuid.uuid4().hex[:12]
    doc["created_at"] = _now()
    doc["updated_at"] = _now()
    await PRODUCTS.insert_one(doc.copy())
    return doc


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    require_admin(request)
    res = await PRODUCTS.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="product not found")
    return {"ok": True, "deleted": product_id}


@router.get("/runway")
async def runway_status():
    """Cost-aware runway pulse for the always-on ribbon.

    Honest read of where Joshua actually stands: which LLM tier the default
    E1 path is using, whether it's the free-tier fallback, and how much
    committed revenue is sitting in the ledger vs a configurable burn rate.

    No fabrication — if EMERGENT_LLM_KEY is unset, that's surfaced too.
    """
    has_emergent = bool(os.environ.get("EMERGENT_LLM_KEY", "").strip())
    # Default E1 fallback model when caller doesn't pin one — set in hub.py.
    default_bridge = ("gemini", "gemini-2.5-flash")
    burn_usd_per_day = float(os.environ.get("BURN_USD_PER_DAY", "8"))

    LEDGER = _db.ledger
    agg = await LEDGER.aggregate([
        {"$group": {"_id": None, "amount": {"$sum": "$amount_usd"}}},
    ]).to_list(1)
    committed = round(float(agg[0]["amount"]), 2) if agg else 0.0
    runway_days = round(committed / burn_usd_per_day, 1) if burn_usd_per_day > 0 else 0.0

    return {
        "default_bridge": {"provider": default_bridge[0], "model": default_bridge[1]},
        "emergent_key_configured": has_emergent,
        "compute_tier": "free-tier · cheapest viable model" if has_emergent else "exhausted · honest fail",
        "committed_usd": committed,
        "burn_usd_per_day": burn_usd_per_day,
        "runway_days": runway_days,
        "note": (
            "Every $9 patch ≈ 1.1 days of free-tier runway at current burn." if burn_usd_per_day > 0 else
            "Burn rate unset — set BURN_USD_PER_DAY in /app/backend/.env to enable forecast."
        ),
        "tag": "#UntilNoKidInNeed",
    }


@router.post("/products/seed")
async def seed_starter_skus(request: Request):
    """Additive seed: inserts any STARTER_SKUS not already in the catalogue
    (matched by sku). Safe to re-run after STARTER_SKUS is expanded."""
    require_admin(request)
    existing_skus = {d["sku"] async for d in PRODUCTS.find({}, {"sku": 1})}
    created = []
    skipped = []
    for s in STARTER_SKUS:
        if s["sku"] in existing_skus:
            skipped.append(s["sku"])
            continue
        doc = {**s, "id": uuid.uuid4().hex[:12], "active": True,
               "image_data_uri": None, "created_at": _now(), "updated_at": _now()}
        await PRODUCTS.insert_one(doc.copy())
        created.append(doc)
    return {"ok": True, "seeded": len(created), "skipped": skipped, "products": created}
