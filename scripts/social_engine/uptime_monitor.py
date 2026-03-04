"""
Station 4 — Uptime & Payment Link Monitor.
Checks site and payment links are alive.
Stripe-specific alerts are optional and controlled by env vars.
"""
import logging
import os
import json
from datetime import datetime

import requests

log = logging.getLogger("social-engine")

SITES = [
    {"name": "youandinotai.com", "url": "https://youandinotai.com", "critical": True},
    {"name": "onlinerecycle.org", "url": "https://onlinerecycle.org", "critical": False},
    {"name": "ai-solutions.store", "url": "https://ai-solutions.store", "critical": False},
]

DEFAULT_PAYMENT_LINKS = [
    {"name": "Bot-Shield $1", "url": "https://buy.stripe.com/3cI3cwcR6c3910p18peEo09"},
    {"name": "Founding Member $14.99/mo", "url": "https://buy.stripe.com/00w8wQaIYgjp5gF2cteEo0a"},
    {"name": "3-Month $39.99", "url": "https://buy.stripe.com/dRm7sM5oE3wD7oNaIZeEo0j"},
    {"name": "12-Month $99.99", "url": "https://buy.stripe.com/3cI5kEbN22szgZnaIZeEo0c"},
    {"name": "Royalty $2,500", "url": "https://buy.stripe.com/dRmcN604kebheRf2cteEo0d"},
]

# Track consecutive failures to avoid spam
_fail_counts = {}


def _load_payment_links():
    """Load payment links from env (JSON) or fall back to defaults."""
    raw = os.environ.get("PAYMENT_LINKS_JSON", "").strip()
    if not raw:
        return DEFAULT_PAYMENT_LINKS
    try:
        data = json.loads(raw)
        if isinstance(data, list) and all(isinstance(x, dict) and "name" in x and "url" in x for x in data):
            return data
    except Exception:
        log.warning("Invalid PAYMENT_LINKS_JSON; using default payment links")
    return DEFAULT_PAYMENT_LINKS


def check_url(name, url, timeout=15):
    """Check if a URL returns 200. Returns (ok, status_code, response_time_ms)."""
    try:
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        ms = int(resp.elapsed.total_seconds() * 1000)
        ok = resp.status_code < 400
        return ok, resp.status_code, ms
    except requests.Timeout:
        return False, 0, timeout * 1000
    except Exception as e:
        log.error(f"URL check failed {name}: {e}")
        return False, 0, 0


def run_uptime_check():
    """Check all sites and payment links. Returns (all_ok, alerts_list, summary_dict)."""
    alerts = []
    summary = {"sites": {}, "payment_links": {}, "checked_at": datetime.now().isoformat()}
    payment_links = _load_payment_links()

    # Check sites
    for site in SITES:
        ok, status, ms = check_url(site["name"], site["url"])
        summary["sites"][site["name"]] = {"ok": ok, "status": status, "ms": ms}

        key = f"site_{site['name']}"
        if not ok:
            _fail_counts[key] = _fail_counts.get(key, 0) + 1
            # Alert on first failure and every 5th after
            if _fail_counts[key] == 1 or _fail_counts[key] % 5 == 0:
                level = "CRITICAL" if site["critical"] else "WARNING"
                alerts.append(f"{level}: {site['name']} is DOWN (status {status})")
        else:
            if _fail_counts.get(key, 0) > 0:
                alerts.append(f"RECOVERED: {site['name']} is back UP ({ms}ms)")
            _fail_counts[key] = 0

    # Check payment links (less frequently — only if Stripe key expiry is near)
    for link in payment_links:
        ok, status, ms = check_url(link["name"], link["url"])
        summary["payment_links"][link["name"]] = {"ok": ok, "status": status, "ms": ms}

        key = f"link_{link['name']}"
        if not ok:
            _fail_counts[key] = _fail_counts.get(key, 0) + 1
            if _fail_counts[key] == 1 or _fail_counts[key] % 5 == 0:
                alerts.append(f"PAYMENT LINK DOWN: {link['name']} (status {status})")
        else:
            if _fail_counts.get(key, 0) > 0:
                alerts.append(f"RECOVERED: {link['name']} payment link OK")
            _fail_counts[key] = 0

    # Optional Stripe-specific expiry warning
    provider = os.environ.get("PAYMENT_MONITOR_PROVIDER", "generic").strip().lower()
    expiry_raw = os.environ.get("STRIPE_EXPIRY_DATE", "").strip()
    if provider in {"stripe", "multi"} and expiry_raw:
        try:
            stripe_expiry = datetime.fromisoformat(expiry_raw)
            now = datetime.now()
            days_to_expiry = (stripe_expiry - now).days
            if days_to_expiry <= 7:
                alerts.append(f"STRIPE KEY EXPIRES IN {days_to_expiry} DAYS — rotate NOW at dashboard.stripe.com")
                summary["stripe_key_warning"] = f"{days_to_expiry} days until expiry"
        except Exception:
            log.warning("Invalid STRIPE_EXPIRY_DATE format; expected YYYY-MM-DD")

    all_ok = len(alerts) == 0
    return all_ok, alerts, summary


def format_uptime_report(summary):
    """Format uptime summary for Telegram."""
    lines = ["*Uptime Report*"]
    lines.append(f"Checked: {summary['checked_at'][:16]}")
    lines.append("")

    # Sites
    for name, data in summary.get("sites", {}).items():
        icon = "OK" if data["ok"] else "DOWN"
        lines.append(f"  {name}: {icon} ({data['ms']}ms)")

    # Payment links
    all_links_ok = all(d["ok"] for d in summary.get("payment_links", {}).values())
    if all_links_ok:
        lines.append(f"  Payment links: all 5 OK")
    else:
        for name, data in summary.get("payment_links", {}).items():
            if not data["ok"]:
                lines.append(f"  BROKEN: {name}")

    if "stripe_key_warning" in summary:
        lines.append(f"\n*{summary['stripe_key_warning']}*")

    return "\n".join(lines)
