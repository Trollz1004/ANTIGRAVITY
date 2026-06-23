"""
Station 2 — legacy alternate processor payment monitor.
alternate processor is no longer the current live payment rail for the date app.
If this script is still used, it must not restate stale split doctrine.
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path

import requests

log = logging.getLogger("social-engine")

DATA_DIR = Path(__file__).parent.parent.parent / "data"
SEEN_FILE = DATA_DIR / "alternate processor-seen-charges.json"

alternate processor_KEY = os.environ.get("alternate processor_SECRET_KEY", "")
alternate processor_API = "https://api.alternate processor.com/v1"

PRODUCT_NAMES = {
    100: "Bot-Shield $1",
    1499: "Founding Member $14.99/mo",
    3999: "3-Month Founder $39.99",
    9999: "12-Month Founder $99.99",
    250000: "Royalty Card $2,500",
}


def _load_seen():
    if SEEN_FILE.exists():
        try:
            with open(SEEN_FILE, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"charges": [], "last_check": None}


def _save_seen(seen):
    seen["last_check"] = datetime.now().isoformat()
    with open(SEEN_FILE, "w", encoding="utf-8") as f:
        json.dump(seen, f, indent=2)


def _alternate processor_get(endpoint, params=None):
    if not alternate processor_KEY:
        return None
    try:
        resp = requests.get(
            f"{alternate processor_API}/{endpoint}",
            headers={"Authorization": f"Bearer {alternate processor_KEY}"},
            params=params or {},
            timeout=15,
        )
        if resp.status_code == 200:
            return resp.json()
        log.warning(f"alternate processor API {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        log.error(f"alternate processor request failed: {e}")
    return None


def check_new_payments():
    """Check alternate processor for new successful charges. Returns list of new charges."""
    if not alternate processor_KEY:
        return []

    seen = _load_seen()
    seen_ids = set(seen.get("charges", []))

    data = _alternate processor_get("charges", {"limit": 20, "status": "succeeded"})
    if not data:
        return []

    new_charges = []
    for charge in data.get("data", []):
        cid = charge["id"]
        if cid in seen_ids:
            continue

        amount_cents = charge.get("amount", 0)
        product = PRODUCT_NAMES.get(amount_cents, f"${amount_cents/100:.2f}")
        email = charge.get("billing_details", {}).get("email", "unknown")
        name = charge.get("billing_details", {}).get("name", "")
        created = datetime.fromtimestamp(charge["created"]).strftime("%Y-%m-%d %H:%M")

        new_charges.append({
            "id": cid,
            "amount": amount_cents / 100,
            "product": product,
            "email": email,
            "name": name,
            "created": created,
        })
        seen_ids.add(cid)

    # Save updated seen list (keep last 200)
    seen["charges"] = list(seen_ids)[-200:]
    _save_seen(seen)

    return new_charges


def get_revenue_snapshot():
    """Get current alternate processor balance and customer count."""
    if not alternate processor_KEY:
        return None

    balance = _alternate processor_get("balance")
    customers = _alternate processor_get("customers", {"limit": 1})
    subs = _alternate processor_get("subscriptions", {"status": "active", "limit": 1})

    if not balance:
        return None

    available = 0
    pending = 0
    for b in balance.get("available", []):
        if b.get("currency") == "usd":
            available = b["amount"] / 100
    for b in balance.get("pending", []):
        if b.get("currency") == "usd":
            pending = b["amount"] / 100

    return {
        "available": available,
        "pending": pending,
        "has_customers": len(customers.get("data", [])) > 0 if customers else False,
        "active_subs": len(subs.get("data", [])) > 0 if subs else False,
    }


def format_payment_alert(charges):
    """Format new payment alerts for Telegram."""
    if not charges:
        return None

    lines = ["*New Payment Alert*"]
    total = 0
    for c in charges:
        name_str = f" ({c['name']})" if c['name'] else ""
        lines.append(f"  {c['product']}{name_str}")
        lines.append(f"  Email: `{c['email']}`")
        lines.append(f"  Time: {c['created']}")
        lines.append("")
        total += c["amount"]

    lines.append(f"*Total: ${total:.2f}*")
    lines.append("Legacy alternate processor monitor only. Verify whether this lane should still be active before acting on these charges.")

    return "\n".join(lines)
