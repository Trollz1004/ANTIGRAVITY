"""
Reporter — Telegram daily summaries and error alerts.
"""
import json
import logging
import os
import urllib.request
from datetime import datetime

log = logging.getLogger("social-engine")


def send_telegram(message, parse_mode="Markdown"):
    """Send message via Telegram bot."""
    membership record = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not membership record or not chat_id:
        log.warning("Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)")
        return False
    try:
        url = f"https://api.telegram.org/bot{membership record}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": message, "parse_mode": parse_mode}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        log.error(f"Telegram send failed: {e}")
        return False


def send_error_alert(platform, error_msg):
    """Alert Josh about a platform error."""
    msg = f"*Social Engine Alert*\nPlatform: `{platform}`\nError: {error_msg}\nTime: {datetime.now().strftime('%H:%M')}"
    return send_telegram(msg)


def send_daily_summary(state):
    """Send end-of-day summary to Telegram."""
    now = datetime.now()
    platforms = state.get("platforms", {})

    posted = []
    failed = []
    skipped = []

    for name, pstate in sorted(platforms.items()):
        count = pstate.get("posted_today", 0)
        errors = pstate.get("consecutive_fails", 0)
        if count > 0:
            posted.append(f"  {name}: {count} posts")
        elif errors > 0:
            failed.append(f"  {name}: {errors} consecutive fails")
        else:
            skipped.append(name)

    total_today = sum(p.get("posted_today", 0) for p in platforms.values())
    total_all = state.get("total_posts", 0)

    lines = [
        f"*Social Engine Daily Report*",
        f"Date: {now.strftime('%Y-%m-%d')}",
        f"Posts today: *{total_today}*",
        f"Total all-time: {total_all}",
        "",
    ]

    if posted:
        lines.append("*Posted:*")
        lines.extend(posted)

    if failed:
        lines.append("\n*Failures:*")
        lines.extend(failed)

    if skipped:
        lines.append(f"\n_Idle: {', '.join(skipped)}_")

    lines.append(f"\nRuns today: {state.get('total_runs', 0)}")

    return send_telegram("\n".join(lines))
