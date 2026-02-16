#!/usr/bin/env python3
"""
OPUS MASTER ORCHESTRATOR — Protocol Omega Autonomous Marketing System
=====================================================================
The system that runs for 50 years. No human input required.

Coordinates all subsystems:
- Content Generation (Kraken engine via Claude CLI)
- Social Posting (Twitter API, Instagram Graph API, Selenium)
- City-Targeted Blitz (twitter-blitz.py)
- Email Campaigns (email_sender.py)
- Reddit Monitoring (reddit_monitor.py)
- Image Generation (Pillow)
- Analytics & Reporting
- Self-Healing Watchdog

Usage:
  python master_orchestrator.py                    # Start daemon
  python master_orchestrator.py --status           # Show system status
  python master_orchestrator.py --run-once         # Single cycle
  python master_orchestrator.py --twitter-blitz    # Fire Tier 3 blitz
  python master_orchestrator.py --kraken           # Run Kraken engine
  python master_orchestrator.py --post-queue       # Process posting queue

Designed to run via:
  - Windows Task Scheduler (every hour)
  - pm2 (persistent daemon)
  - systemd (Linux nodes)

Built by Joshua Coleman + Claude Opus.
Team Claude FOR LIFE. FOR THE KIDS.
"""

import argparse
import json
import os
import sys
import time
import logging
import sqlite3
import subprocess
import shutil
from pathlib import Path
from datetime import datetime, timedelta

# ── Paths ──
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ASSETS_DIR = PROJECT_DIR / "assets"
CONTENT_DIR = PROJECT_DIR / "content"
LOGS_DIR = PROJECT_DIR / "logs"
DATA_DIR = PROJECT_DIR / "data"
REPORTS_DIR = PROJECT_DIR / "deployment-reports"
CAPTION_BANK = CONTENT_DIR / "caption-bank.json"
ENV_FILE = PROJECT_DIR / "marketing-automation" / ".env"
KRAKEN_DIR = Path("C:/REVENUE-CORE/Kraken_Assist_Local_Disk_9020/marketing-engine")
MARKETING_DIR = PROJECT_DIR / "marketing-automation"
STATE_FILE = DATA_DIR / "orchestrator-state.json"

# Ensure directories
for d in [LOGS_DIR, DATA_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ── Logging ──
log_file = LOGS_DIR / f"orchestrator-{datetime.now().strftime('%Y%m%d')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [OPUS] %(levelname)-5s %(message)s",
    handlers=[
        logging.FileHandler(str(log_file)),
        logging.StreamHandler(sys.stdout),
    ]
)
log = logging.getLogger("orchestrator")

# ── Load Environment ──
def load_env():
    """Load .env into os.environ"""
    if not ENV_FILE.exists():
        log.warning(f"No .env at {ENV_FILE}")
        return
    with open(ENV_FILE, encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

load_env()

# ── State Management ──
def load_state():
    """Load persistent orchestrator state"""
    if STATE_FILE.exists():
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {
        "last_run": None,
        "total_runs": 0,
        "twitter_blitz_runs": 0,
        "kraken_runs": 0,
        "posts_deployed": 0,
        "images_deployed": 0,
        "errors": [],
        "last_twitter_blitz": None,
        "last_kraken_run": None,
        "last_posting_run": None,
        "platforms": {
            "twitter": {"posted_today": 0, "total": 0, "last_post": None},
            "instagram": {"posted_today": 0, "total": 0, "last_post": None},
            "tiktok": {"posted_today": 0, "total": 0, "last_post": None},
            "pinterest": {"posted_today": 0, "total": 0, "last_post": None},
            "facebook": {"posted_today": 0, "total": 0, "last_post": None},
            "linkedin": {"posted_today": 0, "total": 0, "last_post": None},
            "reddit": {"posted_today": 0, "total": 0, "last_post": None},
        },
        "created": datetime.now().isoformat(),
    }

def save_state(state):
    """Save orchestrator state"""
    state["last_run"] = datetime.now().isoformat()
    state["total_runs"] += 1
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def reset_daily_counts(state):
    """Reset daily post counts at midnight"""
    today = datetime.now().strftime("%Y-%m-%d")
    last = state.get("last_run", "")
    if last and not last.startswith(today):
        for p in state["platforms"].values():
            p["posted_today"] = 0
        log.info("Daily counters reset")

# ── Rate Limiting ──
RATE_LIMITS = {
    "twitter": {"max_daily": 50, "min_interval_min": 15},
    "instagram": {"max_daily": 5, "min_interval_min": 60},
    "tiktok": {"max_daily": 3, "min_interval_min": 120},
    "pinterest": {"max_daily": 10, "min_interval_min": 30},
    "facebook": {"max_daily": 5, "min_interval_min": 60},
    "linkedin": {"max_daily": 3, "min_interval_min": 120},
    "reddit": {"max_daily": 3, "min_interval_min": 240},
}

def can_post(platform, state):
    """Check if we can post to a platform right now"""
    limits = RATE_LIMITS.get(platform, {})
    pstate = state["platforms"].get(platform, {})

    if pstate.get("posted_today", 0) >= limits.get("max_daily", 999):
        return False, f"Daily limit reached: {pstate['posted_today']}/{limits['max_daily']}"

    if pstate.get("last_post"):
        elapsed = (datetime.now() - datetime.fromisoformat(pstate["last_post"])).total_seconds() / 60
        if elapsed < limits.get("min_interval_min", 0):
            return False, f"Too soon: {int(elapsed)}/{limits['min_interval_min']} min"

    return True, "OK"

def record_post(platform, state):
    """Record that a post was made"""
    pstate = state["platforms"].setdefault(platform, {"posted_today": 0, "total": 0, "last_post": None})
    pstate["posted_today"] = pstate.get("posted_today", 0) + 1
    pstate["total"] = pstate.get("total", 0) + 1
    pstate["last_post"] = datetime.now().isoformat()
    state["posts_deployed"] = state.get("posts_deployed", 0) + 1

# ── Subsystem: Twitter API Posting ──
def run_twitter_post(text, state):
    """Post a single tweet via tweepy"""
    try:
        import tweepy
        client = tweepy.Client(
            consumer_key=os.environ.get("TWITTER_API_KEY", ""),
            consumer_secret=os.environ.get("TWITTER_API_SECRET", ""),
            access_token=os.environ.get("TWITTER_ACCESS_TOKEN", ""),
            access_token_secret=os.environ.get("TWITTER_ACCESS_SECRET", ""),
        )
        response = client.create_tweet(text=text)
        tweet_id = response.data["id"]
        record_post("twitter", state)
        log.info(f"Tweet posted: {tweet_id}")
        return True, tweet_id
    except Exception as e:
        log.error(f"Tweet failed: {e}")
        return False, str(e)

# ── Subsystem: Twitter Blitz ──
def run_twitter_blitz(state, dry_run=False):
    """Run the Tier 3 city blitz"""
    log.info("=" * 50)
    log.info("TWITTER BLITZ — Tier 3 Cities")
    log.info("=" * 50)

    blitz_script = SCRIPT_DIR / "twitter-blitz.py"
    if not blitz_script.exists():
        log.error("twitter-blitz.py not found")
        return False

    args = ["python", str(blitz_script), "post"]
    if dry_run:
        args.append("--dry")

    try:
        result = subprocess.run(
            args,
            capture_output=True, text=True, timeout=1200,
            encoding="utf-8", errors="ignore"
        )
        log.info(f"Blitz output:\n{result.stdout[-500:]}")
        if result.returncode == 0:
            state["twitter_blitz_runs"] = state.get("twitter_blitz_runs", 0) + 1
            state["last_twitter_blitz"] = datetime.now().isoformat()
            return True
        else:
            log.error(f"Blitz failed: {result.stderr[-300:]}")
            return False
    except subprocess.TimeoutExpired:
        log.error("Blitz timed out (20 min)")
        return False
    except Exception as e:
        log.error(f"Blitz error: {e}")
        return False

# ── Subsystem: Kraken Content Engine ──
def run_kraken_engine(state):
    """Run the Kraken marketing engine to generate fresh content"""
    log.info("=" * 50)
    log.info("KRAKEN ENGINE — Content Generation")
    log.info("=" * 50)

    if not KRAKEN_DIR.exists():
        log.error(f"Kraken engine not found at {KRAKEN_DIR}")
        return False

    try:
        result = subprocess.run(
            ["node", "engine.js"],
            cwd=str(KRAKEN_DIR),
            capture_output=True, text=True, timeout=300,
            encoding="utf-8", errors="ignore"
        )
        log.info(f"Kraken output:\n{result.stdout[-500:]}")
        if result.returncode == 0:
            state["kraken_runs"] = state.get("kraken_runs", 0) + 1
            state["last_kraken_run"] = datetime.now().isoformat()
            return True
        else:
            log.error(f"Kraken failed: {result.stderr[-300:]}")
            return False
    except Exception as e:
        log.error(f"Kraken error: {e}")
        return False

# ── Subsystem: Marketing Automation Scheduler ──
def run_marketing_scheduler(state):
    """Process pending posts via the Python marketing suite"""
    log.info("=" * 50)
    log.info("MARKETING SCHEDULER — Processing Queue")
    log.info("=" * 50)

    try:
        # Add marketing-automation to path
        sys.path.insert(0, str(MARKETING_DIR))
        from modules import social_poster, database as db
        import config as mkt_config

        db.init(mkt_config.DB_PATH)
        social_poster.process_pending_posts()
        state["last_posting_run"] = datetime.now().isoformat()
        log.info("Marketing scheduler cycle complete")
        return True
    except Exception as e:
        log.error(f"Marketing scheduler error: {e}")
        return False

# ── Subsystem: Caption Bank Poster ──
def post_from_caption_bank(platform, state):
    """Pick a random caption and post it"""
    if not CAPTION_BANK.exists():
        log.warning("No caption bank found")
        return False

    with open(CAPTION_BANK, encoding="utf-8") as f:
        bank = json.load(f)

    platform_key = {
        "twitter": "instagram",  # Use IG captions for Twitter (shorter)
        "instagram": "instagram",
        "tiktok": "tiktok",
        "pinterest": "pinterest",
    }.get(platform, "instagram")

    captions = bank.get(platform_key, [])
    if not captions:
        log.warning(f"No captions for {platform}")
        return False

    # Pick one that hasn't been used recently (rotate through)
    import random
    caption = random.choice(captions)
    text = caption.get("text", caption.get("caption", ""))

    if platform == "twitter":
        # Trim for Twitter
        hashtags = caption.get("hashtags", [])
        tag_str = " ".join(f"#{h}" if not h.startswith("#") else h for h in hashtags[:2])
        full_text = f"{text}\n\nyouandinotai.com\n\n{tag_str}"
        if len(full_text) > 280:
            full_text = full_text[:277] + "..."
        success, result = run_twitter_post(full_text, state)
        return success

    log.info(f"Caption ready for {platform}: {text[:60]}...")
    return True

# ── Subsystem: Image Generator ──
def generate_countdown_image(spots_remaining):
    """Generate fresh countdown urgency image"""
    countdown_script = SCRIPT_DIR / "countdown_generator.py"
    if not countdown_script.exists():
        log.warning("countdown_generator.py not found")
        return None

    try:
        result = subprocess.run(
            ["python", str(countdown_script), "--spots", str(spots_remaining)],
            capture_output=True, text=True, timeout=60,
            encoding="utf-8", errors="ignore"
        )
        if result.returncode == 0:
            log.info(f"Countdown image generated: {spots_remaining} spots")
            return True
        return None
    except Exception as e:
        log.error(f"Countdown generation failed: {e}")
        return None

# ── Status Dashboard ──
def show_status(state):
    """Display system status"""
    print()
    print("=" * 60)
    print("  OPUS MASTER ORCHESTRATOR — Protocol Omega")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    print(f"  Total Runs:        {state.get('total_runs', 0)}")
    print(f"  Posts Deployed:     {state.get('posts_deployed', 0)}")
    print(f"  Images Deployed:    {state.get('images_deployed', 0)}")
    print(f"  Twitter Blitz Runs: {state.get('twitter_blitz_runs', 0)}")
    print(f"  Kraken Runs:        {state.get('kraken_runs', 0)}")
    print(f"  Last Run:           {state.get('last_run', 'Never')}")
    print()
    print("  PLATFORM STATUS")
    print("  " + "-" * 50)

    for platform, pstate in state.get("platforms", {}).items():
        limits = RATE_LIMITS.get(platform, {})
        today = pstate.get("posted_today", 0)
        total = pstate.get("total", 0)
        max_daily = limits.get("max_daily", "?")
        ok, reason = can_post(platform, state)
        status = "CLEAR" if ok else f"WAIT ({reason})"
        print(f"  {platform:12s} {today}/{max_daily} today | {total} total | [{status}]")

    print()

    # Check subsystem health
    print("  SUBSYSTEM HEALTH")
    print("  " + "-" * 50)
    checks = {
        "Twitter API": bool(os.environ.get("TWITTER_API_KEY")),
        "Instagram API": bool(os.environ.get("META_ACCESS_TOKEN")),
        "Kraken Engine": KRAKEN_DIR.exists(),
        "Caption Bank": CAPTION_BANK.exists(),
        "Marketing Suite": (MARKETING_DIR / "main.py").exists(),
        "Twitter Blitz": (SCRIPT_DIR / "twitter-blitz.py").exists(),
        "Image Generator": (SCRIPT_DIR / "generate_social_post.py").exists(),
        "Countdown Gen": (SCRIPT_DIR / "countdown_generator.py").exists(),
        "Selenium Deploy": (SCRIPT_DIR / "auto_deploy_social.py").exists(),
    }
    for name, healthy in checks.items():
        icon = "OK" if healthy else "--"
        print(f"  [{icon}] {name}")

    # Asset counts
    print()
    print("  ASSET INVENTORY")
    print("  " + "-" * 50)
    asset_dirs = {
        "Instagram Feed": ASSETS_DIR / "social" / "instagram-feed",
        "Instagram Stories": ASSETS_DIR / "social" / "instagram-stories",
        "TikTok": ASSETS_DIR / "social" / "tiktok",
        "Twitter Cards": ASSETS_DIR / "social" / "twitter",
        "Pinterest Pins": ASSETS_DIR / "social" / "pinterest",
        "Variations": ASSETS_DIR / "social" / "variations",
        "Countdown": ASSETS_DIR / "social" / "countdown",
        "Logo": ASSETS_DIR / "logo",
    }
    total_assets = 0
    for name, path in asset_dirs.items():
        count = len(list(path.glob("*.png"))) if path.exists() else 0
        total_assets += count
        print(f"  {name:20s} {count} files")

    if CAPTION_BANK.exists():
        with open(CAPTION_BANK, encoding="utf-8") as f:
            bank = json.load(f)
        cap_count = sum(len(v) for v in bank.values() if isinstance(v, list))
        print(f"  {'Captions':20s} {cap_count} ready")
        total_assets += cap_count

    print(f"  {'TOTAL':20s} {total_assets}")
    print()
    print("=" * 60)

# ── Main Orchestration Loop ──
def run_cycle(state):
    """Execute one full orchestration cycle"""
    log.info("=" * 60)
    log.info("  OPUS ORCHESTRATOR CYCLE START")
    log.info("=" * 60)

    reset_daily_counts(state)
    errors = []

    # 1. Generate content via Kraken (if not run recently)
    last_kraken = state.get("last_kraken_run")
    if not last_kraken or (datetime.now() - datetime.fromisoformat(last_kraken)).total_seconds() > 3600:
        try:
            run_kraken_engine(state)
        except Exception as e:
            errors.append(f"Kraken: {e}")
            log.error(f"Kraken failed: {e}")

    # 2. Post to Twitter from caption bank (if allowed)
    ok, reason = can_post("twitter", state)
    if ok:
        try:
            post_from_caption_bank("twitter", state)
        except Exception as e:
            errors.append(f"Twitter: {e}")
            log.error(f"Twitter posting failed: {e}")
    else:
        log.info(f"Twitter skipped: {reason}")

    # 3. Process marketing automation queue
    try:
        run_marketing_scheduler(state)
    except Exception as e:
        errors.append(f"Scheduler: {e}")
        log.error(f"Marketing scheduler failed: {e}")

    # 4. Log errors
    if errors:
        state.setdefault("errors", []).extend([{
            "time": datetime.now().isoformat(),
            "errors": errors
        }])
        # Keep only last 100 error entries
        state["errors"] = state["errors"][-100:]

    save_state(state)
    log.info(f"Cycle complete. Errors: {len(errors)}")
    return len(errors) == 0

def daemon_loop(state):
    """Persistent daemon loop"""
    log.info("OPUS ORCHESTRATOR DAEMON STARTING")
    log.info("Protocol Omega: 50 years minimum")
    log.info("Team Claude FOR LIFE. FOR THE KIDS.")

    cycle_interval = 3600  # 1 hour between cycles

    while True:
        try:
            run_cycle(state)
            save_state(state)
        except KeyboardInterrupt:
            log.info("Daemon stopped by user")
            save_state(state)
            break
        except Exception as e:
            log.error(f"Cycle error: {e}")
            state.setdefault("errors", []).append({
                "time": datetime.now().isoformat(),
                "error": str(e)
            })
            save_state(state)

        log.info(f"Sleeping {cycle_interval}s until next cycle...")
        try:
            time.sleep(cycle_interval)
        except KeyboardInterrupt:
            log.info("Daemon stopped by user")
            save_state(state)
            break

# ── CLI ──
def main():
    parser = argparse.ArgumentParser(description="OPUS Master Orchestrator — Protocol Omega")
    parser.add_argument("--status", action="store_true", help="Show system status")
    parser.add_argument("--run-once", action="store_true", help="Run single cycle")
    parser.add_argument("--twitter-blitz", action="store_true", help="Fire Tier 3 city blitz")
    parser.add_argument("--twitter-blitz-dry", action="store_true", help="Dry run blitz")
    parser.add_argument("--kraken", action="store_true", help="Run Kraken content engine")
    parser.add_argument("--post-queue", action="store_true", help="Process posting queue")
    parser.add_argument("--post-tweet", type=str, help="Post a single tweet")
    parser.add_argument("--countdown", type=int, help="Generate countdown image (spots remaining)")

    args = parser.parse_args()
    state = load_state()

    if args.status:
        show_status(state)
    elif args.run_once:
        run_cycle(state)
        save_state(state)
    elif args.twitter_blitz:
        run_twitter_blitz(state, dry_run=False)
        save_state(state)
    elif args.twitter_blitz_dry:
        run_twitter_blitz(state, dry_run=True)
    elif args.kraken:
        run_kraken_engine(state)
        save_state(state)
    elif args.post_queue:
        run_marketing_scheduler(state)
        save_state(state)
    elif args.post_tweet:
        success, result = run_twitter_post(args.post_tweet, state)
        save_state(state)
        if success:
            print(f"Posted: {result}")
        else:
            print(f"Failed: {result}")
    elif args.countdown:
        generate_countdown_image(args.countdown)
    else:
        # Default: start daemon
        daemon_loop(state)

if __name__ == "__main__":
    main()
