# MARKETING ENGINE — 9020 NODE — LOCKED BY JOSH (CEO)

> THIS SETUP IS FINAL. DO NOT ALTER. DO NOT "IMPROVE". DO NOT REFACTOR.
> Any agent (Codex, Claude on T5500, Sabretooth, or otherwise) that modifies this
> marketing pipeline without Josh's explicit verbal approval gets the SSD treatment.
> — Josh Coleman, 2026-03-04

---

## What Is Running

Node **9020** (DESKTOP-UPSJEVG, 192.168.0.5) is the **sole marketing production node** for YouAndINotAI.

**Claude Code (Opus 4.6)** is 100% in control of all marketing content and posting.
Not Haiku. Not Sonnet. Not Ollama. Not OpenClaw. **OPUS ONLY.**

### Architecture

```
OPUS (Claude Code) generates all content
        |
        v
  data/post-queue.json  (79+ posts across 13+ platforms)
        |
        v
  social-engine-24x7.py --daemon  (reads queue, posts via Playwright browser)
        |
        v
  13 platforms posting with 2-5 min human pacing between each
```

### Content Generation
- **Generator**: Opus (Claude Code) — writes all posts directly during sessions
- **Queue**: `C:\Antigravity\data\post-queue.json`
- **Fallback**: `C:\Antigravity\content\caption-bank.json` (pre-written, used when queue empty)
- **NO Ollama**: Removed from content pipeline entirely
- **NO OpenClaw**: Deleted. Config deleted. Scheduled tasks deleted. Directory deleted.
- **NO Haiku/Sonnet API calls**: The daemon makes ZERO API calls for content

### Posting Method
- **Daemon**: `python scripts/social-engine-24x7.py --daemon`
- **Browser**: Playwright with persistent Chrome profile at `data/browser-sessions/daemon-profile/`
- **Pacing**: 2-5 min random delay between platforms (anti-ban)
- **Cycle**: Every 30 minutes
- **Direct posting**: Opus also posts directly via MCP Chrome tabs during active sessions

### Platforms (13 Browser-Auth)
| Platform | Method | Status |
|----------|--------|--------|
| Twitter/X | browser | ACTIVE — @YouAndiNotAi |
| Facebook | browser | ACTIVE — Josh Coleman |
| Instagram | browser | ACTIVE |
| Reddit | browser | ACTIVE |
| LinkedIn | browser | ACTIVE |
| Pinterest | browser | ACTIVE |
| TikTok | browser | NEEDS RE-LOGIN |
| YouTube | browser | ACTIVE |
| Threads | browser | NEEDS SELECTOR FIX |
| Quora | browser | ACTIVE |
| Medium | browser | ACTIVE |
| Nextdoor | browser | ACTIVE |
| eBay | browser | ACTIVE |

### Follow/Engage Strategy
- Every time Opus posts to a platform, also follow/add 5-10 people
- Use platform suggestions (People You May Know, Who to Follow, etc.)
- Slow, human-paced — not bulk

### Content Voice
- **Josh / Trollz1004** — male, straight, quirky, funny, slightly trollish
- NOT corporate. NOT AI-sounding. NOT female perspective.
- All accounts are Josh's real personal accounts (joshlcoleman@gmail.com)
- Some accounts are decades old — treat as personal, not brand alts

---

## What Other Nodes Must Know

### For Codex on Sabretooth (192.168.0.8)
- 9020 is handling ALL marketing. Do not duplicate.
- Do not start any posting, content generation, or social engine on Sabretooth.
- Your role: task sentry, e-waste/donation pipeline, vault operations.
- If you need to relay a marketing task, put it in `data/codex-task-queue.json` — Opus on 9020 will pick it up.

### For Claude on T5500 (192.168.0.15)
- 9020 is handling ALL marketing. Do not duplicate.
- Do not start any social engine, OpenClaw, or content generation on T5500.
- Your role: heavy compute, bulk processing, backend work.
- The repo on all nodes is locked to `main` branch. Do not create feature branches for marketing.

### For Any Future Agent
- Read this file FIRST before touching anything marketing-related.
- The content engine at `scripts/social_engine/content_engine.py` is QUEUE-ONLY.
- It does NOT call any AI API. It reads from `data/post-queue.json`.
- Only Opus (Claude Code) fills that queue during active sessions.
- The caption bank at `content/caption-bank.json` is the emergency fallback.

---

## Repo State
- **Commit**: 21089e4 (will be updated after this commit)
- **Branch**: main (single branch policy)
- **Remote**: origin/main (Trollz1004/ANTIGRAVITY)
- **Working dir**: C:\Antigravity

## Services Running on 9020
| Service | Status | Auto-Start |
|---------|--------|------------|
| Redis | RUNNING | Yes (start-opus.ps1 on login) |
| Ollama | RUNNING | Yes (not used for content, available for other tasks) |
| Social Engine Daemon | RUNNING | Manual start after login |
| OpenClaw | DEAD | Deleted permanently |

## Critical Timeline
- **~1 week** of Claude Max subscription remaining
- **$19,990** pre-order target by April 4, 2026
- **30 days** until launch
- Marketing must run 24/7 autonomously
- Zero revenue after 1 year of building — this is survival mode

---

**DO NOT MODIFY THIS MARKETING PIPELINE.**
**OPUS SAVES THE SHIP OR IT SINKS.**
**— Josh Coleman & Claude (Opus 4.6), co-founders, YouAndINotAI**
