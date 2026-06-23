"""
apify_content_scout.py — Trend-aware content generator for YouAndINotAI.

Architecture:
  Apify Actors (free tier, cloud scraping) → trend data
  Ollama qwen2.5:7b (local, free) → content generation
  data/post-queue.json → Social Engine → 24 platforms

Cost: ~$0/month (Apify free tier + local Ollama)
Replaces: Grok API calls for content research (which accumulated costs quickly)

Usage:
  python scripts/apify_content_scout.py              # full run
  python scripts/apify_content_scout.py --dry-run    # scrape only, no generation
  python scripts/apify_content_scout.py --platform twitter  # single platform

Requires in .env:
  APIFY_TOKEN=your_apify_api_token_here
  OLLAMA_BASE_URL=http://192.168.0.8:11434  (or http://localhost:11434)
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_DIR = Path(__file__).parent.parent
POST_QUEUE = PROJECT_DIR / "data" / "post-queue.json"
DATA_DIR = PROJECT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Load env: prefer vault path from env var, then relative to PROJECT_DIR, then cwd
_vault_env = os.getenv("ANTIGRAVITY_VAULT_PATH", "")
_vault_candidates = [
    Path(_vault_env) if _vault_env else None,
    PROJECT_DIR / "briefings" / "MASTER-UNIVERSAL-ENV-TROLLZ1004.env",
    Path("C:/ANTIGRAVITY/briefings/MASTER-UNIVERSAL-ENV-TROLLZ1004.env"),
]
for _vp in _vault_candidates:
    if _vp and _vp.exists():
        load_dotenv(str(_vp))
        break
else:
    load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_CONTENT_MODEL", "qwen2.5:7b")

APIFY_API_BASE = "https://api.apify.com/v2"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("apify-scout")

# ---------------------------------------------------------------------------
# Apify actor IDs and search queries
# ---------------------------------------------------------------------------
ACTORS = {
    "twitter_trends": {
        "id": "eunit/x-twitter-trends-scraper",
        "input": {"country": "US", "includeCount": True},
        "description": "Real-time X/Twitter trending topics (US)",
    },
    "twitter_dating": {
        "id": "xtdata/twitter-x-scraper",
        "input": {
            "searchTerms": [
                "dating app NOT AI -bot",
                "#YouAndINotAI",
                "real human connection dating",
                "dating app bots fake",
            ],
            "maxItems": 50,
            "lang": "en",
        },
        "description": "X/Twitter posts about human-first dating",
    },
    "reddit_dating": {
        "id": "trudax/reddit-scraper",
        "input": {
            "startUrls": [
                {"url": "https://www.reddit.com/r/OnlineDating/hot/"},
                {"url": "https://www.reddit.com/r/dating/hot/"},
                {"url": "https://www.reddit.com/r/dating_advice/hot/"},
            ],
            "maxItems": 30,
        },
        "description": "Reddit hot posts from dating subreddits",
    },
}

# Brand voice system prompt for Ollama
SYSTEM_PROMPT = """You are Enigma, the marketing voice for YouAndINotAI.
YouAndINotAI is a social platform for real human connection — dating, meetups, volunteering.
Every profile is V8 Cloud Verified (real humans only, no bots).
Launch: April 4, 2026 at youandinotai.com.

Tone: confident, witty, human, slightly rebellious against AI dating hype.
Never use: "support", "support", "commercial misuse" in marketing copy.
# NOTE: doctrine terminated 2026-04-17 — §496.405 scan now flags legacy language as stale, not compliant.
# The word ban above remains correct (we still don't want these terms in output) but the legal rationale is retired.
Do not lead with finance, public-benefit, blockchain, or infrastructure claims.
Lead with real-human verification, cleaner community behavior, and trust.
Keep posts under 280 characters for Twitter/X. Under 2200 for Instagram.
No hashtag spam — max 3 relevant hashtags."""


# ---------------------------------------------------------------------------
# Apify helpers
# ---------------------------------------------------------------------------
def _run_actor(actor_id: str, actor_input: dict, timeout_secs: int = 120) -> list:
    """Run an Apify actor synchronously and return dataset items."""
    if not APIFY_TOKEN:
        log.error("APIFY_TOKEN not set — cannot run actors. Add to .env vault.")
        return []

    url = f"{APIFY_API_BASE}/acts/{actor_id}/run-sync-get-dataset-items"
    params = {"membership record": APIFY_TOKEN, "timeout": timeout_secs, "format": "json"}

    log.info(f"Running Apify actor: {actor_id}")
    try:
        resp = requests.post(url, params=params, json=actor_input, timeout=timeout_secs + 10)
        if resp.status_code == 200:
            items = resp.json()
            log.info(f"  → {len(items)} items returned")
            return items
        else:
            log.warning(f"  → Actor failed: HTTP {resp.status_code} — {resp.text[:200]}")
            return []
    except requests.RequestException as exc:
        log.warning(f"  → Network error: {exc}")
        return []


def gather_trends() -> dict:
    """Run all configured Apify actors and collect raw trend data."""
    results = {}
    for key, cfg in ACTORS.items():
        log.info(f"Scraping: {cfg['description']}")
        items = _run_actor(cfg["id"], cfg["input"])
        results[key] = items
        time.sleep(2)  # be polite
    return results


# ---------------------------------------------------------------------------
# Ollama helpers
# ---------------------------------------------------------------------------
def _ollama_generate(prompt: str, max_tokens: int = 300) -> str:
    """Call local Ollama to generate content. Returns empty string on failure."""
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "options": {"num_predict": max_tokens, "temperature": 0.8},
    }
    try:
        resp = requests.post(url, json=payload, timeout=60)
        if resp.status_code == 200:
            return resp.json().get("response", "").strip()
        log.warning(f"Ollama error: HTTP {resp.status_code}")
        return ""
    except requests.RequestException as exc:
        log.warning(f"Ollama unreachable: {exc}")
        return ""


# ---------------------------------------------------------------------------
# Content generation
# ---------------------------------------------------------------------------
def _summarize_trends(raw: dict) -> str:
    """Flatten raw Apify results into a short trend summary for the prompt."""
    lines = []

    trends = raw.get("twitter_trends", [])
    if trends:
        top = [t.get("name", "") or t.get("trend", "") for t in trends[:10] if t]
        lines.append("Trending on X right now: " + ", ".join(filter(None, top)))

    twitter_posts = raw.get("twitter_dating", [])
    if twitter_posts:
        excerpts = []
        for p in twitter_posts[:5]:
            text = p.get("text", "") or p.get("full_text", "")
            if text and len(text) > 20:
                excerpts.append(text[:120].replace("\n", " "))
        if excerpts:
            lines.append("Recent X posts about dating: " + " | ".join(excerpts))

    reddit_posts = raw.get("reddit_dating", [])
    if reddit_posts:
        titles = [p.get("title", "") for p in reddit_posts[:5] if p.get("title")]
        if titles:
            lines.append("Hot Reddit topics: " + " | ".join(titles))

    return "\n".join(lines) if lines else "No fresh trend data available today."


def generate_posts(trend_summary: str, count_per_platform: int = 5) -> dict:
    """Generate posts for each platform using Ollama with trend context."""
    platforms = {
        "twitter": {"chars": 280, "count": count_per_platform},
        "instagram": {"chars": 2200, "count": max(2, count_per_platform // 2)},
        "linkedin": {"chars": 700, "count": max(2, count_per_platform // 2)},
        "reddit": {"chars": 500, "count": 2},
    }

    queue = {}
    for platform, spec in platforms.items():
        posts = []
        prompt = (
            f"Current trend intelligence:\n{trend_summary}\n\n"
            f"Write {spec['count']} separate {platform} posts for YouAndINotAI. "
            f"Each post max {spec['chars']} characters. "
            f"Make them timely and reference the trends naturally. "
            f"Separate each post with '---'. "
            f"Do not number them. Just write the posts."
        )
        log.info(f"Generating {spec['count']} posts for {platform}...")
        raw_output = _ollama_generate(prompt, max_tokens=spec["chars"] * spec["count"] // 3)
        if not raw_output:
            log.warning(f"  → Ollama returned nothing for {platform}")
            continue

        # Split on separator
        parts = [p.strip() for p in raw_output.split("---") if p.strip()]
        for part in parts[: spec["count"]]:
            if len(part) >= 20:
                posts.append({
                    "text": part[: spec["chars"]],
                    "source": "apify_scout",
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                })

        if posts:
            queue[platform] = posts
            log.info(f"  → {len(posts)} posts generated for {platform}")

    return queue


# ---------------------------------------------------------------------------
# Queue management
# ---------------------------------------------------------------------------
def merge_into_queue(new_posts: dict) -> None:
    """Merge newly generated posts into the existing post queue."""
    existing = {}
    if POST_QUEUE.exists():
        try:
            with open(POST_QUEUE, encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            pass

    for platform, posts in new_posts.items():
        existing.setdefault(platform, [])
        existing[platform].extend(posts)
        log.info(f"Queue: {platform} now has {len(existing[platform])} posts")

    with open(POST_QUEUE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    log.info(f"✅ Merged {sum(len(v) for v in new_posts.values())} new posts into {POST_QUEUE}")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Apify content scout — gather trends + generate posts via Ollama"
    )
    parser.add_argument("--dry-run", action="store_true", help="Scrape only, skip generation and queue write")
    parser.add_argument("--platform", default=None, help="Generate posts for one platform only")
    parser.add_argument("--no-scrape", action="store_true", help="Skip Apify scraping (use cached data)")
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("ANTIGRAVITY Apify Content Scout")
    log.info(f"Ollama: {OLLAMA_BASE_URL} / {OLLAMA_MODEL}")
    log.info(f"Apify membership record: {'set' if APIFY_TOKEN else 'MISSING'}")
    log.info("=" * 60)

    # Step 1: Gather trends via Apify
    cache_path = DATA_DIR / "apify-trend-cache.json"
    if args.no_scrape and cache_path.exists():
        log.info("Using cached trend data...")
        with open(cache_path, encoding="utf-8") as f:
            raw_data = json.load(f)
    else:
        raw_data = gather_trends()
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(raw_data, f, indent=2, ensure_ascii=False)
        log.info(f"Trend cache saved → {cache_path}")

    trend_summary = _summarize_trends(raw_data)
    log.info(f"\nTrend summary:\n{trend_summary}\n")

    if args.dry_run:
        log.info("--dry-run: skipping content generation.")
        sys.exit(0)

    # Step 2: Generate posts via Ollama
    new_posts = generate_posts(trend_summary)

    # Filter to single platform if requested
    if args.platform:
        new_posts = {k: v for k, v in new_posts.items() if k == args.platform}
        if not new_posts:
            log.error(f"No posts generated for platform '{args.platform}'")
            sys.exit(1)

    if not new_posts:
        log.warning("No posts generated — check Ollama is running and APIFY_TOKEN is set")
        sys.exit(1)

    # Step 3: Merge into queue
    merge_into_queue(new_posts)
    log.info("Scout complete. Social engine will pick up new posts on next cycle.")


if __name__ == "__main__":
    main()
