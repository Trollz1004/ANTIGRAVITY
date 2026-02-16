"""
YouAndINotAI Marketing Automation — Configuration
All settings loaded from environment variables (.env file)
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

# ── Launch Config ──
LAUNCH_DATE = "2026-02-14 12:00:00"
BRAND_NAME = "YouAndINotAI"
DOMAIN = "youandinotai.com"
TAGLINE = "No Bots. Real Humans. Real Connections."

# ── Paths ──
DB_PATH = BASE_DIR / "data" / "campaign.db"
LOG_DIR = BASE_DIR / "logs"
MEME_OUTPUT = BASE_DIR / "output" / "memes"
TEMPLATE_DIR = BASE_DIR / "templates"

# ── Email (Gmail SMTP — already configured on SABRETOOTH) ──
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("GMAIL_APP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "hello@youandinotai.com")
FROM_NAME = os.getenv("FROM_NAME", "YouAndINotAI")

# ── Twitter/X API v2 ──
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET", "")
TWITTER_BEARER = os.getenv("TWITTER_BEARER_TOKEN", "")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN", "")
TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET", "")

# ── Meta (Facebook/Instagram) ──
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
META_AD_ACCOUNT = os.getenv("META_AD_ACCOUNT_ID", "")
IG_ACCOUNT_ID = os.getenv("IG_ACCOUNT_ID", "")

# ── Reddit (PRAW) ──
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USERNAME = os.getenv("REDDIT_USERNAME", "")
REDDIT_PASSWORD = os.getenv("REDDIT_PASSWORD", "")

# ── Google Ads ──
GOOGLE_ADS_DEV_TOKEN = os.getenv("GOOGLE_ADS_DEV_TOKEN", "")
GOOGLE_ADS_CLIENT_ID = os.getenv("GOOGLE_ADS_CLIENT_ID", "")

# ── SendGrid (alternative to Gmail for bulk) ──
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")

# ── Scheduling ──
POST_CHECK_INTERVAL_MIN = 5
EMAIL_CHECK_INTERVAL_MIN = 5
REDDIT_CHECK_INTERVAL_MIN = 60
REPORT_TIME = "20:00"

# ── Feature Flags (enable as APIs become available) ──
ENABLE_TWITTER = bool(TWITTER_BEARER)
ENABLE_META = bool(META_ACCESS_TOKEN)
ENABLE_REDDIT = bool(REDDIT_CLIENT_ID)
ENABLE_EMAIL_GMAIL = bool(SMTP_PASS)
ENABLE_EMAIL_SENDGRID = bool(SENDGRID_API_KEY)
