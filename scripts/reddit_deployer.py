#!/usr/bin/env python3
"""
Reddit Deployer — Posts content from reddit-linkedin-expansion.json to 10 subreddits.
Part of Protocol Omega 4-Phase Content Deployment.

Usage:
  python reddit_deployer.py                    # Dry run (preview all posts)
  python reddit_deployer.py --post             # Post all (staggered 2-3 min apart)
  python reddit_deployer.py --post --sub r/startups  # Post to specific sub only
  python reddit_deployer.py --status           # Show what's been posted

Requires: pip install praw
Env vars: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD
"""
import json
import os
import sys
import io
import time
import random
import logging
from pathlib import Path
from datetime import datetime

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
CONTENT_FILE = PROJECT_DIR / "content" / "reddit-linkedin-expansion.json"
RESULTS_FILE = PROJECT_DIR / "data" / f"reddit-deploy-{datetime.now().strftime('%Y%m%d-%H%M')}.json"
ENV_FILES = [
    SCRIPT_DIR / ".env",
    PROJECT_DIR / "marketing-automation" / ".env",
]
LOGS_DIR = PROJECT_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
(PROJECT_DIR / "data").mkdir(parents=True, exist_ok=True)

UTM = "?utm_source=reddit&utm_medium=organic&utm_campaign=founding-launch"
SITE_URL = f"youandinotai.com{UTM}"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [REDDIT] %(message)s",
    handlers=[
        logging.FileHandler(str(LOGS_DIR / "reddit-deploy.log")),
        logging.StreamHandler(),
    ]
)
log = logging.getLogger("reddit")


def load_env():
    for env_file in ENV_FILES:
        if env_file.exists():
            with open(env_file, encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def load_content():
    with open(CONTENT_FILE, encoding="utf-8") as f:
        return json.load(f)


def add_utm(text):
    """Replace bare youandinotai.com URLs with UTM-tagged version."""
    return text.replace("youandinotai.com", SITE_URL)


def get_reddit_client():
    try:
        import praw
    except ImportError:
        log.error("praw not installed: pip install praw")
        return None

    client_id = os.environ.get("REDDIT_CLIENT_ID", "")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    username = os.environ.get("REDDIT_USERNAME", "")
    password = os.environ.get("REDDIT_PASSWORD", "")

    if not all([client_id, client_secret, username, password]):
        log.error("Reddit API credentials not set.")
        log.error("Need: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD")
        return None

    try:
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            user_agent="YouAndINotAI-Marketing/1.0 (by u/" + username + ")",
        )
        # Verify auth
        me = reddit.user.me()
        log.info(f"Authenticated as u/{me.name}")
        return reddit
    except Exception as e:
        log.error(f"Reddit auth failed: {e}")
        return None


def post_to_reddit(reddit, subreddit_name, title, body, flair=None):
    """Submit a text post to a subreddit."""
    sub_name = subreddit_name.lstrip("r/")
    try:
        subreddit = reddit.subreddit(sub_name)
        submission = subreddit.submit(
            title=title,
            selftext=add_utm(body),
            flair_id=None,  # Flair often needs sub-specific IDs
        )
        url = f"https://reddit.com{submission.permalink}"
        log.info(f"Posted to r/{sub_name}: {url}")
        return True, url
    except Exception as e:
        log.error(f"Failed r/{sub_name}: {e}")
        return False, str(e)


def dry_run(content, sub_filter=None):
    """Preview all posts without posting."""
    posts = content.get("reddit_posts", [])
    print(f"\n{'='*60}")
    print(f"  REDDIT DEPLOYMENT — DRY RUN")
    print(f"  {len(posts)} posts ready")
    print(f"{'='*60}\n")

    for i, post in enumerate(posts):
        sub = post["subreddit"]
        if sub_filter and sub_filter.lower() not in sub.lower():
            continue
        title = post["title"]
        body = add_utm(post["body"])
        flair = post.get("flair", "")

        print(f"  [{i+1}] {sub} (flair: {flair})")
        print(f"      Title: {title[:80]}{'...' if len(title)>80 else ''}")
        print(f"      Body:  {body[:100]}...")
        print(f"      Chars: {len(body)}")
        print()

    print(f"  UTM: {UTM}")
    print(f"  Stagger: 2-3 minutes between posts")
    print()


def deploy(sub_filter=None):
    """Post all content to Reddit with staggered timing."""
    load_env()
    content = load_content()
    posts = content.get("reddit_posts", [])

    reddit = get_reddit_client()
    if not reddit:
        print("\nFalling back to dry run...")
        dry_run(content, sub_filter)
        return

    results = []
    posted = 0
    failed = 0

    for i, post in enumerate(posts):
        sub = post["subreddit"]
        if sub_filter and sub_filter.lower() not in sub.lower():
            continue

        title = post["title"]
        body = post["body"]
        flair = post.get("flair", "")

        success, result = post_to_reddit(reddit, sub, title, body, flair)

        results.append({
            "subreddit": sub,
            "title": title[:80],
            "status": "posted" if success else "failed",
            "result": result,
            "timestamp": datetime.now().isoformat(),
        })

        if success:
            posted += 1
        else:
            failed += 1
            if "ratelimit" in str(result).lower() or "RATELIMIT" in str(result):
                wait = 600  # 10 min if rate limited
                log.warning(f"Rate limited. Waiting {wait}s...")
                time.sleep(wait)
                continue

        # Stagger 2-3 minutes between posts
        if i < len(posts) - 1:
            delay = random.randint(120, 180)
            log.info(f"Waiting {delay}s before next post...")
            time.sleep(delay)

    # Save results
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    log.info(f"Deployment complete: {posted} posted, {failed} failed")
    log.info(f"Results: {RESULTS_FILE}")
    return posted, failed


def show_status():
    """Show deployment history."""
    data_dir = PROJECT_DIR / "data"
    result_files = sorted(data_dir.glob("reddit-deploy-*.json"))

    if not result_files:
        print("No Reddit deployments found.")
        return

    for rf in result_files:
        with open(rf, encoding="utf-8") as f:
            results = json.load(f)
        print(f"\n  {rf.name}:")
        for r in results:
            status = r.get("status", "?")
            icon = "+" if status == "posted" else "x"
            print(f"    [{icon}] {r['subreddit']:25s} {status} — {r.get('result','')[:60]}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Reddit Content Deployer")
    parser.add_argument("--post", action="store_true", help="Actually post (default is dry run)")
    parser.add_argument("--sub", type=str, help="Filter to specific subreddit")
    parser.add_argument("--status", action="store_true", help="Show deployment history")
    args = parser.parse_args()

    load_env()
    content = load_content()

    if args.status:
        show_status()
    elif args.post:
        deploy(args.sub)
    else:
        dry_run(content, args.sub)


if __name__ == "__main__":
    main()
