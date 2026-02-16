#!/usr/bin/env python3
"""
Content Pipeline — Bridges Kraken Engine output to posting scripts.
Reads generated .md content from Kraken, validates, and queues for posting.
Part of Protocol Omega autonomous marketing system.

Usage:
  python content_pipeline.py --scan          # Scan Kraken output for new content
  python content_pipeline.py --queue-status  # Show posting queue status
  python content_pipeline.py --post-next     # Post next ready item (via API)
  python content_pipeline.py --post-all      # Post all ready items (rate-limited)
  python content_pipeline.py --export        # Export ready content as JSON for other nodes
"""

import argparse
import json
import os
import sys
import re
import time
import logging
from pathlib import Path
from datetime import datetime

# ── Paths ──
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
KRAKEN_OUTPUT = Path("C:/REVENUE-CORE/Kraken_Assist_Local_Disk_9020/marketing-engine/output")
KRAKEN_DATA = Path("C:/REVENUE-CORE/Kraken_Assist_Local_Disk_9020/marketing-engine/data")
READY_TO_POST = KRAKEN_OUTPUT / "READY-TO-POST"
PIPELINE_QUEUE = PROJECT_DIR / "data" / "pipeline-queue.json"
PIPELINE_LOG = PROJECT_DIR / "data" / "pipeline-log.json"
CAPTION_BANK = PROJECT_DIR / "content" / "caption-bank.json"
ENV_FILE = PROJECT_DIR / "marketing-automation" / ".env"
LOGS_DIR = PROJECT_DIR / "logs"

LOGS_DIR.mkdir(parents=True, exist_ok=True)
(PROJECT_DIR / "data").mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [PIPELINE] %(message)s",
    handlers=[
        logging.FileHandler(str(LOGS_DIR / "pipeline.log")),
        logging.StreamHandler(),
    ]
)
log = logging.getLogger("pipeline")

# ── Load env ──
def load_env():
    if ENV_FILE.exists():
        with open(ENV_FILE, encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env()

# ── Queue Management ──
def load_queue():
    if PIPELINE_QUEUE.exists():
        with open(PIPELINE_QUEUE, encoding="utf-8") as f:
            return json.load(f)
    return []

def save_queue(queue):
    with open(PIPELINE_QUEUE, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2)

def load_log():
    if PIPELINE_LOG.exists():
        with open(PIPELINE_LOG, encoding="utf-8") as f:
            return json.load(f)
    return []

def save_log(entries):
    with open(PIPELINE_LOG, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)

# ── Parse Kraken Output File ──
def parse_kraken_md(filepath):
    """Parse a Kraken-generated .md file with YAML frontmatter"""
    text = filepath.read_text(encoding="utf-8", errors="ignore")

    # Extract frontmatter
    meta = {}
    content = text
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            for line in parts[1].strip().split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta[k.strip()] = v.strip()
            content = parts[2].strip()

    return {
        "file": filepath.name,
        "path": str(filepath),
        "task_id": meta.get("task_id", ""),
        "type": meta.get("type", ""),
        "platform": meta.get("platform", ""),
        "market": meta.get("market", ""),
        "angle": meta.get("angle", ""),
        "validation": meta.get("validation", ""),
        "content": content,
        "content_length": len(content),
        "scanned_at": datetime.now().isoformat(),
    }

# ── Scan Kraken Output ──
def scan_kraken_output():
    """Scan Kraken output directory for new content to queue"""
    queue = load_queue()
    queued_files = {item["file"] for item in queue}
    new_items = 0

    # Scan individual task output files
    if KRAKEN_OUTPUT.exists():
        for md_file in sorted(KRAKEN_OUTPUT.glob("task_*.md")):
            if md_file.name in queued_files:
                continue
            parsed = parse_kraken_md(md_file)
            if parsed["content"]:
                parsed["status"] = "ready"
                parsed["source"] = "kraken"
                queue.append(parsed)
                new_items += 1
                log.info(f"Queued: {md_file.name} ({parsed['platform']} / {parsed['market']})")

    # Also scan caption bank for unqueued captions
    if CAPTION_BANK.exists():
        with open(CAPTION_BANK, encoding="utf-8") as f:
            bank = json.load(f)
        for platform_key, captions in bank.items():
            if not isinstance(captions, list):
                continue
            for cap in captions:
                cap_id = f"caption_{platform_key}_{cap.get('id', '')}"
                if cap_id in queued_files:
                    continue
                text = cap.get("text", cap.get("caption", ""))
                if not text:
                    continue
                queue.append({
                    "file": cap_id,
                    "path": str(CAPTION_BANK),
                    "task_id": cap_id,
                    "type": f"{platform_key}_caption",
                    "platform": platform_key.capitalize(),
                    "market": "",
                    "angle": cap.get("theme", ""),
                    "content": text,
                    "hashtags": cap.get("hashtags", []),
                    "content_length": len(text),
                    "status": "ready",
                    "source": "caption_bank",
                    "scanned_at": datetime.now().isoformat(),
                })
                new_items += 1

    save_queue(queue)
    log.info(f"Scan complete: {new_items} new items queued. Total queue: {len(queue)}")
    return new_items

# ── Post via Twitter API ──
def post_twitter(content, hashtags=None):
    """Post to Twitter via tweepy"""
    try:
        import tweepy
    except ImportError:
        log.error("tweepy not installed: pip install tweepy")
        return False, "tweepy not installed"

    api_key = os.environ.get("TWITTER_API_KEY", "")
    if not api_key:
        return False, "No Twitter API key"

    text = content
    if hashtags:
        tag_str = " ".join(f"#{h}" if not h.startswith("#") else h for h in hashtags[:2])
        text = f"{content}\n\n{tag_str}"

    # Enforce 280 char limit
    if len(text) > 280:
        text = text[:277] + "..."

    try:
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=os.environ.get("TWITTER_API_SECRET", ""),
            access_token=os.environ.get("TWITTER_ACCESS_TOKEN", ""),
            access_token_secret=os.environ.get("TWITTER_ACCESS_SECRET", ""),
        )
        response = client.create_tweet(text=text)
        tweet_id = response.data["id"]
        log.info(f"Tweet posted: {tweet_id}")
        return True, str(tweet_id)
    except Exception as e:
        log.error(f"Tweet failed: {e}")
        return False, str(e)

# ── Post Next Ready Item ──
def post_next(platform_filter=None):
    """Post the next ready item from the queue"""
    queue = load_queue()
    pipeline_log = load_log()

    for item in queue:
        if item["status"] != "ready":
            continue
        if platform_filter and item["platform"].lower() != platform_filter.lower():
            continue

        platform = item["platform"].lower()

        if platform in ("x/twitter", "twitter"):
            success, result = post_twitter(item["content"], item.get("hashtags"))
            item["status"] = "posted" if success else "failed"
            item["posted_at"] = datetime.now().isoformat()
            item["post_result"] = result

            pipeline_log.append({
                "file": item["file"],
                "platform": platform,
                "status": item["status"],
                "result": result,
                "timestamp": datetime.now().isoformat(),
            })

            save_queue(queue)
            save_log(pipeline_log)
            return success, result
        else:
            log.info(f"Platform {platform} not yet supported for auto-posting. Content saved for manual deployment.")
            continue

    return False, "No ready items in queue"

# ── Post All Ready (Rate Limited) ──
def post_all(platform_filter=None, delay_seconds=20):
    """Post all ready items with rate limiting"""
    posted = 0
    failed = 0

    while True:
        success, result = post_next(platform_filter)
        if result == "No ready items in queue":
            break
        if success:
            posted += 1
            log.info(f"Posted {posted}. Waiting {delay_seconds}s...")
            time.sleep(delay_seconds)
        else:
            failed += 1
            if "rate" in result.lower() or "429" in result:
                log.warning("Rate limited. Stopping.")
                break

    log.info(f"Post all complete: {posted} posted, {failed} failed")
    return posted, failed

# ── Queue Status ──
def show_queue_status():
    queue = load_queue()
    by_status = {}
    by_platform = {}
    by_source = {}

    for item in queue:
        s = item.get("status", "unknown")
        p = item.get("platform", "unknown")
        src = item.get("source", "unknown")
        by_status[s] = by_status.get(s, 0) + 1
        by_platform[p] = by_platform.get(p, 0) + 1
        by_source[src] = by_source.get(src, 0) + 1

    print()
    print("=" * 50)
    print("  CONTENT PIPELINE — Queue Status")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)
    print(f"\n  Total items: {len(queue)}")
    print("\n  By Status:")
    for s, c in sorted(by_status.items()):
        print(f"    {s:12s} {c}")
    print("\n  By Platform:")
    for p, c in sorted(by_platform.items()):
        print(f"    {p:12s} {c}")
    print("\n  By Source:")
    for s, c in sorted(by_source.items()):
        print(f"    {s:15s} {c}")
    print()

# ── Export for Other Nodes ──
def export_ready():
    """Export ready items as JSON for Sabretooth/T5500 to pick up"""
    queue = load_queue()
    ready = [item for item in queue if item["status"] == "ready"]

    export_file = PROJECT_DIR / "data" / f"export-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
    with open(export_file, "w", encoding="utf-8") as f:
        json.dump(ready, f, indent=2)

    log.info(f"Exported {len(ready)} ready items to {export_file}")
    print(f"Exported {len(ready)} items to {export_file}")
    return str(export_file)

# ── CLI ──
def main():
    parser = argparse.ArgumentParser(description="Content Pipeline — Kraken to Posting")
    parser.add_argument("--scan", action="store_true", help="Scan Kraken output for new content")
    parser.add_argument("--queue-status", action="store_true", help="Show queue status")
    parser.add_argument("--post-next", action="store_true", help="Post next ready item")
    parser.add_argument("--post-all", action="store_true", help="Post all ready items")
    parser.add_argument("--export", action="store_true", help="Export ready items for other nodes")
    parser.add_argument("--platform", type=str, help="Filter by platform")
    parser.add_argument("--delay", type=int, default=20, help="Delay between posts (seconds)")

    args = parser.parse_args()

    if args.scan:
        scan_kraken_output()
    elif args.queue_status:
        show_queue_status()
    elif args.post_next:
        success, result = post_next(args.platform)
        print(f"{'OK' if success else 'FAIL'}: {result}")
    elif args.post_all:
        posted, failed = post_all(args.platform, args.delay)
        print(f"Done: {posted} posted, {failed} failed")
    elif args.export:
        export_ready()
    else:
        # Default: scan + show status
        scan_kraken_output()
        show_queue_status()

if __name__ == "__main__":
    main()
