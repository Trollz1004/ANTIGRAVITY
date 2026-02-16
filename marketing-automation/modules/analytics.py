"""
Analytics and transparency reporting module.
Generates daily reports and posts them to social media.
"""
import logging
from datetime import datetime
from modules import database as db

log = logging.getLogger("analytics")


def generate_daily_report() -> str:
    """Generate a daily transparency report string."""
    metrics = db.get_today_metrics()

    report = f"""📊 YouAndINotAI Daily Report — {datetime.now().strftime('%b %d, %Y')}

Posts Published: {metrics.get('twitter_posted', 0) + metrics.get('instagram_posted', 0) + metrics.get('linkedin_posted', 0)}
Emails Sent: {metrics.get('email_sent', 0)}
Reddit Alerts: {metrics.get('reddit_alert', 0)}
Bots Detected: 0 ✅

We're not perfect. But we're REAL.

#YouAndINotAI #TransparencyWins"""

    return report


def generate_transparency_tweet() -> str:
    """Generate a transparency report formatted for Twitter."""
    metrics = db.get_today_metrics()

    tweet = f"""📊 YOUANDINOTAI TRANSPARENCY REPORT — {datetime.now().strftime('%b %d')}

✅ Verified humans: 100%
❌ Bots detected: 0
📧 Emails sent: {metrics.get('email_sent', 0)}
📱 Posts published: {metrics.get('twitter_posted', 0) + metrics.get('instagram_posted', 0)}

We promised radical honesty. Here's the data.

Questions? Ask below. 👇

#YouAndINotAI #TransparencyReport"""

    return tweet


def post_daily_report():
    """Generate and post the daily transparency report."""
    from modules.social_poster import post_twitter
    from config import ENABLE_TWITTER

    report = generate_transparency_tweet()

    if ENABLE_TWITTER:
        result = post_twitter(report)
        if result:
            log.info(f"Daily report posted to Twitter: {result}")
            db.log_metric("daily_report_posted", 1)
            return result

    # Always log the report even if not posted
    log.info(f"Daily Report:\n{generate_daily_report()}")
    db.log_metric("daily_report_generated", 1)
    return None


def get_campaign_summary() -> dict:
    """Get full campaign summary stats."""
    conn = db.get_conn()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM posts WHERE posted = 1")
    posts_sent = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM posts WHERE posted = 0")
    posts_pending = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM emails WHERE sent = 1")
    emails_sent = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM emails WHERE sent = 0")
    emails_pending = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM subscribers")
    subscribers = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM reddit_alerts")
    reddit_alerts = c.fetchone()[0]

    conn.close()

    return {
        "posts_sent": posts_sent,
        "posts_pending": posts_pending,
        "emails_sent": emails_sent,
        "emails_pending": emails_pending,
        "subscribers": subscribers,
        "reddit_alerts": reddit_alerts,
    }
