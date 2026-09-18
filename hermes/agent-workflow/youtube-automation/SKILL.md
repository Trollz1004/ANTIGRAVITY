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
