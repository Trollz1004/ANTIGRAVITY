"""
Public storefront + auto-broadcast — solo-founder revenue surface.

This module ships the smallest possible thing that accepts payments:

  GET  /api/public/products   — public catalogue (no auth)
  GET  /api/public/site       — public stats for the landing page
  POST /api/public/products   — admin only, create/replace a product
  DELETE /api/public/products/{id} — admin only

Strategy: Square hosted Online Checkout Links. Joshua creates a link once
inside Square dashboard (no API key, no payouts API integration), pastes
it into a product row, and "Buy now" sends customers straight to Square.
On payment, the Square webhook (already wired at /api/ledger/webhook/square)
records the sale and the auto-broadcast hook in ledger.py fires a Telegram notice.

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
        "title": "Bot Shield · Square Hosted",
        "description": "Square-hosted protection SKU for solo founders. Real product, real Square checkout.",
        "price_usd": 9.00, "sku": "OPC-BOTSHIELD-9", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_BOT_SHIELD_LINK", "https://checkout.square.site/SET-THIS-IN-SQUARE-DASHBOARD"),
    },
    {
        "title": "Founding Member · Square Subscription",
        "description": "Recurring Square subscription with early-access support and launch updates.",
        "price_usd": 29.00, "sku": "OPC-FOUNDING-29", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_FOUNDING_MEMBER_LINK", "https://checkout.square.site/SET-THIS-IN-SQUARE-DASHBOARD"),
    },
    {
        "title": "3-Month Support Pass · Square",
        "description": "Quarterly access tier on Square with locked rate and monthly updates.",
        "price_usd": 79.00, "sku": "OPC-3MO-79", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_3MONTH_LINK", "https://square.link/u/SET-THIS-IN-SQUARE-DASHBOARD"),
    },
    {
        "title": "12-Month Support Pass · Square",
        "description": "Annual pass on Square with best per-month rate and extended support access.",
        "price_usd": 299.00, "sku": "OPC-12MO-299", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_12MONTH_LINK", "https://square.link/u/SET-THIS-IN-SQUARE-DASHBOARD"),
    },
    {
        "title": "Royalty Tier · Square",
        "description": "Top-tier Square plan with advisory access and strategy updates.",
        "price_usd": 499.00, "sku": "OPC-ROYALTY-499", "bucket": 5,
        "square_checkout_url": os.environ.get("SQUARE_ROYALTY_LINK", "https://square.link/u/SET-THIS-IN-SQUARE-DASHBOARD"),
    },
    {
        "title": "Custom AI Image Pack · Support",
        "description": "One Nano Banana-generated custom image. Tell us the theme and receive a PNG.",
        "price_usd": 9.00, "sku": "OPC-PATCH-9", "bucket": 5,
        "square_checkout_url": "https://checkout.square.site/SET-THIS-IN-SQUARE-DASHBOARD",
    },
    {
        "title": "AI Prompt Pack · Solo Founders",
        "description": "50 battle-tested prompts for solo founders running on free-tier compute. Marketing, ops, hiring.",
        "price_usd": 29.00, "sku": "OPC-PROMPT-29", "bucket": 5,
        "square_checkout_url": "https://checkout.square.site/SET-THIS-IN-SQUARE-DASHBOARD",
    },
    {
        "title": "Mission Control Drop-in · Electron",
        "description": "The 4 TSX files that ship the Mission Control surface into an Electron flagship. Drop in, run.",
        "price_usd": 99.00, "sku": "OPC-DROPIN-99", "bucket": 5,
        "square_checkout_url": "https://checkout.square.site/SET-THIS-IN-SQUARE-DASHBOARD",
    },
    {
        "title": "Agent Setup Consultation · 30 min",
        "description": "Joshua + you, 30 minutes, screen-share. We get your Hermes/Ollama/agent fleet wired live.",
        "price_usd": 49.00, "sku": "OPC-CONSULT-49", "bucket": 5,
        "square_checkout_url": "https://checkout.square.site/SET-THIS-IN-SQUARE-DASHBOARD",
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
    reserve = await LEDGER.aggregate([
        {"$match": {"bucket": 1}},
        {"$group": {"_id": None, "amount": {"$sum": "$amount_usd"}}},
    ]).to_list(1)
    threshold = float(os.environ.get("PLATFORM_BUCKET_THRESHOLD_USD", "250"))
    total_usd = round(float(total[0]["amount"]), 2) if total else 0.0
    reserve_usd = round(float(reserve[0]["amount"]), 2) if reserve else 0.0
    return {
        "name": "OpusPawClaw",
        "tagline": "Solo-founder, low-cost compute, and customer-facing reliability.",
        "canonical_url": "opushashands.youandinotai.com",
        "mission_tag": "revenue-operating-rail",
        "totals": {
            "committed_usd": total_usd,
            "reserve_bucket_usd": reserve_usd,
            "reserve_units": int(reserve_usd / threshold) if threshold else 0,
            "reserve_threshold_usd": threshold,
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
        "tag": "revenue-operating-rail",
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
