# Marketing Engine - API Keys Setup Guide

## Twitter/X

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a project and app
3. Get API Key, Secret, Access Token, Access Secret
4. Enable read and write permissions

## LinkedIn

1. Go to [LinkedIn Developers](https://developer.linkedin.com)
2. Create an app
3. Request `w_member_social` permission
4. Get Access Token (OAuth 2.0)
5. Get your Person ID from profile URL

## Reddit

1. Go to [reddit.com/prefs/apps](https://reddit.com/prefs/apps)
2. Create a "script" app
3. Get Client ID (under app name) and Secret

## Dev.to

1. Go to [dev.to/settings/extensions](https://dev.to/settings/extensions)
2. Generate API Key

## Telegram

1. Message [@BotFather](https://t.me/botfather)
2. Create new bot with /newbot
3. Get the token
4. Create a channel and add the bot as admin

## Discord

1. Go to Server Settings > Integrations > Webhooks
2. Create webhook and copy URL

## Bluesky

1. Go to Settings > App Passwords
2. Create new app password
3. Use your handle (e.g., user.bsky.social)

## Mastodon

1. Go to Preferences > Development
2. Create new application
3. Copy access token

## Facebook Pages

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create app with Pages permissions
3. Generate Page Access Token

## Medium

1. Go to [medium.com/me/settings](https://medium.com/me/settings)
2. Integration tokens > Get integration token

## Hashnode

1. Go to [hashnode.com/settings/developer](https://hashnode.com/settings/developer)
2. Generate Personal Access Token

## Product Hunt

1. Go to [producthunt.com/v2/oauth/applications](https://www.producthunt.com/v2/oauth/applications)
2. Create application
3. Get Access Token

## Pinterest

1. Go to [developers.pinterest.com](https://developers.pinterest.com)
2. Create app
3. Get Access Token with pins:read and pins:write scopes

## Threads

1. Requires an Instagram Business or Creator account
2. Go to [developers.facebook.com](https://developers.facebook.com)
3. Create an app with Threads permissions
4. Generate Access Token via Graph API
5. Get your Threads User ID

## YouTube

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable YouTube Data API v3
3. Create OAuth 2.0 credentials (Client ID and Secret)
4. Generate a Refresh Token via OAuth flow
5. Required scopes: `https://www.googleapis.com/auth/youtube`

## TikTok

1. Go to [TikTok for Developers](https://developers.tiktok.com)
2. Create an app with Content Posting API access (requires business verification)
3. Generate Access Token via OAuth flow
4. Note: Video uploads only - text-only posts not supported

## Hacker News

- **No API key required**
- The public Firebase API is used for reading analytics
- Submissions require manual posting at [news.ycombinator.com/submit](https://news.ycombinator.com/submit)

## Quora

- **No public API available**
- Content is prepared for manual posting
- Post manually at [quora.com](https://quora.com)

## IndieHackers

- **No public API available**
- Content is prepared for manual posting
- Post manually at [indiehackers.com](https://indiehackers.com)

## Substack

- **No public API available**
- Content is prepared for manual posting
- Use your Substack publication editor directly

---

## Environment Variables Reference

Create a `.env` file with the following variables:

```env
# OpenAI (required for content generation)
OPENAI_API_KEY=your_openai_api_key

# Twitter/X
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_secret

# LinkedIn
LINKEDIN_ACCESS_TOKEN=your_token
LINKEDIN_PERSON_ID=your_person_id

# Reddit
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password

# Dev.to
DEVTO_API_KEY=your_api_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=your_channel_id

# Discord
DISCORD_WEBHOOK_URL=your_webhook_url

# Bluesky
BLUESKY_HANDLE=your.handle.bsky.social
BLUESKY_APP_PASSWORD=your_app_password

# Mastodon
MASTODON_INSTANCE=https://mastodon.social
MASTODON_ACCESS_TOKEN=your_token

# Facebook
FACEBOOK_PAGE_ACCESS_TOKEN=your_token
FACEBOOK_PAGE_ID=your_page_id

# Medium
MEDIUM_ACCESS_TOKEN=your_token

# Hashnode
HASHNODE_TOKEN=your_token
HASHNODE_PUBLICATION_ID=your_publication_id

# Product Hunt
PRODUCTHUNT_ACCESS_TOKEN=your_token

# Pinterest
PINTEREST_ACCESS_TOKEN=your_token
PINTEREST_BOARD_ID=your_board_id

# Threads
THREADS_ACCESS_TOKEN=your_token
THREADS_USER_ID=your_user_id

# YouTube
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token

# TikTok
TIKTOK_ACCESS_TOKEN=your_token
```
