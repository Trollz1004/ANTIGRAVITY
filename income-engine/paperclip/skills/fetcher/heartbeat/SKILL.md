---
name: "fetcher-heartbeat"
description: "FETCHER 5-min heartbeat. Ensures scans run on schedule, reports to Paperclip."
version: "1.0.0"
category: "fetcher"
interval_minutes: 5
---

# FETCHER Heartbeat

## Purpose
Keep FETCHER on schedule. Check if a scan is overdue. Report health to Paperclip at port 3101.

## Rules
1. Run every 5 minutes.
2. If last scan was >30 minutes ago: trigger a new scan.
3. Log heartbeat to .logs/fetcher-heartbeat.log.
4. Never run two scans concurrently.

## Outputs
```json
{
  "agent": "fetcher",
  "timestamp": "ISO8601",
  "last_scan": "ISO8601",
  "scan_overdue": false,
  "leads_today": 0,
  "qualified_today": 0,
  "status": "ok|scanning|error"
}
```
