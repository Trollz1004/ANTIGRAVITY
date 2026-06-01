# Marketing & Branding Campaign Plan — Date App + DAO Launch

**Date**: 2026-06-01  
**Goal**: Fastest path to first accepted payment using existing social platform APIs and already-built integrations  
**Foundation**: #UntilNoKidInNeed — every dollar routes 10% to kids mission

---

## PHASE 1: FASTEST PATH TO FIRST PAYMENT (Days 1-3)

### Payment Flow (ALREADY LIVE)
Square is the live, working payment gateway with 5 tiers already configured:

| Fastest-Path Tier | Price | Square Link | Close Rate |
|---|---|---|---|
| Bot-Shield Verification | $1 | https://square.link/u/Qc5mxUy7 | HIGHEST — low barrier |
| Founding Member | $14.99/mo | https://square.link/u/cxwjcn0s | HIGH — value prop clear |
| 3-Month Founder | $39.99 | https://square.link/u/oY7qEfRM | MEDIUM |
| 12-Month Founder | $99.99 | https://square.link/u/6GHpbvvl | MEDIUM |
| Royalty Card | $2,500 | https://square.link/u/CafhorUS | LOW volume, HIGH value |

**Conversion URL**: https://youandinotai.com (membership section)
**Payment Gateway**: Square (live, sandbox-tested, webhook-enabled)
**Action**: NO new payment infrastructure needed. Square is already configured and live.

---

## PHASE 2: MARKETING CAMPAIGN BY PLATFORM

### TIER 0 — IMMEDIATE (No API credentials needed, browser automation works today)

#### X / Twitter (@YouAndiNotAi) — PRIMARY CHANNEL
- **Method**: Browser automation (Playwright) via social_engine
- **Schedule**: 6 posts/day at 7AM, 9AM, 12PM, 3PM, 6PM, 9PM EST
- **Rate limit**: 50/day max, 15-min minimum interval
- **Campaign actions**:
  1. DAO launch announcement thread (4-part thread with price tiers)
  2. Founding member urgency posts ("93 of 100 spots remaining")
  3. V8 Cloud Verification value prop ("every profile verified, 0 bots")
  4. Founder story: electrician-to-developer arc
  5. #UntilNoKidInNeed mission messaging (compliant phrasing)
  6. Quote tweets of engagement, community highlights
- **Content source**: Opus queue + caption bank fallback
- **Link in posts**: youandinotai.com membership page

#### Instagram (YouAndiNotAi)
- **Method**: Browser automation (Playwright)
- **Schedule**: 2 posts/day at 9AM, 6PM EST
- **Rate limit**: 5/day, 60-min interval
- **Campaign actions**:
  1. Carousel posts: countdown series (use existing countdown-97 assets)
  2. Hero image posts (use existing marketing-assets/social content)
  3. Stories with "Link in bio" CTA → youandinotai.com
  4. Reel: founder story (use existing grok video asset)
  5. Mission impact visuals with compliant messaging
- **Content source**: Pre-built Instagram feed templates (7 images exist)

#### Facebook
- **Method**: Browser automation
- **Schedule**: 2 posts/day at 10AM, 4PM EST
- **Rate limit**: 5/day, 60-min interval
- **Campaign actions**:
  1. Community-focused posts (longer format works on FB)
  2. Event announcements for virtual launch
  3. Group engagement in relevant Facebook groups
  4. Share Instagram content natively

#### Reddit
- **Method**: Browser automation
- **Schedule**: 2 posts/day at 10AM, 4PM EST
- **Rate limit**: 5/day, 4-hour interval
- **Target subreddits**: dating, OnlineDating, datingapps, SideProject, startups, buildinpublic, indiehackers
- **Campaign actions**:
  1. Founder story posts (genuine, value-first, not promotional)
  2. "How I built a dating app that verifies every user" (technical angle)
  3. Build-in-public updates
  4. Community feedback requests

### TIER 1 — RAPID ACTIVATION (API credentials needed but integration exists)

#### Bluesky
- **Method**: API (already built in social_engine)
- **Schedule**: 3 posts/day at 8AM, 1PM, 7PM
- **Credential needed**: BLUESKY_HANDLE + APP_PASSWORD
- **Campaign actions**: Cross-post Twitter content, tech community engagement

#### Mastodon
- **Method**: API
- **Schedule**: 3 posts/day at 9AM, 2PM, 8PM
- **Credential needed**: MASTODON_ACCESS_TOKEN + INSTANCE
- **Campaign actions**: Open-source community posts, privacy-focused angle

#### Telegram
- **Method**: API (TELEGRAM_BOT_TOKEN already exists)
- **Schedule**: 2 posts/day at 10AM, 6PM
- **Campaign actions**: DAO launch announcements, community updates, direct channel to early adopters

#### Discord
- **Method**: API
- **Schedule**: 2 posts/day at 11AM, 5PM
- **Credential needed**: DISCORD_BOT_TOKEN
- **Campaign actions**: Community building, early adopter channel

### TIER 2 — SCHEDULED AFTER TIER 0/1 LIVE

#### LinkedIn
- **Method**: Browser automation
- **Schedule**: 1 post/day at 9AM (weekdays only)
- **Campaign actions**: Founder story, industry commentary, build-in-public

#### Pinterest
- **Method**: Browser automation
- **Schedule**: 3 posts/day at 8AM, 1PM, 8PM
- **Campaign actions**: Infographic pins, lifestyle content

#### TikTok
- **Method**: Browser automation
- **Schedule**: 1 post/day at 7PM
- **Campaign actions**: Short-form video, founder story clips

#### Threads
- **Method**: Browser automation
- **Schedule**: 2 posts/day at 11AM, 7PM
- **Campaign actions**: Casual conversation, behind-the-scenes

---

## PHASE 3: DAO LAUNCH CAMPAIGN SPECIFICS

### DAO Token Sale Messaging
- **Tokens**: $LOVE, $UKID, $GREEN, $AGRAV (as defined in constants.ts)
- **Messaging**: "Contractual revenue disbursement" — NEVER "donate/donation/solicitation"
- **Link**: https://dashboard.aidoesitall.website (DAO Launch surface)

### Sequential Campaign (7-day push)

**DAY 1 — PREVIEW**
- Twitter thread: "Something's coming. A dating app that actually verifies people. And 10% of every dollar goes to kids."
- Instagram story: Teaser graphic + countdown
- Telegram: "DAO launch incoming — founding members get first access"

**DAY 2 — FOUNDER STORY**
- Reddit: "I was an electrician for 10 years. Now I built a dating app that verifies every single person."
- LinkedIn: Founder story long-form post
- Twitter thread: Origin story arc

**DAY 3 — PROBLEM STATEMENT**
- Twitter: "94% of dating profiles have inaccurate info. We built 8-layer verification."
- Instagram: V8 Cloud Verification explainer carousel
- Facebook: Community discussion post about dating app trust

**DAY 4 — MISSION MESSAGE**
- All platforms: "10% of every dollar supports youth programs. Not a charity — a business that gives back."
- Twitter thread: #UntilNoKidInNeed mission explainer (compliant phrasing)
- Telegram: Mission details + DAO token sale info

**DAY 5 — FOUNDING MEMBER PUSH**
- Twitter: "93 founding member spots left. $14.99/mo locked forever."
- Instagram: Founding member benefits carousel
- Reddit: r/buildinpublic milestone update

**DAY 6 — DAO LAUNCH**
- Twitter thread: Full DAO launch announcement ($LOVE, $UKID, $GREEN, $AGRAV)
- Telegram: DAO token sale live notification
- All platforms: Link to dashboard.aidoesitall.website

**DAY 7 — CONVERSION PUSH**
- All platforms: "First week results + still time to become a founding member"
- Instagram: User testimonials / early adoption metrics
- Twitter: Engagement with community, Q&A

---

## PHASE 4: #UntilNoKidInNeed MESSAGING INTEGRATION

### Compliant Phrasing (DO NOT VIOLATE)
- ✅ "10% of every dollar supports youth programs through contractual revenue disbursement"
- ✅ "Built-in support for youth programs"
- ✅ "We're not a charity, but we do support kids as part of our mission"
- ✅ "Contractual revenue sharing for good"
- ❌ "Donate" / "Donation" / "Solicitation" (FL §496.405 violations)
- ❌ "Charity" as self-description

### Message Placement
1. **Bio/Profile sections**: All social accounts include mission reference
2. **Every tweet/post**: At least 1 compliant mission reference per post
3. **Payment pages**: Square checkout pages display mission language
4. **Email sequences**: Welcome email includes mission messaging
5. **DAO token descriptions**: Include mission alignment language

### Fund Routing Verification
- **Square payments**: Route to business bank account
- **100-Cent Rule applied**: 10% → Kids Bucket, 27% → Tax Reserve, 63% → Ops/Growth
- **Verification**: Transparency API at `/api/transparency` (currently stub — needs live data feed)
- **End-to-end**: Square webhook → backend → revenue_allocation.py splits per 100-Cent Rule

---

## EXECUTION PRIORITY

1. **IMMEDIATE (Today)**: Fill Opus post queue with 7-day campaign content
2. **IMMEDIATE**: Start social_engine daemon for Twitter + Instagram + Facebook
3. **Day 1-2**: Activate Bluesky + Telegram API posting
4. **Day 3-4**: Add Reddit + LinkedIn content pipeline
5. **Day 5-7**: Full 23-platform activation as credentials become available
6. **Ongoing**: Monitor Square payment webhooks → track conversion from social posts