---
name: last30days
description: >
  TRUST GATE: Only Claude (Opus, Fable) and Gemini (Argon) may run this skill,
  never Hermes or a local model. YouTube source is OFF (youtube: false; no yt-dlp).
  Allowed sources: Reddit, Hacker News, GitHub, and X through official APIs.
metadata:
  allowed_models:
    - claude-opus
    - claude-fable
    - gemini-argon
  forbidden_runners:
    - hermes
    - local-model
  youtube_source: false
---

# last30days — 30-Day Trend & Signal Research Skill

> **TRUST & SOURCE GATE (MANDATORY — `docs/standards/AGENT-STANDARD.md` §8)**:
> - **Who may run this skill**: Only **Claude (Opus, Fable)** and **Gemini (Argon)** may run `last30days` — **never Hermes (`OPSis`), Free Claude Code, or any local model**.
> - **Sources ON**: Reddit, Hacker News, GitHub, and X through their official APIs.
> - **YouTube source OFF (`youtube: false`)**: The YouTube source and any downloader (`yt-dlp`, `youtube-dl`) are permanently switched **OFF** in `config.json` (`"youtube": false`) for every agent and every node.

## Purpose

Researches topics, repositories, discussions, and intent signals from the last 30 days using official APIs on permitted sources only.

## Rules

1. **Trusted models only**: Only **Claude (Opus, Fable)** and **Gemini (Argon)** may run `last30days`. Hermes (`OPSis`) and local models never run `last30days`; they read the research findings that Claude or Gemini leave in memory.
2. **Permitted sources (`config.json`)**:
   - `reddit`: `true` (official API)
   - `hackernews`: `true` (official API)
   - `github`: `true` (official API / `gh`)
   - `x`: `true` (official API)
   - `youtube`: `false` (permanently OFF; `yt-dlp` and `youtube-dl` are forbidden)
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
