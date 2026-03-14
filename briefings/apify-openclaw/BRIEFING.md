# Apify + OpenClaw Integration Briefing

Updated: 2026-03-14
Workspace: `C:\ANTIGRAVITY`
Branch: `main`
Role: Cost-efficient data intelligence layer — replaces Grok API for trend research and content seeding

---

## Why This Exists

xAI Grok API costs accumulated faster than expected.  
The root cause: using Grok (a premium inference API) for tasks that **do not require LLM inference at all** — web data gathering, trend monitoring, competitor scanning.

**The fix is architectural:**
- **Scraping/data tasks** → Apify (cloud actors, ~$0/month on free tier)
- **Content generation from scraped data** → Ollama `qwen2.5:7b` local (free)
- **Grok stays in OpenClaw for adversarial audits only** — rare, bounded, controlled

---

## What is Apify?

Apify is an open-source-friendly web scraping and automation platform hosted at [apify.com](https://apify.com).  
GitHub: [github.com/apify](https://github.com/apify)  
MCP Server: [github.com/apify/actors-mcp-server](https://github.com/apify/actors-mcp-server)

**Key concept — Actors:**  
Pre-built, maintained scrapers for any platform. You call them via API; they return structured JSON. No browser, no Playwright, no rate limit headaches.

**Free tier:** $5/month in compute credits, resets monthly. No card required.  
At $0.50/1,000 tweets: free tier = ~10,000 tweets/month. More than enough for ANTIGRAVITY.

---

## MCP Integration (Added to `.vscode/mcp.json`)

The Apify MCP server exposes all Apify actors as tools callable from Claude Code, OpenClaw, and any MCP-compatible client.

```json
"apify": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@apify/actors-mcp-server"],
  "env": { "APIFY_TOKEN": "${env:APIFY_TOKEN}" }
}
```

`APIFY_TOKEN` is loaded from the shell environment (set from `.env` vault before launching VS Code / OpenClaw).  
Get yours at [console.apify.com](https://console.apify.com) → Settings → Integrations → API tokens.

---

## Key Actors for ANTIGRAVITY

| Actor | Apify ID | Use Case | Cost |
|---|---|---|---|
| Twitter/X Scraper | `xtdata/twitter-x-scraper` | Trending dating/AI topics, competitor hashtags | $0.50/1k tweets |
| X Trends Scraper | `eunit/x-twitter-trends-scraper` | Real-time trending topics by geo | Compute units |
| Reddit Scraper | `trudax/reddit-scraper` | r/dating, r/OnlineDating, r/antiAI discussions | Compute units |
| Google Trends | `lude/google-trends-scraper` | Trending search queries | Compute units |
| Instagram Scraper | `apify/instagram-scraper` | Competitor hashtag content | $0.50/1k posts |

All are callable via `apify_content_scout.py` or directly via MCP tool call.

---

## Content Scout Architecture

```
Apify Actors (cloud, ~$0/mo)
    ↓ structured JSON trends
scripts/apify_content_scout.py
    ↓ prompts with trend context
Ollama qwen2.5:7b (local, free)
    ↓ generated posts
data/post-queue.json
    ↓ 
Social Engine (posts to 24 platforms)
```

**Old flow:** Grok API → paid per token → quickly expensive  
**New flow:** Apify scrape ($0) + Ollama generate ($0) = $0/month

---

## OpenClaw Node Mapping

| Node | Model | Role | Apify Impact |
|---|---|---|---|
| Orchestrator | Grok 4.20 | Central brain | NO CHANGE — orchestration only, not content research |
| Deployer | Grok 4.1 Fast | Deploy apps | NO CHANGE — no content tasks |
| Platforms | Grok 4.1 Fast | ClawX, YouAndINotAI | OFFLOAD: trend research → Apify Scout |
| Shriners | Grok 4.1 Fast | Protocol Omega | NO CHANGE — governance only |

Only the **Platforms** node was doing content/trend research via Grok. That task is now offloaded.

---

## Task Routing Change

| Before | After |
|---|---|
| Grok (OpenClaw) → gather trending topics → generate content | Apify Scout → gather trends → Ollama → generate content |
| Cost: $$ per 1k tokens | Cost: $0 |
| Grok reserved for: adversarial audits, architecture pressure tests | Grok reserved for: adversarial audits, architecture pressure tests (same, now respected) |

---

## Automated Scout Schedule

`apify_content_scout.py` is designed to run:
- **Daily at 6 AM** via Windows Task Scheduler or systemd cron
- Fills `data/post-queue.json` with ~30 fresh posts per run
- Social engine then distributes them across the day

Set up as scheduled task:
```powershell
$action = New-ScheduledTaskAction -Execute 'python' -Argument 'C:\ANTIGRAVITY\scripts\apify_content_scout.py'
$trigger = New-ScheduledTaskTrigger -Daily -At "06:00AM"
Register-ScheduledTask -TaskName "ANTIGRAVITY-ApifyScout" -Action $action -Trigger $trigger -RunLevel Highest
```

Or Linux systemd timer (T5500):
```bash
# /etc/systemd/system/apify-scout.timer
[Timer]
OnCalendar=*-*-* 06:00:00
Persistent=true
```

---

## Setup Checklist

1. [ ] Create free Apify account at [console.apify.com](https://console.apify.com)
2. [ ] Generate API token → add as `APIFY_TOKEN` to master vault
3. [ ] `npx @apify/actors-mcp-server` — test MCP connection from Claude Code
4. [ ] `python scripts/apify_content_scout.py --dry-run` — test scrape without posting
5. [ ] `python scripts/apify_content_scout.py` — run full scout, inspect `data/post-queue.json`
6. [ ] Schedule daily run (Task Scheduler or cron)

---

## Hard Rules

1. Do not use Grok API for content research — Apify + Ollama only
2. Do not send PII to Apify — only public social media queries
3. Apify token goes in vault `.env` only, never in source
4. Free tier is sufficient — do not upgrade to paid without Josh approval
5. If Apify is down, fall back to caption bank — never fall back to Grok API

---

## Iron Wall Compliance

Apify data gathering is used exclusively for **ENIGMA** (YouAndINotAI, OnlineRecycle.org) marketing.  
It must never be used to gather data for **OMEGA** (charity-only surfaces).

---

*Briefing authored 2026-03-14 | Replaces unsustainable Grok API content loop*
