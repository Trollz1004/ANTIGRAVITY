# Social Platforms Secret Sources

Date: 2026-03-19
Vault root: C:\Users\joshl\OneDrive\Personal Vault-Sabretooth

Purpose:
- Separate social-media and distribution credentials from the full mission env.
- Keep a smaller copy/paste surface when only social platform APIs are needed.

Status legend:
- local: value exists in C:\ANTIGRAVITY\.env and was copied into SOCIAL-PLATFORMS.env
- github-name-only: secret name exists in GitHub Actions, but the value is not available via gh CLI
- repo-reference-only: key is referenced in repo code/docs, but not confirmed in local .env or GitHub secret names

## Telegram
- TELEGRAM_BOT_TOKEN — github-name-only / repo-reference-only
- TELEGRAM_CHAT_ID — github-name-only / repo-reference-only
- TELEGRAM_MARKETING_CHANNEL_ID — github-name-only / repo-reference-only

## X / Twitter
- TWITTER_API_KEY — github-name-only / repo-reference-only
- TWITTER_API_SECRET — github-name-only / repo-reference-only
- TWITTER_BEARER_TOKEN — github-name-only / repo-reference-only
- TWITTER_ACCESS_TOKEN — github-name-only / repo-reference-only
- TWITTER_ACCESS_TOKEN_SECRET — github-name-only / repo-reference-only
- TWITTER_ACCESS_SECRET — github-name-only / repo-reference-only
- TWITTER_CLIENT_ID — github-name-only / repo-reference-only
- TWITTER_CLIENT_SECRET — github-name-only / repo-reference-only

## Reddit
- REDDIT_CLIENT_ID — github-name-only / repo-reference-only
- REDDIT_CLIENT_SECRET — github-name-only / repo-reference-only
- REDDIT_USERNAME — github-name-only / repo-reference-only
- REDDIT_PASSWORD — github-name-only / repo-reference-only

## Meta / Instagram
- META_ACCESS_TOKEN — github-name-only / repo-reference-only
- IG_ACCOUNT_ID — github-name-only / repo-reference-only

## YouTube
- YOUTUBE_API_KEY — github-name-only / repo-reference-only
- YOUTUBE_CLIENT_ID — github-name-only / repo-reference-only
- YOUTUBE_CLIENT_SECRET — github-name-only / repo-reference-only
- YOUTUBE_REDIRECT_URI — github-name-only / repo-reference-only
- GEMINI_YOUTUBE_CLIENT_ID — github-name-only / repo-reference-only
- GEMINI_YOUTUBE_CLIENT_SECRET — github-name-only / repo-reference-only

## Other Social / Distribution
- BLUESKY_HANDLE — github-name-only / repo-reference-only
- BLUESKY_APP_PASSWORD — github-name-only / repo-reference-only
- DISCORD_WEBHOOK_URL — github-name-only / repo-reference-only
- MASTODON_ACCESS_TOKEN — github-name-only / repo-reference-only
- MASTODON_INSTANCE — github-name-only / repo-reference-only
- SUBSTACK_SUBDOMAIN — github-name-only / repo-reference-only
- APIFY_TOKEN — github-name-only / repo-reference-only

GitHub secret names confirmed this pass:
- TELEGRAM_BOT_TOKEN, TWITTER_*, REDDIT_*, META_ACCESS_TOKEN, IG_ACCOUNT_ID, YOUTUBE_*, GEMINI_YOUTUBE_CLIENT_ID, GEMINI_YOUTUBE_CLIENT_SECRET

Manual follow-up:
- Copy any missing values from GitHub Actions secrets or platform dashboards into SOCIAL-PLATFORMS.env when needed.
