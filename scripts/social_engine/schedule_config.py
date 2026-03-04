"""
Schedule Configuration — Per-platform cadences, rate limits, content pillars.
"""
from datetime import datetime

LAUNCH_DATE = datetime(2026, 4, 4)

CONTENT_PILLARS = [
    {
        "id": "bot_problem",
        "weight": 0.25,
        "prompts": [
            "Write a short, punchy social media post about how 60% of dating app profiles are fake bots. "
            "Mention YouAndINotAI as the solution — the only dating app that verifies every human with "
            "V8 Cloud Verification powered by Plaid. Keep it real, no corporate speak. Include youandinotai.com",
        ],
    },
    {
        "id": "v8_verification",
        "weight": 0.25,
        "prompts": [
            "Write a social media post about V8 Cloud Verification — 8 layers of identity proof including "
            "Plaid bank-grade verification, liveness scan, device verify, and behavior analysis. "
            "YouAndINotAI is the only dating app using this. Keep it conversational. Include youandinotai.com",
        ],
    },
    {
        "id": "founding_member",
        "weight": 0.20,
        "prompts": [
            "Write an urgent social media post about YouAndINotAI founding member spots. Only 100 spots at "
            "$14.99/mo locked FOREVER. Price goes up after. This is the one chance to get in early. "
            "Real humans only, V8 Cloud verified. Include youandinotai.com",
        ],
    },
    {
        "id": "charity_mission",
        "weight": 0.15,
        "prompts": [
            "Write a social media post about YouAndINotAI's mission: 60% of all revenue goes to "
            "Shriners Children's Hospitals. Every date funds a child's care. This isn't just a dating app — "
            "it's a movement. #ForTheKids. Include youandinotai.com",
        ],
    },
    {
        "id": "launch_countdown",
        "weight": 0.15,
        "prompts": [
            "Write an exciting social media post counting down to YouAndINotAI's launch on April 4, 2026. "
            "{{days_left}} days to go. Founding member spots are limited to 100 at $14.99/mo forever. "
            "V8 Cloud Verification ensures zero bots. Include youandinotai.com",
        ],
    },
]

PLATFORM_SPECS = {
    "twitter": {
        "max_chars": 280,
        "hashtag_style": "inline",
        "max_hashtags": 3,
        "tone": "punchy, casual, provocative",
        "cta": "youandinotai.com",
    },
    "instagram": {
        "max_chars": 2200,
        "hashtag_style": "block_below",
        "max_hashtags": 15,
        "tone": "aspirational, emoji-ok, storytelling",
        "cta": "Link in bio",
    },
    "facebook": {
        "max_chars": 5000,
        "hashtag_style": "minimal",
        "max_hashtags": 3,
        "tone": "conversational, relatable, question-asking",
        "cta": "youandinotai.com",
    },
    "reddit": {
        "max_chars": 10000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "genuine, value-first, NOT promotional, share a story",
        "cta": "subtle mention only",
    },
    "linkedin": {
        "max_chars": 3000,
        "hashtag_style": "block_below",
        "max_hashtags": 5,
        "tone": "professional, thought-leadership, industry insight",
        "cta": "youandinotai.com",
    },
    "tiktok": {
        "max_chars": 2200,
        "hashtag_style": "inline",
        "max_hashtags": 5,
        "tone": "gen-z, bold, challenge-style",
        "cta": "Link in bio",
    },
    "pinterest": {
        "max_chars": 500,
        "hashtag_style": "block_below",
        "max_hashtags": 5,
        "tone": "inspirational, visual-focused, lifestyle",
        "cta": "youandinotai.com",
    },
    "threads": {
        "max_chars": 500,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "casual, twitter-like, conversational",
        "cta": "youandinotai.com",
    },
    "bluesky": {
        "max_chars": 300,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "tech-savvy, authentic, community-driven",
        "cta": "youandinotai.com",
    },
    "mastodon": {
        "max_chars": 500,
        "hashtag_style": "inline",
        "max_hashtags": 5,
        "tone": "open-source friendly, privacy-focused, genuine",
        "cta": "youandinotai.com",
    },
    "discord": {
        "max_chars": 2000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "community update, friendly, emoji-ok",
        "cta": "youandinotai.com",
    },
    "telegram": {
        "max_chars": 4096,
        "hashtag_style": "inline",
        "max_hashtags": 5,
        "tone": "direct, news-style, announcement",
        "cta": "youandinotai.com",
    },
    "youtube": {
        "max_chars": 5000,
        "hashtag_style": "block_below",
        "max_hashtags": 3,
        "tone": "engaging, question-asking, community post",
        "cta": "youandinotai.com",
    },
    "medium": {
        "max_chars": 50000,
        "hashtag_style": "tags",
        "max_hashtags": 5,
        "tone": "long-form, thoughtful, educational",
        "cta": "youandinotai.com",
        "content_type": "article",
    },
    "devto": {
        "max_chars": 50000,
        "hashtag_style": "tags",
        "max_hashtags": 4,
        "tone": "developer-focused, technical, behind-the-scenes",
        "cta": "youandinotai.com",
        "content_type": "article",
    },
    "hashnode": {
        "max_chars": 50000,
        "hashtag_style": "tags",
        "max_hashtags": 5,
        "tone": "developer-focused, tutorial-style",
        "cta": "youandinotai.com",
        "content_type": "article",
    },
    "quora": {
        "max_chars": 10000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "helpful, answer-a-question, expert voice",
        "cta": "subtle mention",
        "content_type": "answer",
    },
    "producthunt": {
        "max_chars": 2000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "startup, launch-focused, builder",
        "cta": "youandinotai.com",
        "content_type": "discussion",
    },
    "indiehackers": {
        "max_chars": 10000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "indie-builder, transparent, revenue-sharing",
        "cta": "youandinotai.com",
        "content_type": "post",
    },
    "substack": {
        "max_chars": 50000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "newsletter, personal, storytelling",
        "cta": "youandinotai.com",
        "content_type": "newsletter",
    },
    "nextdoor": {
        "max_chars": 2000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "local, community, friendly neighbor",
        "cta": "youandinotai.com",
    },
    "ebay": {
        "max_chars": 5000,
        "hashtag_style": "none",
        "max_hashtags": 0,
        "tone": "product listing, value proposition, collectible",
        "cta": "Buy now",
        "content_type": "listing",
    },
}

PLATFORM_SCHEDULE = {
    # Group 1: API (fast, reliable)
    "twitter":    {"posts_per_day": 6, "hours": [7, 9, 12, 15, 18, 21], "method": "browser", "priority": 0},
    "reddit":     {"posts_per_day": 2, "hours": [10, 16], "method": "browser", "priority": 0},
    "bluesky":    {"posts_per_day": 3, "hours": [8, 13, 19], "method": "api", "priority": 1},
    "mastodon":   {"posts_per_day": 3, "hours": [9, 14, 20], "method": "api", "priority": 1},
    "discord":    {"posts_per_day": 2, "hours": [11, 17], "method": "api", "priority": 1},
    "telegram":   {"posts_per_day": 2, "hours": [10, 18], "method": "api", "priority": 1},
    "devto":      {"posts_per_day": 1, "hours": [8], "method": "api", "priority": 2},
    # Group 2: Browser (Playwright)
    "instagram":  {"posts_per_day": 2, "hours": [9, 18], "method": "browser", "priority": 0},
    "facebook":   {"posts_per_day": 2, "hours": [10, 16], "method": "browser", "priority": 0},
    "tiktok":     {"posts_per_day": 1, "hours": [19], "method": "browser", "priority": 1},
    "pinterest":  {"posts_per_day": 3, "hours": [8, 13, 20], "method": "browser", "priority": 1},
    "linkedin":   {"posts_per_day": 1, "hours": [9], "method": "browser", "priority": 1, "weekdays_only": True},
    "threads":    {"posts_per_day": 2, "hours": [11, 19], "method": "browser", "priority": 1},
    "youtube":    {"posts_per_day": 1, "hours": [14], "method": "browser", "priority": 2},
    "quora":      {"posts_per_day": 1, "hours": [11], "method": "browser", "priority": 2},
    "medium":     {"posts_per_day": 1, "hours": [8], "method": "browser", "priority": 2, "weekdays": [1, 4]},
    "hashnode":   {"posts_per_day": 1, "hours": [8], "method": "api", "priority": 2, "weekdays": [2, 5]},
    "indiehackers": {"posts_per_day": 1, "hours": [10], "method": "browser", "priority": 2, "weekdays": [3]},
    "producthunt":  {"posts_per_day": 1, "hours": [0], "method": "browser", "priority": 2},
    "substack":     {"posts_per_day": 1, "hours": [8], "method": "browser", "priority": 2, "weekdays": [0]},
    "nextdoor":     {"posts_per_day": 1, "hours": [10], "method": "browser", "priority": 2},
    # Group 3: Marketplace
    "ebay":       {"posts_per_day": 1, "hours": [10], "method": "browser", "priority": 1, "weekdays": [1]},
}

RATE_LIMITS = {
    "twitter":    {"max_daily": 50, "min_interval_min": 15},
    "instagram":  {"max_daily": 5,  "min_interval_min": 60},
    "facebook":   {"max_daily": 5,  "min_interval_min": 60},
    "reddit":     {"max_daily": 5,  "min_interval_min": 240},
    "linkedin":   {"max_daily": 3,  "min_interval_min": 120},
    "tiktok":     {"max_daily": 3,  "min_interval_min": 120},
    "pinterest":  {"max_daily": 10, "min_interval_min": 30},
    "threads":    {"max_daily": 5,  "min_interval_min": 60},
    "bluesky":    {"max_daily": 10, "min_interval_min": 30},
    "mastodon":   {"max_daily": 10, "min_interval_min": 30},
    "discord":    {"max_daily": 5,  "min_interval_min": 60},
    "telegram":   {"max_daily": 5,  "min_interval_min": 60},
    "youtube":    {"max_daily": 2,  "min_interval_min": 360},
    "medium":     {"max_daily": 1,  "min_interval_min": 1440},
    "devto":      {"max_daily": 1,  "min_interval_min": 1440},
    "hashnode":   {"max_daily": 1,  "min_interval_min": 1440},
    "quora":      {"max_daily": 3,  "min_interval_min": 240},
    "producthunt": {"max_daily": 1, "min_interval_min": 1440},
    "indiehackers": {"max_daily": 1, "min_interval_min": 1440},
    "substack":   {"max_daily": 1,  "min_interval_min": 10080},
    "nextdoor":   {"max_daily": 2,  "min_interval_min": 360},
    "ebay":       {"max_daily": 1,  "min_interval_min": 10080},
}

REDDIT_SUBREDDITS = [
    "dating", "OnlineDating", "datingapps", "datingoverthirty",
    "SideProject", "startups", "buildinpublic", "indiehackers",
]

def days_until_launch():
    return max(0, (LAUNCH_DATE - datetime.now()).days)
