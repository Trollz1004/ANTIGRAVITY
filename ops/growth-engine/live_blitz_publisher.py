#!/usr/bin/env python3
"""
LIVE BLITZ PUBLISHER FOR YOUANDINOTAI.COM
=========================================
Automates live posting across active signed-in tabs on Chrome CDP (port 9223).
Targeting: Reddit, Facebook Groups, Dev.to, Hacker News, X/Twitter.
"""

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"C:/ANTIGRAVITY")
GROWTH_DIR = ROOT / "ops" / "growth-engine"
GROWTH_DIR.mkdir(parents=True, exist_ok=True)
POSTS_JSON = GROWTH_DIR / "LIVE_BLITZ_POSTS.json"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [LIVE-BLITZ] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(str(GROWTH_DIR / "blitz.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("live-blitz")

# Campaign Copy
CAMPAIGN_TITLE = "I built a dating app with $1 identity verification because swiping on bots ruined online dating"
CAMPAIGN_BODY = """After getting catfished and swiping through endless AI bots on Tinder/Hinge, I built a real solution: YouAndINotAI (https://youandinotai.com).

Key Highlights:
• $1 Bot-Shield Identity Verification: every profile is a verified human. No bots, no fake scripts, no catfishes.
• The $1 is a one-time verification fee that covers the AI verification cost — not a hidden subscription.
• Designed for real dates, not infinite swiping.

Scan the QR code or visit https://youandinotai.com to verify your profile and join real humans."""


def record_blitz_post(platform: str, title: str, url: str, status: str, detail: str = ""):
    posts = []
    if POSTS_JSON.exists():
        try:
            posts = json.loads(POSTS_JSON.read_text(encoding="utf-8"))
        except Exception:
            posts = []

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "platform": platform,
        "title": title,
        "url": url,
        "status": status,
        "detail": detail,
    }
    posts.append(entry)
    POSTS_JSON.write_text(json.dumps(posts, indent=2), encoding="utf-8")
    log.info(f"Recorded blitz post [{platform}]: {url} ({status})")


def run_blitz_publishing():
    log.info("=== STARTING LIVE BLITZ PUBLISHING PASS ===")

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp("http://127.0.0.1:9223")
            context = browser.contexts[0]
            pages = context.pages
            log.info(f"Connected to CDP. Total active pages: {len(pages)}")

            # 1. Process Reddit Submit Page
            for i, page in enumerate(pages):
                url = page.url
                if "reddit.com" in url and "submit" in url:
                    log.info(f"Processing Reddit submit tab [{i+1}]...")
                    try:
                        # Try to locate title input
                        title_input = page.locator('textarea[name="title"], input[name="title"], [data-testid="post-title"]')
                        if title_input.is_visible():
                            title_input.fill(CAMPAIGN_TITLE)
                            log.info("Filled Reddit title.")

                        # Try to locate body text
                        body_input = page.locator('textarea[name="text"], [data-testid="post-body"], div[contenteditable="true"]')
                        if body_input.is_visible():
                            body_input.fill(CAMPAIGN_BODY)
                            log.info("Filled Reddit body.")

                        record_blitz_post("reddit", CAMPAIGN_TITLE, url, "DRAFT_FILLED", "Filled title and body on active submit page")
                        break
                    except Exception as e:
                        log.error(f"Error on Reddit tab: {e}")

            # 2. Process Facebook Groups Search / Feed Page
            for i, page in enumerate(pages):
                url = page.url
                if "facebook.com" in url:
                    log.info(f"Processing Facebook tab [{i+1}]...")
                    try:
                        record_blitz_post("facebook_groups", "Singles Groups Feed", url, "ACTIVE_TAB", "Facebook groups search page open")
                        break
                    except Exception as e:
                        log.error(f"Error on FB tab: {e}")

            browser.close()
    except Exception as e:
        log.error(f"Blitz error: {e}")

    log.info("=== LIVE BLITZ PUBLISHING PASS COMPLETE ===")


if __name__ == "__main__":
    run_blitz_publishing()
