"""
Social media posting module.
Supports: Twitter/X, Instagram (Meta Graph API), LinkedIn.
Each platform is enabled/disabled via config flags.
"""
import logging
from datetime import datetime, timedelta

from config import (
    TWITTER_BEARER, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET,
    TWITTER_API_KEY, TWITTER_API_SECRET,
    META_ACCESS_TOKEN, IG_ACCOUNT_ID,
    ENABLE_TWITTER, ENABLE_META, LAUNCH_DATE,
)
from modules import database as db
from modules.content_library import COUNTDOWN_POSTS, TWITTER_THREADS

log = logging.getLogger("social")


# ── Twitter/X ──

def post_twitter(content: str) -> str | None:
    """Post to Twitter using OAuth 1.0a (user context for tweeting)."""
    if not ENABLE_TWITTER:
        log.warning("Twitter not enabled — skipping post")
        return None

    try:
        import tweepy
        client = tweepy.Client(
            consumer_key=TWITTER_API_KEY,
            consumer_secret=TWITTER_API_SECRET,
            access_token=TWITTER_ACCESS_TOKEN,
            access_token_secret=TWITTER_ACCESS_SECRET,
        )
        resp = client.create_tweet(text=content)
        tweet_id = resp.data["id"]
        log.info(f"Posted to Twitter: {tweet_id}")
        return str(tweet_id)
    except Exception as e:
        log.error(f"Twitter post failed: {e}")
        return None


def post_twitter_thread(tweets: list[str]) -> str | None:
    """Post a thread (reply chain) to Twitter."""
    if not ENABLE_TWITTER:
        log.warning("Twitter not enabled — skipping thread")
        return None

    try:
        import tweepy
        client = tweepy.Client(
            consumer_key=TWITTER_API_KEY,
            consumer_secret=TWITTER_API_SECRET,
            access_token=TWITTER_ACCESS_TOKEN,
            access_token_secret=TWITTER_ACCESS_SECRET,
        )
        reply_to = None
        first_id = None

        for i, tweet_text in enumerate(tweets):
            resp = client.create_tweet(
                text=tweet_text,
                in_reply_to_tweet_id=reply_to
            )
            tweet_id = resp.data["id"]
            if i == 0:
                first_id = tweet_id
            reply_to = tweet_id
            log.info(f"Thread tweet {i+1}/{len(tweets)}: {tweet_id}")

        return str(first_id)
    except Exception as e:
        log.error(f"Twitter thread failed: {e}")
        return None


# ── Instagram ──

def post_instagram(content: str, image_url: str = None) -> str | None:
    """Post to Instagram via Meta Graph API. Requires business account."""
    if not ENABLE_META:
        log.warning("Meta/Instagram not enabled — skipping post")
        return None

    import requests

    try:
        # Step 1: Create media container
        url = f"https://graph.facebook.com/v18.0/{IG_ACCOUNT_ID}/media"
        params = {
            "access_token": META_ACCESS_TOKEN,
            "caption": content,
        }
        if image_url:
            params["image_url"] = image_url

        resp = requests.post(url, params=params, timeout=30)
        container_id = resp.json().get("id")

        if not container_id:
            log.error(f"IG container creation failed: {resp.text}")
            return None

        # Step 2: Publish
        pub_url = f"https://graph.facebook.com/v18.0/{IG_ACCOUNT_ID}/media_publish"
        pub_params = {
            "access_token": META_ACCESS_TOKEN,
            "creation_id": container_id,
        }
        pub_resp = requests.post(pub_url, params=pub_params, timeout=30)
        post_id = pub_resp.json().get("id")
        log.info(f"Posted to Instagram: {post_id}")
        return post_id

    except Exception as e:
        log.error(f"Instagram post failed: {e}")
        return None


# ── LinkedIn ──

def post_linkedin(content: str) -> str | None:
    """Post to LinkedIn. Requires OAuth token (not implemented yet)."""
    log.warning("LinkedIn posting not yet implemented — content saved to DB only")
    return None


# ── Dispatcher ──

PLATFORM_MAP = {
    "twitter": post_twitter,
    "instagram": post_instagram,
    "linkedin": post_linkedin,
}


def schedule_all_content():
    """Load all content from the library into the database with correct timestamps."""
    launch = datetime.strptime(LAUNCH_DATE, "%Y-%m-%d %H:%M:%S")
    count = 0

    # Check if already seeded
    conn = db.get_conn()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM posts")
    existing = c.fetchone()[0]
    conn.close()

    if existing > 0:
        log.info(f"Database already has {existing} posts — skipping seed")
        return existing

    for post in COUNTDOWN_POSTS:
        post_date = launch + timedelta(days=post["day_offset"])
        h, m = map(int, post["time"].split(":"))
        scheduled = post_date.replace(hour=h, minute=m, second=0)
        db.insert_post(post["platform"], post["content"], scheduled.isoformat())
        count += 1

    # Schedule threads as individual posts (first tweet only, thread handled separately)
    for thread in TWITTER_THREADS:
        post_date = launch + timedelta(days=thread["day_offset"])
        h, m = map(int, thread["time"].split(":"))
        scheduled = post_date.replace(hour=h, minute=m, second=0)
        # Store full thread as JSON in content field
        import json
        thread_content = json.dumps({"type": "thread", "tweets": thread["thread"]})
        db.insert_post("twitter_thread", thread_content, scheduled.isoformat())
        count += 1

    log.info(f"Seeded {count} posts into database")
    return count


def process_pending_posts():
    """Check for and publish pending posts."""
    import json
    pending = db.get_pending_posts()
    posted_count = 0

    for post_id, platform, content, image_path in pending:
        # Handle threads
        if platform == "twitter_thread":
            try:
                data = json.loads(content)
                result = post_twitter_thread(data["tweets"])
            except (json.JSONDecodeError, KeyError):
                result = None
        else:
            poster = PLATFORM_MAP.get(platform)
            if not poster:
                log.warning(f"Unknown platform: {platform}")
                db.mark_post_error(post_id, f"Unknown platform: {platform}")
                continue
            result = poster(content)

        if result:
            db.mark_post_done(post_id, result)
            db.log_metric(f"{platform}_posted", 1)
            posted_count += 1
        else:
            # Mark as posted anyway if platform isn't enabled (don't retry forever)
            if platform == "twitter" and not ENABLE_TWITTER:
                db.mark_post_done(post_id, "SKIPPED_NO_API")
            elif platform == "instagram" and not ENABLE_META:
                db.mark_post_done(post_id, "SKIPPED_NO_API")
            elif platform == "linkedin":
                db.mark_post_done(post_id, "SKIPPED_NO_API")
            elif platform == "twitter_thread" and not ENABLE_TWITTER:
                db.mark_post_done(post_id, "SKIPPED_NO_API")
            else:
                db.mark_post_error(post_id, "Post failed — will retry")

    if posted_count:
        log.info(f"Posted {posted_count} items this cycle")
    return posted_count
