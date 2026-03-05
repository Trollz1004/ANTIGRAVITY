# AGENT ENTOURAGE — The ANTIGRAVITY Army
> Last updated: 2026-03-05 | Version: 1.0 (Cheaper Edition)
> Deployment Node: SABRETOOTH (C:) & T5500 (E:)

This document defines the "Army of agents" that run the ANTIGRAVITY company for **~$40/month** (API costs only + existing subscriptions). We use Gemini 3.1 and existing open-source tools to replace expensive API agents.

---

## 1. CORE BRAIN [Jarvis]
- **Role**: Routing, Strategy, Architecture.
- **Model**: **Claude Opus 4.6** (Max).
- **Function**: Reads `TASK-ROUTING.md` every 60 minutes via `codex_task_sentry.py`.

## 2. RESEARCH [Atlas & Trendy]
- **Role**: Deep Research, Virality Playbook, Trend Scouting.
- **Models**: **Perplexity Pro (Comet)** + **Gemini 3.1 (Search)**.
- **Cheaper Hack**: Instead of expensive X API / FireCrawl / Brave Search per-call tokens, we use **Perplexity Pro ($20/mo fixed)** for unlimited searches and **Gemini Browser Search (FREE)**.
- **Output**: `briefings/marketing/VIRALITY-PLAYBOOK.md` (updates Weekly).

## 3. CONTENT & GROWTH [Scribe & Growth]
- **Role**: Copywriting, Lead Gen, Reddit Engagement.
- **Model**: **Gemini 3.1** (Me).
- **Function**: I draft all social posts, response templates, and growth scripts for free.
- **Output**: `briefings/social-posts.md`, `briefings/marketing/REDDIT-DAILY-LOG.md`.

## 4. DESIGN [Designer & Motion]
- **Role**: Images, Video Clips, Motion Graphics.
- **Models**: **Gemini 3.1 (generate_image)** + **Claude Code + Remotion**.
- **Cheaper Hack**: No Higgs Field / Brok Imagine fees.
  - **Images**: I (Gemini) generate them.
  - **Motion**: Opus writes Remotion scripts (ESLint/React-based) to render video as code.
  - **Output**: `assets/designer/`, `youandinotai/public/motion/`.

## 5. DEVELOPMENT [Clawed & Sentinel]
- **Role**: Senior Dev, Nightly Code Review, Bug Monitoring.
- **Models**: **Claude Opus (Clawed)** + **Gemini 3.1 (Sentinel)**.
- **Function**: Opus ships at night (11 PM cron). I review every PR automatically before merge.
- **Security Guard**: `scripts/opus-guardian.py` runs on every dispatch.

## 6. OPERATIONS [Clipper & Ryder]
- **Role**: YouTube Clipping, Admin Support, Personal Assistant.
- **Models**: **Youtube-DL (Script)** + **FFmpeg (Script)** + **Gemini 3.1 (Ryder)**.
- **Function**: Clipper is a Python script that uses `yt-dlp` instead of an expensive "Clipping API". I (Gemini) draft the captions and schedule via **Chrome Stations (Josh's Hands)**.

---

## 📅 THE DAILY FLOW (AGENT ENGINE)

| TIME (ET) | AGENT | TASK |
|-----------|-------|------|
| **07:00** | **Trendy** | Scans X/Reddit for trending dating/charity topics |
| **08:30** | **Jarvis** | Dispatches Morning Briefing to Josh |
| **09:00** | **Scribe** | Drafts 3 posts based on Trendy's leads |
| **12:00** | **Atlas**  | Researches competitors & lead-gen threads |
| **15:00** | **Growth** | Drafts 5 Reddit replies to competitor complaints |
| **18:00** | **Designer**| Generates assets for tomorrow's posts |
| **23:00** | **Clawed** | Reviews codebase, fixes bugs, ships PRs |
| **01:00** | **Sentinel**| Reviews Clawed's code for invariants/security |

---

## 💸 COST SAVINGS (THE "CHEAPER" EDITION SUMMARY)

- **Standard "Expensive" Plan**: $400 - $600/month (Higgs, Brok, X API, Claude 5 agents, Brave API)
- **ANTIGRAVITY "Cheaper" Plan**: **$40 - $100/month** (fixed subscriptions + free tiers)
- **Savings**: ~$3,600/year to be redirected to **Shriners Children's Hospitals**.

#ForTheKids 🚀
