# OpenClaw Social Readiness Report
**Date:** 2026-03-19
**Authority:** Josh Coleman
**Control Plane:** Sabretooth (http://127.0.0.1:18789)
**Mission:** API-first ENIGMA social publishing

---

## Executive Summary

OpenClaw is configured as a **dispatcher/publisher**, not a primary content writer. All content originates from approved upstream work (Perplexity, Claude/Opus, Gemini, Grok) and is routed through OpenClaw for execution, monitoring, and reporting.

**Status:** ✅ Ready for API-first publishing (dry-run mode)
**Live Posting:** ⛔ DISABLED per hard constraints
**Platform Count:** 25 platforms configured
**API-Ready:** 7 platforms
**Browser/Manual:** 18 platforms

---

## Platform Matrix

### API-Ready Lanes (No Browser Required)

| Platform | Method | Auth Type | Status | Notes |
|----------|--------|-----------|--------|-------|
| **Bluesky** | API | App Password | ✅ Ready | atproto library |
| **Mastodon** | API | Access Token | ✅ Ready | mastodon.py library |
| **Telegram** | API | Bot Token | ✅ Ready | Bot API via urllib |
| **Discord** | API | Webhook URL | ✅ Ready | Webhook via urllib |
| **Dev.to** | API | API Key | ✅ Ready | REST API |
| **Hashnode** | API | API Key + Pub ID | ✅ Ready | GraphQL API |
| **Reddit** | API/Browser | OAuth | ⚠️ Partial | PRAW if creds, else browser |

### Browser/Manual Lanes (Playwright + Login Session Required)

| Platform | Method | Login Required | Status | Notes |
|----------|--------|----------------|--------|-------|
| **Twitter/X** | Browser | Yes | ⚠️ Manual | Browser-only (API limits) |
| **LinkedIn** | Browser | Yes | ⚠️ Manual | Feed posting |
| **Instagram** | Browser | Yes | ⚠️ Manual | Image required |
| **Facebook** | Browser | Yes | ⚠️ Manual | Feed posting |
| **YouTube** | Browser | Yes | ⚠️ Manual | Community tab |
| **TikTok** | Browser | Yes | ⚠️ Manual | Upload interface |
| **Pinterest** | Browser | Yes | ⚠️ Manual | Pin creation |
| **Threads** | Browser | Yes | ⚠️ Manual | Meta platform |
| **Medium** | Browser | Yes | ⚠️ Manual | Article publishing |
| **Substack** | Browser | Yes | ⚠️ Manual | Article publishing |
| **Indie Hackers** | Browser | Yes | ⚠️ Manual | Community posts |
| **Product Hunt** | Browser | Yes | ⚠️ Manual | Discussions |
| **Quora** | Browser | Yes | ⚠️ Manual | Answer questions |
| **Nextdoor** | Browser | Yes | ⚠️ Manual | Neighborhood posts |
| **eBay** | Browser | Yes | ⚠️ Manual | Listings (products) |

### Unsupported/Unconfigured Lanes

| Platform | Reason | Action Required |
|----------|--------|-----------------|
| **Snapchat** | No API for posting | Browser-only, complex auth |
| **WhatsApp Business** | Requires Business API | Evaluate if needed |
| **X/Twitter API** | Rate limits prohibitive | Use browser mode |

---

## Credential Storage

**Location:** `C:\Users\joshl\.openclaw\social-platforms.env`
**Template:** `C:\Users\joshl\.openclaw\social-platforms.env.example`
**Security:** Local-only, never in repo, never committed

### Required Environment Variables

**API Platforms:**
- `BLUESKY_HANDLE` + `BLUESKY_APP_PASSWORD`
- `MASTODON_ACCESS_TOKEN` + `MASTODON_INSTANCE`
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_MARKETING_CHANNEL_ID`
- `DISCORD_WEBHOOK_URL`
- `DEVTO_API_KEY`
- `HASHNODE_API_KEY` + `HASHNODE_PUBLICATION_ID`
- `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` + `REDDIT_USERNAME` + `REDDIT_PASSWORD` (optional)

**Browser Platforms:**
- No env vars required
- Run `python scripts/daemon-login.py` to establish sessions
- Sessions stored in Playwright browser contexts

---

## Content Flow Architecture

```
Upstream Work (Perplexity/Claude/Gemini/Grok)
         ↓
   Content Approved
         ↓
   OpenClaw Dispatcher
         ↓
   Platform Router
    ├─ API Lane → Direct publish
    └─ Browser Lane → Playwright automation
         ↓
   Monitoring + Reporting
         ↓
   Telegram Heartbeat (Sabretooth only)
```

---

## Hard Constraints Enforcement

| Constraint | Status | Implementation |
|------------|--------|----------------|
| NO live posting | ✅ Enforced | All platforms in dry-run/report mode |
| NO outbound publishes | ✅ Enforced | Manual approval required |
| NO git push/pull | ✅ Enforced | No git ops in social scripts |
| NO vault access | ✅ Enforced | Credentials in .openclaw only |
| NO secrets in repo | ✅ Enforced | .env files gitignored |
| ENIGMA ≠ OMEGA | ✅ Enforced | Separate credential paths |
| ONE Telegram heartbeat | ✅ Enforced | Sabretooth only |

---

## Next Steps

1. **Populate credentials** in `C:\Users\joshl\.openclaw\social-platforms.env`
2. **Test API platforms** with dry-run mode
3. **Establish browser sessions** via `daemon-login.py`
4. **Verify node reachability** (see OPENCLAW-NODE-REACHABILITY-2026-03-19.md)
5. **Enable live posting** only after explicit Josh approval

---

**Report Generated:** 2026-03-19
**Source:** `C:\ANTIGRAVITY\scripts\social_engine\platforms\`
**Authority:** Josh Coleman — sole decision maker on live publishing
