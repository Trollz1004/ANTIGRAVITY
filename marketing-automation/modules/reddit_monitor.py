"""
Reddit monitoring module.
Watches subreddits for keywords related to dating app frustration.
Logs alerts to database for manual response.
"""
import logging
from config import (
    REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET,
    REDDIT_USERNAME, REDDIT_PASSWORD, ENABLE_REDDIT,
)
from modules import database as db
from modules.content_library import REDDIT_KEYWORDS, REDDIT_SUBREDDITS

log = logging.getLogger("reddit")


def get_reddit_client():
    """Initialize PRAW Reddit client."""
    if not ENABLE_REDDIT:
        return None
    try:
        import praw
        return praw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            username=REDDIT_USERNAME,
            password=REDDIT_PASSWORD,
            user_agent="YouAndINotAI Marketing Monitor v1.0"
        )
    except Exception as e:
        log.error(f"Reddit client init failed: {e}")
        return None


def scan_subreddits():
    """Scan configured subreddits for keyword matches."""
    if not ENABLE_REDDIT:
        log.warning("Reddit not configured — skipping scan")
        return 0

    reddit = get_reddit_client()
    if not reddit:
        return 0

    alerts_found = 0

    for sub_name in REDDIT_SUBREDDITS:
        try:
            subreddit = reddit.subreddit(sub_name)
            for submission in subreddit.new(limit=25):
                text = f"{submission.title} {submission.selftext}".lower()
                for keyword in REDDIT_KEYWORDS:
                    if keyword.lower() in text:
                        url = f"https://reddit.com{submission.permalink}"
                        db.insert_reddit_alert(sub_name, submission.title, url, keyword)
                        log.info(f"ALERT: r/{sub_name} — '{submission.title}' (keyword: {keyword})")
                        alerts_found += 1
                        break  # One alert per post
        except Exception as e:
            log.error(f"Error scanning r/{sub_name}: {e}")

    if alerts_found:
        log.info(f"Found {alerts_found} new Reddit alerts")
    return alerts_found


def get_response_draft(post_title: str) -> str:
    """Generate a suggested response for a Reddit post."""
    return f"""Hey! Founder of YouAndINotAI here — I built the app for exactly this reason.

We have multi-layer human verification and a zero-tolerance bot policy. Every single profile is a verified human.

Not trying to spam — but if you're seriously fed up with bots, check us out: youandinotai.com

Happy to answer any questions about how we verify users.

(Launching Valentine's Day — Feb 14, 2026. Early Bird: $4.99/mo)"""
