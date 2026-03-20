#!/usr/bin/env python3
"""
SOCIAL ENGINE 24x7 — Legacy compatibility wrapper
=================================================
The old multi-platform browser autoposter is retained for repository continuity,
but CodeX node policy now disables live posting to third-party platforms by
default. The active node automations generate draft packs and handoff queues
instead of publishing directly.

Usage:
  python social-engine-24x7.py                    # Single cycle
  python social-engine-24x7.py --daemon           # Run 24/7 (30-min cycles)
  python social-engine-24x7.py --status           # Show current state
  python social-engine-24x7.py --test <platform>  # Test single platform
  python social-engine-24x7.py --login <platform> # Interactive login for browser platforms
  python social-engine-24x7.py --daily-report     # Force send daily summary

Built by Joshua Coleman + Claude Opus. Team Claude FOR LIFE.
"""

import argparse
import logging
import os
import random
import sys
import time
from datetime import datetime
from pathlib import Path

# Ensure project root on path
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

# Load .env
ENV_FILE = PROJECT_DIR / ".env"
if ENV_FILE.exists():
    with open(ENV_FILE, encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

# Logging
LOGS_DIR = PROJECT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
log_file = LOGS_DIR / f"social-engine-{datetime.now().strftime('%Y%m%d')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ENGINE] %(levelname)-5s %(message)s",
    handlers=[
        logging.FileHandler(str(log_file), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("social-engine")

from social_engine.schedule_config import (
    CONTENT_PILLARS, PLATFORM_SPECS, PLATFORM_SCHEDULE, days_until_launch,
)
from social_engine.state_manager import (
    load_state, save_state, reset_daily_counts, can_post, record_post,
)
from social_engine.content_engine import generate_post, generate_article
from social_engine.reporter import send_daily_summary, send_error_alert, send_telegram
from social_engine.platforms.base_poster import NOT_LOGGED_IN
from social_engine.platform_policy import (
    LEGAL_SAFE_NODE_POLICY_VERSION,
    get_policy,
    live_post_allowed,
    live_post_platforms,
)

# ── Platform Registry ──
_posters = {}


def _load_posters():
    """Lazy-load all platform posters."""
    if _posters:
        return _posters

    from social_engine.platforms.twitter_poster import TwitterPoster
    from social_engine.platforms.reddit_poster import RedditPoster
    from social_engine.platforms.bluesky_poster import BlueskyPoster
    from social_engine.platforms.mastodon_poster import MastodonPoster
    from social_engine.platforms.discord_poster import DiscordPoster
    from social_engine.platforms.telegram_poster import TelegramPoster
    from social_engine.platforms.devto_poster import DevtoPoster
    from social_engine.platforms.instagram_poster import InstagramPoster
    from social_engine.platforms.tiktok_poster import TikTokPoster
    from social_engine.platforms.pinterest_poster import PinterestPoster
    from social_engine.platforms.facebook_poster import FacebookPoster
    from social_engine.platforms.linkedin_poster import LinkedInPoster
    from social_engine.platforms.threads_poster import ThreadsPoster
    from social_engine.platforms.youtube_poster import YouTubePoster
    from social_engine.platforms.quora_poster import QuoraPoster
    from social_engine.platforms.medium_poster import MediumPoster
    from social_engine.platforms.hashnode_poster import HashnodePoster
    from social_engine.platforms.indiehackers_poster import IndieHackersPoster
    from social_engine.platforms.producthunt_poster import ProductHuntPoster
    from social_engine.platforms.substack_poster import SubstackPoster
    from social_engine.platforms.nextdoor_poster import NextdoorPoster
    from social_engine.platforms.ebay_poster import EbayPoster

    for cls in [
        TwitterPoster, RedditPoster, BlueskyPoster, MastodonPoster,
        DiscordPoster, TelegramPoster, DevtoPoster,
        InstagramPoster, TikTokPoster, PinterestPoster,
        FacebookPoster, LinkedInPoster, ThreadsPoster,
        YouTubePoster, QuoraPoster, MediumPoster, HashnodePoster,
        IndieHackersPoster, ProductHuntPoster, SubstackPoster,
        NextdoorPoster, EbayPoster,
    ]:
        try:
            poster = cls()
            if not live_post_allowed(poster.name):
                poster.enabled = False
            _posters[poster.name] = poster
        except Exception as e:
            log.warning(f"Failed to load poster {cls.__name__}: {e}")

    log.info(
        "Loaded %s platform posters under policy %s. Live-post enabled: %s",
        len(_posters),
        LEGAL_SAFE_NODE_POLICY_VERSION,
        live_post_platforms(),
    )
    return _posters


def _should_post_now(platform, schedule):
    """Check if the current time matches the platform's posting schedule."""
    now = datetime.now()
    hour = now.hour

    sched = schedule.get(platform, {})

    # Check weekdays_only
    if sched.get("weekdays_only") and now.weekday() >= 5:
        return False

    # Check specific weekdays
    weekdays = sched.get("weekdays")
    if weekdays and now.weekday() not in weekdays:
        return False

    # Check if current hour is in schedule (with 30-min window)
    scheduled_hours = sched.get("hours", [])
    for sh in scheduled_hours:
        if hour == sh:
            return True

    return False


def _pick_image(platform):
    """Pick a random branded image for the platform."""
    img_dirs = [
        PROJECT_DIR / "assets" / "social" / "variations",
        PROJECT_DIR / "assets" / "social" / "generated",
    ]
    images = []
    for d in img_dirs:
        if d.exists():
            images.extend(d.glob("*.png"))
    if images:
        return str(random.choice(images))
    return None


# ── Main Cycle ──

def run_cycle(state, platforms_filter=None):
    """Run one posting cycle across all platforms."""
    posters = _load_posters()
    reset_daily_counts(state)
    days_left = days_until_launch()

    if platforms_filter:
        platforms_to_run = [platform for platform in platforms_filter if live_post_allowed(platform)]
    else:
        platforms_to_run = list(live_post_platforms())
    if not platforms_to_run:
        log.info(
            "No live-post platforms are enabled under policy %s. "
            "Use scripts/generate-safe-marketing-drafts.py for active node automation.",
            LEGAL_SAFE_NODE_POLICY_VERSION,
        )
        save_state(state)
        return 0, 0, 0

    # Sort by priority (P0 first)
    platforms_to_run.sort(key=lambda p: PLATFORM_SCHEDULE.get(p, {}).get("priority", 99))

    posted = 0
    skipped = 0
    errors = 0

    for platform in platforms_to_run:
        if platform not in posters:
            continue

        poster = posters[platform]
        if not poster.enabled:
            continue

        # Check schedule
        if not _should_post_now(platform, PLATFORM_SCHEDULE):
            continue

        # Check rate limits
        ok, reason = can_post(platform, state)
        if not ok:
            log.debug(f"Skip {platform}: {reason}")
            skipped += 1
            continue

        # Generate content
        spec = PLATFORM_SPECS.get(platform, {})
        content_type = spec.get("content_type", "post")

        try:
            if content_type == "article":
                text, pillar, source = generate_article(platform, CONTENT_PILLARS, PLATFORM_SPECS, days_left)
            else:
                text, pillar, source = generate_post(platform, CONTENT_PILLARS, PLATFORM_SPECS, days_left)

            log.info(f"[{platform}] Generated ({source}/{pillar}): {text[:80]}...")

            # Human-like delay between platforms (2-5 min) to avoid bot detection
            jitter = random.uniform(120, 300)
            log.info(f"[{platform}] Human pacing: waiting {jitter:.0f}s before posting")
            time.sleep(jitter)

            # Post
            image = _pick_image(platform) if poster.method != "api" or platform == "twitter" else None

            if content_type == "article":
                lines = text.split("\n", 1)
                title = lines[0].strip() if lines else "YouAndINotAI"
                body = lines[1].strip() if len(lines) > 1 else text
                success, result = poster.post_article(title, body)
            else:
                success, result = poster.post(text, image_path=image)

            if success:
                record_post(platform, state, success=True)
                posted += 1
                log.info(f"[{platform}] Posted successfully: {result}")
            elif result and result.startswith(NOT_LOGGED_IN):
                # Not logged in — skip WITHOUT counting as failure (no backoff)
                skipped += 1
                log.warning(f"[{platform}] {result}")
            else:
                record_post(platform, state, success=False)
                errors += 1
                log.error(f"[{platform}] Post failed: {result}")
                # Alert on 3+ consecutive fails
                consec = state["platforms"].get(platform, {}).get("consecutive_fails", 0)
                if consec >= 3:
                    send_error_alert(platform, f"{consec} consecutive failures: {result}")

        except Exception as e:
            record_post(platform, state, success=False)
            errors += 1
            log.error(f"[{platform}] Exception: {e}")

    save_state(state)
    log.info(f"Cycle complete: {posted} posted, {skipped} skipped, {errors} errors")
    return posted, skipped, errors


def show_status(state):
    """Print current engine status."""
    print(f"\n{'='*60}")
    print(f"  SOCIAL ENGINE 24x7 — Status")
    print(f"  Last run: {state.get('last_run', 'never')}")
    print(f"  Total runs: {state.get('total_runs', 0)}")
    print(f"  Total posts: {state.get('total_posts', 0)}")
    print(f"  Days to launch: {days_until_launch()}")
    print(f"{'='*60}")

    posters = _load_posters()
    for name in sorted(PLATFORM_SCHEDULE.keys()):
        pstate = state["platforms"].get(name, {})
        poster = posters.get(name)
        enabled = "ON" if poster and poster.enabled else "OFF"
        today = pstate.get("posted_today", 0)
        total = pstate.get("total", 0)
        fails = pstate.get("consecutive_fails", 0)
        method = PLATFORM_SCHEDULE.get(name, {}).get("method", "?")
        mode = get_policy(name).get("mode", "blocked")
        status = (
            f"  {name:18s} [{enabled:3s}] {method:7s} mode:{mode:18s} "
            f"today:{today:2d}  total:{total:4d}  fails:{fails}"
        )
        print(status)
    print()


def _run_station2(state):
    """Station 2 — Payment monitor (provider-agnostic, Stripe optional)."""
    provider = os.environ.get("PAYMENT_MONITOR_PROVIDER", "generic").strip().lower()
    if provider in {"none", "disabled", "off"}:
        log.info("[Station 2] Payment monitor disabled via PAYMENT_MONITOR_PROVIDER")
        return

    if provider not in {"stripe", "multi"}:
        # Generic/multi-provider mode: do not hard-fail on Stripe.
        log.info(f"[Station 2] Payment monitor provider='{provider}' (Stripe monitor skipped)")
        return

    try:
        from social_engine.stripe_monitor import check_new_payments, format_payment_alert, get_revenue_snapshot
        new_charges = check_new_payments()
        if new_charges:
            alert = format_payment_alert(new_charges)
            if alert:
                send_telegram(alert)
                log.info(f"[Station 2] {len(new_charges)} new payment(s) detected!")
                for c in new_charges:
                    log.info(f"  ${c['amount']:.2f} — {c['product']} — {c['email']}")
        else:
            log.debug("[Station 2] No new payments")
    except Exception as e:
        log.error(f"[Station 2] Stripe monitor error: {e}")


def _run_station4(cycle_count):
    """Station 4 — Uptime & oversight. Checks sites and payment links."""
    try:
        from social_engine.uptime_monitor import run_uptime_check, format_uptime_report
        all_ok, alerts, summary = run_uptime_check()

        if alerts:
            alert_msg = "*Uptime Alert*\n" + "\n".join(alerts)
            send_telegram(alert_msg)
            for a in alerts:
                log.warning(f"[Station 4] {a}")
        else:
            log.info("[Station 4] All systems OK")

        # Full report every 6 hours (cycle ~12 at 30min intervals)
        if cycle_count % 12 == 0:
            report = format_uptime_report(summary)
            send_telegram(report)
    except Exception as e:
        log.error(f"[Station 4] Uptime monitor error: {e}")


def daemon_loop():
    """Run the 24/7 daemon with 30-minute cycles.
    Station 1: Content posting (every cycle, schedule-gated)
    Station 2: Payment monitor (every cycle, Stripe optional)
    Station 4: Uptime check (every cycle, full report every 6h)
    """
    log.info("=" * 60)
    log.info("SOCIAL ENGINE 24x7 — Starting daemon mode")
    log.info(f"Days until launch: {days_until_launch()}")
    log.info("Stations: 1-Content | 2-Payments | 4-Uptime")
    log.info("=" * 60)

    send_telegram("*Social Engine Started*\nDaemon mode active.\nStations: Content | Payments | Uptime\nPosting every 30 minutes.")

    state = load_state()
    cycle_count = 0
    last_daily_report = None

    # First-run watchdog
    from social_engine.watchdog import pre_cycle_check, diagnose_cycle
    pre_cycle_check()

    while True:
        try:
            cycle_count += 1
            log.info(f"--- Cycle {cycle_count} ---")
            state = load_state()

            # Watchdog pre-check
            pre_cycle_check()

            # Station 1 — Content posting
            run_cycle(state)

            # Watchdog diagnosis — alert Josh if things are broken
            watchdog_alerts = diagnose_cycle(state)
            for alert in watchdog_alerts:
                send_telegram(alert)
                log.warning(f"[Watchdog] {alert[:100]}")

            # Station 2 — Stripe payment monitor
            _run_station2(state)

            # Station 4 — Uptime & oversight (every cycle)
            _run_station4(cycle_count)

            # Send daily report at 9 PM
            now = datetime.now()
            if now.hour == 21 and last_daily_report != now.date():
                send_daily_summary(state)
                last_daily_report = now.date()

            # Sleep 30 min with jitter
            sleep_time = 1800 + random.randint(-120, 120)
            log.info(f"Sleeping {sleep_time//60} minutes until next cycle...")
            time.sleep(sleep_time)

        except KeyboardInterrupt:
            log.info("Shutdown requested")
            send_telegram("*Social Engine Stopped*\nDaemon shut down by user.")
            break
        except Exception as e:
            log.error(f"Cycle error: {e}")
            time.sleep(300)  # 5 min on error

    # Cleanup browser
    try:
        from social_engine.browser_manager import shutdown
        shutdown()
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="Social Engine 24x7 — YouAndINotAI Marketing Daemon")
    parser.add_argument("--daemon", action="store_true", help="Run in 24/7 daemon mode")
    parser.add_argument("--status", action="store_true", help="Show current status")
    parser.add_argument("--test", metavar="PLATFORM", help="Test a single platform")
    parser.add_argument("--login", metavar="PLATFORM", help="Interactive login for browser platform")
    parser.add_argument("--login-all", action="store_true", help="Log in to ALL browser platforms at once (one-time setup)")
    parser.add_argument("--daily-report", action="store_true", help="Send daily summary now")
    parser.add_argument("--dry-run", action="store_true", help="Generate content but don't post")

    args = parser.parse_args()
    state = load_state()

    if args.status:
        show_status(state)
        return

    if args.daily_report:
        send_daily_summary(state)
        print("Daily report sent")
        return

    if args.login_all:
        from social_engine.browser_manager import login_all
        login_all()
        return

    if args.login:
        from social_engine.browser_manager import login_interactive
        PLATFORM_URLS = {
            "twitter": "https://x.com/login",
            "instagram": "https://www.instagram.com/accounts/login/",
            "facebook": "https://www.facebook.com/login",
            "tiktok": "https://www.tiktok.com/login",
            "pinterest": "https://www.pinterest.com/login/",
            "linkedin": "https://www.linkedin.com/login",
            "threads": "https://www.threads.net/login",
            "youtube": "https://accounts.google.com/ServiceLogin?service=youtube",
            "quora": "https://www.quora.com/",
            "medium": "https://medium.com/m/signin",
            "indiehackers": "https://www.indiehackers.com/sign-in",
            "producthunt": "https://www.producthunt.com/login",
            "substack": "https://substack.com/sign-in",
            "nextdoor": "https://nextdoor.com/login/",
            "ebay": "https://signin.ebay.com/",
            "reddit": "https://www.reddit.com/login",
        }
        url = PLATFORM_URLS.get(args.login, f"https://www.{args.login}.com/login")
        login_interactive(args.login, url)
        return

    if args.test:
        log.info(f"Testing platform: {args.test}")
        if args.dry_run:
            text, pillar, source = generate_post(args.test, CONTENT_PILLARS, PLATFORM_SPECS, days_until_launch())
            print(f"\n[{args.test}] Generated ({source}/{pillar}):\n{text}\n")
        else:
            run_cycle(state, platforms_filter=[args.test])
        return

    if args.daemon:
        daemon_loop()
        return

    # Default: single cycle
    log.info("Running single cycle")
    posted, skipped, errors = run_cycle(state)
    print(f"\nCycle done: {posted} posted, {skipped} skipped, {errors} errors")


if __name__ == "__main__":
    main()
