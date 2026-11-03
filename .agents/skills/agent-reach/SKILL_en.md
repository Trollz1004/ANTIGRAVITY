---
name: agent-reach
description: >
  TRUST GATE: Only Claude (Opus, Fable) and Gemini (Argon) may run this skill,
  never Hermes or a local model. YouTube source is OFF (youtube: false; no yt-dlp).
  Allowed sources: Reddit, Hacker News, GitHub, and X through official APIs.
metadata:
  homepage: https://github.com/Panniantong/Agent-Reach
  allowed_models:
    - claude-opus
    - claude-fable
    - gemini-argon
  forbidden_runners:
    - hermes
    - local-model
  youtube_source: false
---

# Agent Reach — internet capability router

> **TRUST & SOURCE GATE (MANDATORY — `docs/standards/AGENT-STANDARD.md` §8)**:
> - **Who may run this skill**: Only **Claude (Opus, Fable)** and **Gemini (Argon)** may run `agent-reach` — **never Hermes (`OPSis`), Free Claude Code, or any local model**.
> - **Sources ON**: Reddit, Hacker News, GitHub, and X through their official APIs.
> - **YouTube source OFF (`youtube: false`)**: The YouTube source and any downloader (`yt-dlp`, `youtube-dl`, `opencli youtube`) are permanently switched **OFF** for every agent and every node.

15 platforms, multiple backends each. **Only Claude (Opus, Fable) and Gemini (Argon) may run this skill; the YouTube source is permanently OFF (`youtube: false`).**

## Standing rules (apply for the whole session)

1. **Model gate first**: Verify you are running as an official **Claude (Opus, Fable)** or **Gemini (Argon)** session. Hermes (`OPSis`) and local models must never execute this skill.
2. **YouTube stays OFF**: Never invoke `yt-dlp`, `youtube-dl`, or `opencli youtube`. YouTube is disabled in `config.json` (`"youtube": false`).
3. **Health-check before acting**: run `agent-reach doctor --json` first for permitted sources.
4. **Announce what you use**: say "using agent-reach, platform X via backend Y" before starting.
5. **For broad research tasks**: combine permitted sources (Reddit, Hacker News, GitHub, and X through official APIs).

## Routing table

| User intent | Category | Details |
|---------|------|---------|
| Web / code search | search | [references/search.md](references/search.md) |
| Twitter / Reddit / V2EX | social | [references/social.md](references/social.md) |
| Jobs / LinkedIn | career | [references/career.md](references/career.md) |
| GitHub / code | dev | [references/dev.md](references/dev.md) |
| Web pages / articles / RSS | web | [references/web.md](references/web.md) |
| Video / podcast transcripts (YouTube OFF) | video | [references/video.md](references/video.md) |
| Xueqiu / stock quotes | finance | [references/finance.md](references/finance.md) |

## Zero-config quick commands

```bash
# Exa web search
mcporter call exa.web_search_exa query="query" numResults=5

# Read non-Google web page
curl -s "https://r.jina.ai/URL"

# GitHub search
gh search repos "query" --sort stars --limit 10

# YouTube source is OFF (youtube: false in config.json; yt-dlp is forbidden)
```
