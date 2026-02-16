#!/usr/bin/env python3
"""
YouAndINotAI Marketing Automation — Master Orchestrator
========================================================
Runs on SABRETOOTH (E:/DateApp/marketing-automation/)
Orchestrates the entire 5-day Valentine's Day launch campaign.

Usage:
    python main.py              # Start the scheduler daemon
    python main.py --seed       # Seed database with all content
    python main.py --memes      # Generate all meme images
    python main.py --status     # Show campaign status
    python main.py --add-sub EMAIL NAME  # Add a subscriber
    python main.py --send-test EMAIL     # Send a test email
"""
import sys
import time
import logging
import argparse
from datetime import datetime
from pathlib import Path

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).parent))

import config
from modules import database as db
from modules import social_poster
from modules import email_sender
from modules import reddit_monitor
from modules import meme_generator
from modules import analytics

# ── Logging Setup ──
config.LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)-8s] %(levelname)-5s %(message)s",
    handlers=[
        logging.FileHandler(config.LOG_DIR / "automation.log"),
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger("main")


BANNER = """
================================================================
  YouAndINotAI -- Marketing Automation Engine
  Launch: Valentine's Day 2026 (Feb 14)
  No Bots. Real Humans. Real Connections.
================================================================
"""


def cmd_seed():
    """Seed the database with all campaign content."""
    log.info("Seeding database with campaign content...")
    count = social_poster.schedule_all_content()
    log.info(f"Content library: {count} posts loaded")


def cmd_memes():
    """Generate all marketing images."""
    log.info("Generating marketing images...")
    paths = meme_generator.generate_all_memes()
    log.info(f"Generated {len(paths)} images in {config.MEME_OUTPUT}")
    for p in paths:
        print(f"  {p}")


def cmd_status():
    """Show campaign status dashboard."""
    summary = analytics.get_campaign_summary()
    launch = datetime.strptime(config.LAUNCH_DATE, "%Y-%m-%d %H:%M:%S")
    now = datetime.now()
    delta = launch - now

    print(BANNER)
    print(f"  Current Time:    {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Launch Date:     {config.LAUNCH_DATE}")

    if delta.total_seconds() > 0:
        days = delta.days
        hours = delta.seconds // 3600
        print(f"  Time to Launch:  {days}d {hours}h")
    else:
        print(f"  STATUS:          🚀 LAUNCHED!")

    print()
    print(f"  Posts Sent:      {summary['posts_sent']}")
    print(f"  Posts Pending:   {summary['posts_pending']}")
    print(f"  Emails Sent:     {summary['emails_sent']}")
    print(f"  Emails Pending:  {summary['emails_pending']}")
    print(f"  Subscribers:     {summary['subscribers']}")
    print(f"  Reddit Alerts:   {summary['reddit_alerts']}")
    print()

    # Feature flags
    print("  API Status:")
    print(f"    Twitter:    {'[OK] ENABLED' if config.ENABLE_TWITTER else '[--] No API key'}")
    print(f"    Instagram:  {'[OK] ENABLED' if config.ENABLE_META else '[--] No API key'}")
    print(f"    Reddit:     {'[OK] ENABLED' if config.ENABLE_REDDIT else '[--] No API key'}")
    print(f"    Gmail SMTP: {'[OK] ENABLED' if config.ENABLE_EMAIL_GMAIL else '[--] No password'}")
    print(f"    SendGrid:   {'[OK] ENABLED' if config.ENABLE_EMAIL_SENDGRID else '[--] No API key'}")
    print()


def cmd_add_subscriber(email: str, name: str):
    """Add a subscriber and schedule their email sequence."""
    db.add_subscriber(email, name)
    email_sender.schedule_sequence_for_subscriber(email, name)
    log.info(f"Added subscriber: {name} <{email}>")


def cmd_send_test(email: str):
    """Send a test email to verify SMTP is working."""
    success = email_sender.send_email(
        email,
        "YouAndINotAI Test Email",
        f"Hey!\n\nThis is a test email from the YouAndINotAI marketing automation system.\n\nIf you're reading this, email sending is working.\n\nLaunch: Feb 14, 2026\n\n– The Automation Engine"
    )
    if success:
        print(f"Test email sent to {email}")
    else:
        print(f"FAILED to send test email. Check logs.")


def scheduler_loop():
    """Main scheduler loop — runs forever, processing tasks on intervals."""
    import schedule

    log.info("Starting scheduler daemon...")
    cmd_status()

    # Schedule recurring tasks
    schedule.every(config.POST_CHECK_INTERVAL_MIN).minutes.do(
        _safe_run, "process_posts", social_poster.process_pending_posts
    )
    schedule.every(config.EMAIL_CHECK_INTERVAL_MIN).minutes.do(
        _safe_run, "process_emails", email_sender.process_pending_emails
    )
    schedule.every(config.REDDIT_CHECK_INTERVAL_MIN).minutes.do(
        _safe_run, "reddit_scan", reddit_monitor.scan_subreddits
    )
    schedule.every().day.at(config.REPORT_TIME).do(
        _safe_run, "daily_report", analytics.post_daily_report
    )

    # Run once immediately
    _safe_run("process_posts", social_poster.process_pending_posts)
    _safe_run("process_emails", email_sender.process_pending_emails)

    log.info("Scheduler running. Press Ctrl+C to stop.")

    while True:
        try:
            schedule.run_pending()
            time.sleep(30)
        except KeyboardInterrupt:
            log.info("Scheduler stopped by user.")
            break
        except Exception as e:
            log.error(f"Scheduler error: {e}")
            time.sleep(60)


def _safe_run(name: str, func):
    """Run a function with error handling."""
    try:
        func()
    except Exception as e:
        log.error(f"[{name}] Error: {e}")


def main():
    parser = argparse.ArgumentParser(description="YouAndINotAI Marketing Automation")
    parser.add_argument("--seed", action="store_true", help="Seed database with campaign content")
    parser.add_argument("--memes", action="store_true", help="Generate all marketing images")
    parser.add_argument("--status", action="store_true", help="Show campaign status")
    parser.add_argument("--add-sub", nargs=2, metavar=("EMAIL", "NAME"), help="Add subscriber")
    parser.add_argument("--send-test", metavar="EMAIL", help="Send test email")
    parser.add_argument("--report", action="store_true", help="Generate and print daily report")

    args = parser.parse_args()

    print(BANNER)

    # Initialize database
    db.init(config.DB_PATH)

    if args.seed:
        cmd_seed()
    elif args.memes:
        cmd_memes()
    elif args.status:
        cmd_status()
    elif args.add_sub:
        cmd_add_subscriber(args.add_sub[0], args.add_sub[1])
    elif args.send_test:
        cmd_send_test(args.send_test)
    elif args.report:
        print(analytics.generate_daily_report())
    else:
        # Default: seed + start scheduler
        cmd_seed()
        scheduler_loop()


if __name__ == "__main__":
    main()
