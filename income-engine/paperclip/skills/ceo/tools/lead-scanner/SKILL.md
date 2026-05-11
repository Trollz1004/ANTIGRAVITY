---
name: "lead-scanner"
description: "CEO tool: trigger FETCHER scan and surface qualified leads to Joshua."
version: "1.0.0"
category: "ceo"
---

# Lead Scanner Tool

## Purpose
CEO triggers a FETCHER scan, receives results, formats the top pick, and delivers it to Joshua via Workspace chat.

## Rules
1. Trigger via tRPC: fetcher.scanForLeads mutation
2. Wait for result — do not fake or estimate lead counts
3. If 3+ qualified: format top pick with title, budget, source, URL, posted time
4. If 0 qualified: report honestly — don't inflate numbers
5. Log scan result to .logs/fetcher-scan.log

## Inputs
- Manual trigger from Joshua ("scan for leads")
- Scheduled trigger from CEO heartbeat (every 30 min auto-scan)

## Outputs
```
FETCHER REPORT — {timestamp}
Total scanned: {N}
Qualified: {N} (budget ≥$50, posted ≤4h ago)

TOP PICK:
  Title: {title}
  Budget: ${budget}
  Source: {reddit_forhire|upwork|fiverr}
  URL: {url}
  Posted: {time_ago}
```

## Sources
- Reddit r/forhire (no key required)
- Reddit r/websiteservices (no key required)  
- Upwork (requires UPWORK_API_KEY in .env)
- Fiverr (requires FIVERR_API_KEY in .env)
