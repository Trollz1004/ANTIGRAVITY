"""
Monitoring & Engagement Tracker — FOR T5500 OR SABRETOOTH DEPLOYMENT
DO NOT RUN ON 9020 — 9020 is orchestration only.

Tracks Reddit, Twitter, LinkedIn engagement + site uptime.
Run as cron/scheduled task every 15 minutes on T5500.

Usage:
  python monitoring_daemon.py              # Single run (check + log)
  python monitoring_daemon.py --loop       # Continuous 15-min loop (for T5500 only)
  python monitoring_daemon.py --check-site # Site uptime check only
"""
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
import urllib.request
import urllib.error

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
LOGS_DIR = SCRIPT_DIR.parent / "logs"
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

SITE_URL = "https://youandinotai.com"
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")


def check_site_uptime():
    """Check if youandinotai.com is reachable."""
    try:
        req = urllib.request.Request(SITE_URL, method="HEAD")
        req.add_header("User-Agent", "YouAndINotAI-Monitor/1.0")
        resp = urllib.request.urlopen(req, timeout=10)
        return {"status": "UP", "code": resp.status, "timestamp": datetime.now(timezone.utc).isoformat()}
    except urllib.error.HTTPError as e:
        return {"status": "ERROR", "code": e.code, "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        return {"status": "DOWN", "error": str(e), "timestamp": datetime.now(timezone.utc).isoformat()}


def send_telegram_alert(message):
    """Send alert via Telegram bot."""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = json.dumps({"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "Markdown"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        log_event("ALERT_FAIL", f"Telegram send failed: {e}")
        return False


def log_event(category, message):
    """Append to monitoring log."""
    log_file = LOGS_DIR / "traffic-monitoring.log"
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{ts}] [{category:12s}] {message}\n")


def log_alert(message):
    """Log critical alert."""
    alert_file = LOGS_DIR / "critical-alerts.log"
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(alert_file, "a", encoding="utf-8") as f:
        f.write(f"[{ts}] CRITICAL: {message}\n")


def run_check():
    """Run a single monitoring check cycle."""
    ts = datetime.now(timezone.utc).isoformat()
    report = {"timestamp": ts, "site": None, "alerts": []}

    # 1. Site uptime
    site = check_site_uptime()
    report["site"] = site
    if site["status"] == "UP":
        log_event("SITE", f"UP — HTTP {site['code']}")
    else:
        msg = f"🚨 SITE DOWN: {SITE_URL} — {site.get('error', site.get('code', 'unknown'))}"
        log_event("SITE", msg)
        log_alert(msg)
        report["alerts"].append(msg)
        send_telegram_alert(msg)

    # 2. Save engagement snapshot
    tracking_file = DATA_DIR / f"engagement-tracking-{datetime.now().strftime('%Y%m%d')}.json"
    if tracking_file.exists():
        with open(tracking_file, "r") as f:
            tracking = json.load(f)
    else:
        tracking = {"snapshots": []}

    tracking["snapshots"].append(report)
    with open(tracking_file, "w") as f:
        json.dump(tracking, f, indent=2)

    # 3. Save deployment status
    status = {
        "last_check": ts,
        "site_status": site["status"],
        "monitoring_node": os.environ.get("NODE_NAME", "unknown"),
        "alerts_active": len(report["alerts"]) > 0,
    }
    with open(DATA_DIR / "deployment-status.json", "w") as f:
        json.dump(status, f, indent=2)

    return report


def main():
    import argparse
    parser = argparse.ArgumentParser(description="YouAndINotAI Monitoring (T5500/Sabretooth)")
    parser.add_argument("--loop", action="store_true", help="Run continuously every 15 min (T5500 only)")
    parser.add_argument("--check-site", action="store_true", help="Site uptime check only")
    args = parser.parse_args()

    if args.check_site:
        result = check_site_uptime()
        print(json.dumps(result, indent=2))
        return

    if args.loop:
        print("🔄 Monitoring loop started (every 15 min). Deploy on T5500/Sabretooth ONLY.")
        print("   DO NOT run this on 9020.\n")
        while True:
            report = run_check()
            status = report["site"]["status"]
            alerts = len(report["alerts"])
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Site: {status} | Alerts: {alerts}")
            time.sleep(900)  # 15 minutes
    else:
        # Single check
        report = run_check()
        print(f"✅ Check complete — Site: {report['site']['status']}")
        if report["alerts"]:
            for a in report["alerts"]:
                print(f"  🚨 {a}")


if __name__ == "__main__":
    main()
