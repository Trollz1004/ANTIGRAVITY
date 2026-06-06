"""Square payment link source of truth and tier helpers.

Env overrides (one-line link swap without code change):
  SQUARE_BOT_SHIELD_PAYMENT_LINK
  SQUARE_FOUNDING_MEMBER_PAYMENT_LINK
  SQUARE_3MONTH_PAYMENT_LINK
  SQUARE_12MONTH_PAYMENT_LINK
  SQUARE_ROYALTY_PAYMENT_LINK
Hardcoded values are the fallback when env is unset, so the live site
never breaks on a missing env var.
"""

from __future__ import annotations

import os

_BOT_SHIELD = "https://square.link/u/Qc5mxUy7"
_FOUNDING = "https://square.link/u/cxwjcn0s"
_3MONTH = "https://square.link/u/oY7qEfRM"
_12MONTH = "https://square.link/u/6GHpbvvl"
_ROYALTY = "https://square.link/u/CafhorUS"

BOT_SHIELD_PAYMENT_LINK = (
    os.environ.get("SQUARE_BOT_SHIELD_PAYMENT_LINK") or _BOT_SHIELD
)

PLAN_LINKS: dict[str, str] = {
    "bot_shield": BOT_SHIELD_PAYMENT_LINK,
    "founding_member": os.environ.get("SQUARE_FOUNDING_MEMBER_PAYMENT_LINK")
    or _FOUNDING,
    "3_month": os.environ.get("SQUARE_3MONTH_PAYMENT_LINK") or _3MONTH,
    "12_month": os.environ.get("SQUARE_12MONTH_PAYMENT_LINK") or _12MONTH,
    "royalty": os.environ.get("SQUARE_ROYALTY_PAYMENT_LINK") or _ROYALTY,
}

PLAN_AMOUNTS_CENTS: dict[str, int] = {
    "bot_shield": 100,
    "founding_member": 1499,
    "3_month": 3999,
    "12_month": 9999,
    "royalty": 250_000,
}

VERIFICATION_TIERS = {"bot_shield", "royalty"}
SUBSCRIPTION_TIERS = {"founding_member", "3_month", "12_month"}


def normalize_tier(raw_tier: str | None) -> str | None:
    if not raw_tier:
        return None

    normalized = raw_tier.strip().lower().replace("-", "_").replace(" ", "_")
    aliases = {
        "botshield": "bot_shield",
        "bot_shield": "bot_shield",
        "verification": "bot_shield",
        "founding_member": "founding_member",
        "foundingmember": "founding_member",
        "monthly": "founding_member",
        "3_month": "3_month",
        "3month": "3_month",
        "three_month": "3_month",
        "12_month": "12_month",
        "12month": "12_month",
        "twelve_month": "12_month",
        "royalty": "royalty",
        "royalty_card": "royalty",
    }
    return aliases.get(normalized)


def tier_from_amount(amount_cents: int | None) -> str | None:
    if amount_cents is None:
        return None

    for tier, tier_amount in PLAN_AMOUNTS_CENTS.items():
        if tier_amount == amount_cents:
            return tier
    return None
