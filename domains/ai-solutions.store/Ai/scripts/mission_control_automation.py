#!/usr/bin/env python3
"""Mission Control automation – production‑grade monitoring script.

Opens the Mission Control dashboard at http://127.0.0.1:3151, verifies the page
loads, captures a screenshot, and reports whether a Tasks table is present.
Designed to run reliably from a Hermes cron job.

Usage:
    mission_control_automation.py        # run immediately
    python mission_control_automation.py --loop   # run continuously every 5m
"""

import os
import sys
import time
import subprocess
from datetime import datetime, timezone

# ── Ensure Playwright is installed ──────────────────────────────────────────
try:
    from playwright.sync_api import sync_playwright  # type: ignore
except ImportError:
    print("Playwright not found, installing…", file=sys.stderr)
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])
    subprocess.check_call([sys.executable, "-m", "playwright", "install"])
    from playwright.sync_api import sync_playwright  # type: ignore


def run_monitor():
    """Take one snapshot of Mission Control and report status."""
    snapshot_dir = os.path.expanduser("~/mission_control_snapshots")
    os.makedirs(snapshot_dir, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    screenshot_path = os.path.join(snapshot_dir, f"mc_snapshot_{timestamp}.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        url = "http://127.0.0.1:3151"
        try:
            page.goto(url, timeout=15000)
        except Exception as e:
            print(f"Failed to load {url}: {e}", file=sys.stderr)
            browser.close()
            return 1

        # Verify main header exists
        try:
            page.wait_for_selector("text=Mission Control", timeout=10000)
        except Exception:
            print("Mission Control header not found", file=sys.stderr)
            browser.close()
            return 1

        # Check for tasks table
        tasks_present = False
        try:
            page.wait_for_selector("#tasks, .tasks, text=Tasks", timeout=5000)
            tasks_present = True
        except Exception:
            pass

        # Screenshot
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Mission Control snapshot saved to {screenshot_path}")
        print(f"Tasks table detected: {tasks_present}")
        browser.close()
        return 0


if __name__ == "__main__":
    if "--loop" in sys.argv:
        while True:
            run_monitor()
            time.sleep(300)  # 5 minutes
    else:
        sys.exit(run_monitor())
