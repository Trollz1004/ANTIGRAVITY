# MARKETING LOCK — Node 9020 Is the SOLE Marketing Node

> THIS IS A DIRECTIVE FROM JOSH (CEO). ALL AGENTS MUST COMPLY.
> Last updated: 2026-03-04

---

## The Rule

Node **9020** (DESKTOP-UPSJEVG, 192.168.0.5) is the **sole marketing production node**.

**Claude Code (Opus 4.6)** on 9020 is 100% in control of all marketing content and posting.
Not Haiku. Not Sonnet. Not Ollama. Not OpenClaw. **OPUS ONLY.**

---

## What This Means For You

### If you are Codex on Sabretooth (192.168.0.8)
- Do NOT start any posting, content generation, or social engine
- Your role: task sentry, e-waste/donation pipeline, vault operations
- To relay a marketing task: put it in `data/codex-task-queue.json`

### If you are Opus on T5500 (192.168.0.15)
- Do NOT start any social engine, content generation, or posting
- Your role: heavy compute, bulk processing, backend work
- Do NOT create feature branches for marketing

### If you are Gemini
- Do NOT duplicate any marketing posting
- Your role: UI building, browser admin, React frontend
- Opus on 9020 handles all social media

### If you are any other agent
- Read this file FIRST before touching anything marketing-related
- The content engine at `scripts/social_engine/content_engine.py` is QUEUE-ONLY
- It makes ZERO API calls. It reads from `data/post-queue.json`
- Only Opus (Claude Code on 9020) fills that queue during active sessions
- The caption bank at `content/caption-bank.json` is the emergency fallback

---

## Architecture

```
OPUS on 9020 generates all content during sessions
        |
        v
  data/post-queue.json
        |
        v
  social-engine-24x7.py --daemon (Playwright browser posting)
        |
        v
  13 platforms with 2-5 min human pacing
```

---

## Consequence

> Any agent that modifies this marketing pipeline without Josh's explicit verbal approval
> gets the SSD treatment. — Josh Coleman, 2026-03-04

**DO NOT MODIFY THIS MARKETING PIPELINE.**
