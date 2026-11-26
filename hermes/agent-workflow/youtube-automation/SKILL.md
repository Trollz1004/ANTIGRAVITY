---
name: youtube-automation
description: "YouTube automation: upload, SEO, thumbnails, scheduling, analytics."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [youtube, automation, content, seo, scheduling]
    related_skills: [youtube-content]
---

# YouTube Automation

## When to Use

- User asks about YouTube content strategy, scheduling, or growth
- Automating video uploads, metadata, or SEO
- Creating thumbnails or optimizing titles/descriptions
- Analyzing YouTube analytics or performance

## Prerequisites

- YouTube account with upload access
- For uploads: YouTube Data API v3 credentials (optional, browser automation fallback available)
- For analytics: YouTube Analytics API access (optional)

## Workflow

### 1. Content Planning

```
1. Research trending topics in niche
2. Generate video ideas with search volume
3. Create content calendar (weekly/biweekly)
4. Script outline → full script
5. Record/edit video
6. Create thumbnail + optimize metadata
7. Upload with SEO-optimized title/description/tags
8. Schedule publish time
9. Track performance after 24h, 7d, 30d
```

### 2. SEO Optimization

- **Title**: 60 chars max, keyword front-loaded, curiosity gap
- **Description**: 200+ words, timestamps, links, keywords naturally placed
- **Tags**: 15-20 tags, mix of broad and specific
- **Thumbnail**: High contrast, 3-word max text, emotional face, 1280x720
- **First 30 seconds**: Hook + value promise + pattern interrupt

### 3. Upload via Browser Automation

Use `browser_navigate` to:
1. Go to youtube.com/upload
2. Fill title, description, tags
3. Upload video file
4. Set thumbnail
5. Set visibility (public/unlisted/private/schedule)
6. Click publish

### 4. Analytics Tracking

Track per video:
- Views, watch time, CTR%, avg view duration
- Traffic sources, impression click-through rate
- Subscriber conversion rate
- Revenue (if monetized)

## Pitfalls

- YouTube API has daily quotas (10,000 units/day)
- Browser automation slower but no API limits
- Avoid clickbait — hurts long-term retention
- Consistency > perfection in upload schedule
- First 24 hours critical for algorithm push

## Verification

- [ ] Video uploaded and visible
- [ ] Title/description within limits
- [ ] Thumbnail meets specs
- [ ] Tags relevant and within count
- [ ] Publish time scheduled correctly

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
