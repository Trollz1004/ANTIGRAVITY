# Social Platform Command Center — API & Integration Audit

**Date**: 2026-06-01  
**Scope**: All existing social platform dashboard APIs and already-built integrations  
**Status**: Complete audit of repo at C:\ANTIGRAVITY

---

## 1. Command Center Dashboard (apps/command-center)

### Platform Registry (lib/data.ts)
The canonical platform registry used by the Command Center UI. 24 platforms defined across 5 types.

| ID | Label | Type | Claw | API | URL | Auth Status |
|---|---|---|---|---|---|---|
| youtube | YouTube | social | GeminiClaw | YouTube Data API v3 | studio.youtube.com | NEEDS KEY |
| instagram | Instagram | social | MetaClaw | Meta Graph API | instagram.com | NEEDS KEY |
| facebook | Facebook | social | MetaClaw | Meta Graph API | business.facebook.com | NEEDS KEY |
| tiktok | TikTok | social | GensparkClaw | TikTok Content API | tiktok.com/creator-center | NEEDS KEY |
| twitter | X / Twitter | social | ClaudeClaw | X API v2 | x.com/compose/post | NEEDS KEY |
| linkedin | LinkedIn | social | ClaudeClaw | LinkedIn Marketing API | linkedin.com/feed | NEEDS KEY |
| reddit | Reddit | social | OpenClaw | Reddit API v1 | reddit.com/submit | NEEDS KEY |
| pinterest | Pinterest | social | GensparkClaw | Pinterest API v5 | pinterest.com/pin-creation-tool | NEEDS KEY |
| ebay | eBay | commerce | HEMORzoid | eBay Browse API | ebay.com/sh/overview | NEEDS KEY |
| square | Square | commerce | HEMORzoid | Square Commerce API | squareup.com/dashboard | HAS TOKEN (SQUARE_ACCESS_TOKEN) |
| mercari | Mercari | commerce | HEMORzoid | Mercari API | mercari.com/sell | NEEDS KEY |
| fbmkt | FB Marketplace | commerce | MetaClaw | Meta Graph API | facebook.com/marketplace | NEEDS KEY |
| telegram | Telegram | dispatch | ClawdBot | Telegram Bot API | web.telegram.org | HAS TOKEN (TELEGRAM_BOT_TOKEN) |
| whatsapp | WhatsApp | dispatch | MetaClaw | WhatsApp Business API | web.whatsapp.com | NEEDS KEY |
| cloudflare | Cloudflare | infra | Wrangler | CF Pages + Workers | dash.cloudflare.com | HAS CREDENTIALS |
| gcp | GCP / GCR | infra | Codex | GCP Cloud Run | console.cloud.google.com | NEEDS KEY |
| github | GitHub | infra | Codex | GitHub API v4 | github.com | HAS PAT |

### Content Flow Architecture
- **ContentItem** model: title, body, mediaUrl, mediaType, source, targets[], tags, status (inbox/approved/rejected/sent)
- **AI Sources**: Opus, Gemini, Perplexity, Grok, Manus — these are the only content creators
- **TARGET_PLATFORMS**: All social + commerce platforms (12 targets)
- **Storage**: localStorage key `cc-items-v2` (client-side only, no server persistence)
- **Posting**: Currently MANUAL — clicking "Post Here" opens target URLs in browser tabs; no automated server-side posting

### Auth Vault (SocialCommandCenter.tsx)
UI has an "Auth & Logins" tab with key entry fields for:
- Twitter / X API: shows "connected" (hardcoded status, no actual API validation)
- LinkedIn Dev API: shows "disconnected"
- Ghost Blog Admin: shows "connected"
- Instagram Graph: shows "disconnected"

**NOTE**: Auth status in the UI is hardcoded display state, NOT a live credential check. Actual keys must be in .env or environment variables.

---

## 2. Social Engine (scripts/dashboard-aidoesitall/social_engine)

### Architecture
Full 24/7 automated social posting daemon with Playwright browser automation fallback.

| File | Purpose |
|---|---|
| social-engine-24x7.py | Main daemon loop — runs 24/7 |
| content_engine.py | Content sourcing: Opus queue → caption bank fallback |
| browser_manager.py | Playwright browser session management |
| schedule_config.py | Per-platform schedules, rate limits, content pillars |
| platforms/twitter_poster.py | X/Twitter poster (browser + API fallback via Tweepy) |
| platforms/platform_policy.py | Platform-specific compliance rules |
| generate_social_post.py | Interactive post generation script |
| apify_content_scout.py | Apify trend scraping for content queue |

### Platform Schedule (schedule_config.py)
23 platforms with defined posting cadences:

| Platform | Posts/Day | Hours (EST) | Method | Priority |
|---|---|---|---|---|
| Twitter/X | 6 | 7,9,12,15,18,21 | browser | 0 (highest) |
| Instagram | 2 | 9,18 | browser | 0 |
| Facebook | 2 | 10,16 | browser | 0 |
| Reddit | 2 | 10,16 | browser | 0 |
| Pinterest | 3 | 8,13,20 | browser | 1 |
| TikTok | 1 | 19 | browser | 1 |
| LinkedIn | 1 | 9 | browser | 1 (weekdays) |
| Threads | 2 | 11,19 | browser | 1 |
| Bluesky | 3 | 8,13,19 | API | 1 |
| Mastodon | 3 | 9,14,20 | API | 1 |
| Discord | 2 | 11,17 | API | 1 |
| Telegram | 2 | 10,18 | API | 1 |
| YouTube | 1 | 14 | browser | 2 |
| Medium | 1 | 8 | browser | 2 |
| Dev.to | 1 | 8 | API | 2 |
| Hashnode | 1 | 8 | API | 2 |
| Quora | 1 | 11 | browser | 2 |
| Product Hunt | 1 | 0 | browser | 2 |
| IndieHackers | 1 | 10 | browser | 2 |
| Substack | 1 | 8 | browser | 2 |
| Nextdoor | 1 | 10 | browser | 2 |
| eBay | 1 | 10 | browser | 1 (Mon) |

### Content Pillars (5 pillars with weights)
1. **Bot Problem** (25%) — Dating app bots/catfish angle
2. **V8 Verification** (20%) — 8-layer identity proof
3. **Founding Member** (20%) — Founding member spots at $14.99/mo
4. **Mission Clarity** (20%) — Real-human verification vs swipe addiction
5. **Launch Countdown** (15%) — Launch date countdown

### Twitter/X Specific
- **Browser method**: Playwright automation, navigates to x.com/home, finds compose box, types, clicks post
- **API method**: Tweepy (OAuth1UserHandler + Client v2) — requires TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
- **Hashtag hack**: Posts hashtags as first reply to new tweets for algorithm boost
- **Rate limit**: 50/day max, 15 min minimum interval

### Content Queue
- Primary: `data/post-queue.json` (filled by Opus sessions)
- Fallback: `content/caption-bank.json` (pre-written captions)
- No Ollama/auto-generation — Opus-only per design

---

## 3. Content Agents (content-agents/)

3 configured agents with compliance filtering:

| Agent | Platforms | Content Pillars | Frequency |
|---|---|---|---|
| Social Media Content Generator | Twitter, Instagram, Facebook | community_first, volunteer_life, real_connections, events, behind_the_scenes | 24/7 |
| Blog Content Writer | Blog (Hugo/Ghost) | education, story, behind_the_scenes, charity_update | On-demand |
| Newsletter Creator | Email newsletter | community_first, volunteer_life, real_connections, behind_the_scenes | Weekly |

All agents enforce:
- Prohibited terms filter: "donate", "donation", "solicitation"
- Replacement: "contractual revenue disbursement"
- Platform-specific hashtag limits

---

## 4. Pre-Built Content Assets

### Caption Bank (content/)
- `caption-bank.json` / `caption-bank-fresh.json` — pre-written captions per platform
- `cross-platform-caption-bank.md` — 10 content sets across Instagram, Facebook, LinkedIn, Threads, Bluesky
- `twitter-drip-all-days.md` — multi-day Twitter drip campaign
- `instagram-captions-fresh.md` — fresh Instagram ready-to-post
- `reddit-linkedin-expansion.json` — Reddit and LinkedIn content
- `whatsapp-broadcasts.md` — WhatsApp broadcast templates
- `snapchat-story-overlays.md` — Snapchat content
- `tweet-engagement-audit.md` — Twitter engagement analysis

### Marketing Assets (marketing-assets/)
- Logo set: app icon, dark/light bg, favicon, OG image, social profile, watermark
- Countdown social images: Instagram feed, Instagram story, TikTok, Twitter
- Instagram feed posts (7 template images): launch, V8 cloud, bot stat, testimonial, verification, urgency, comparison
- Video: Grok promotional video
- Generator script: `generate_all_assets.py`

### Campaign Deliverables (campaign-deliverables/q3-campaign/)
- Campaign concept, summary, growth strategy
- Messaging pillars (4 pillars)
- Social media content templates
- Items YAML (campaign goals and brand guidelines)

---

## 5. Payment Integration

### Square (LIVE — PRIMARY GATEWAY)
- **Status**: Already integrated and live
- **Backend**: `backend/fastapi-app/app/payments.py` — source of truth
- **Environment var**: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENV
- **Webhooks**: Configured for payment + booking events

| Tier | Name | Price | Square Link |
|---|---|---|---|
| bot_shield | Bot-Shield Verification | $1 one-time | https://square.link/u/Qc5mxUy7 |
| founding_member | Founding Member | $14.99/mo | https://square.link/u/cxwjcn0s |
| 3_month | 3-Month Founder | $39.99/3mo | https://square.link/u/oY7qEfRM |
| 12_month | 12-Month Founder | $99.99/12mo | https://square.link/u/6GHpbvvl |
| royalty | Royalty Card | $2,500 lifetime | https://square.link/u/CafhorUS |

### Stripe (UI shows "Connected" but no backend implementation found)
- **Status**: Frontend component exists (`antigravity/components/Integrations.tsx`) showing Stripe as "Connected"
- **Backend**: No Stripe API routes, no STRIPE_SECRET_KEY in .env
- **Reality**: Square is the live, working payment gateway. Stripe is UI-only.

### Frontend Membership Component
- `apps/youandinotai-frontend/components/Membership.tsx` — renders 5 plan cards
- All checkout links point to Square-hosted payment pages
- Plans defined in `apps/youandinotai-frontend/lib/constants.ts` synced with backend payments.py

---

## 6. Telegram Bot

- **Status**: Configured (TELEGRAM_BOT_TOKEN in .env)
- **Used for**: Hermes dispatch notifications, mission control alerts
- **Potential**: Could be used as a DAO launch announcement channel

---

## 7. Key Gaps & Blockers

### Missing API Credentials (highest priority for activation)
| Platform | Credential Needed | Impact |
|---|---|---|
| X/Twitter API | TWITTER_API_KEY + SECRET + ACCESS_TOKEN + SECRET | Required for API posting (browser mode works without) |
| Instagram Graph | META_APP_ID + ACCESS_TOKEN | Required for API posting |
| Facebook | META_APP_ID + ACCESS_TOKEN | Required for API posting |
| LinkedIn | LINKEDIN_CLIENT_ID + SECRET | Required for API posting |
| TikTok | TIKTOK_CLIENT_KEY + SECRET | Required for API posting |
| Reddit | REDDIT_CLIENT_ID + SECRET | Required for API posting |
| Pinterest | PINTEREST_APP_ID + SECRET | Required for API posting |
| Bluesky | BLUESKY_HANDLE + APP_PASSWORD | Required for API posting |
| Mastodon | MASTODON_ACCESS_TOKEN + INSTANCE | Required for API posting |

### Infrastructure Gaps
- **Command Center has no server-side posting API** — content items stored in localStorage only
- **Social Engine daemon needs browser sessions logged in** for browser-mode platforms
- **No webhook/payment -> social automation pipeline** — payments don't trigger social posts
- **Stripe not actually connected** — UI says it is but no backend exists
- **Post queue** (data/post-queue.json) must be manually filled by Opus sessions