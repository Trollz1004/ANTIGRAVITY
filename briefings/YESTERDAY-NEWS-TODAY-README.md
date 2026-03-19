# Yesterday's News Today - YouTube Automation Bot

**Location:** 9020 node (DESKTOP-UPSJEVG)  
**Authority:** Josh Coleman  
**Date:** 2026-03-19  
**Purpose:** Automated daily news recap content for YouTube

---

## Overview

This bot generates daily "Yesterday's News Today" content for YouTube. It:

1. Fetches yesterday's headlines from news sources
2. Generates a script and video project
3. Posts to YouTube Community tab (or uploads video when ready)
4. Runs on 9020 as a scheduled task

---

## File Structure

```
C:\Antigravity\scripts\yesterday-news-today.py          # Main bot
C:\Antigravity\scripts\start-yesterday-news.bat        # Manual startup
C:\Antigravity\scripts\setup-yesterday-news-scheduler.ps1  # Task scheduler setup
C:\Antigravity\logs\yesterday-news-today.log           # Execution log
C:\Antigravity\data\yesterday-news\content\           # Generated content
C:\Antigravity\data\yesterday-news\archive\             # Archived content
C:\Antigravity\data\yesterday-news\state.json           # Bot state
```

---

## Installation on 9020

### Step 1: Deploy files to 9020

From Sabretooth, copy files via SSH:

```powershell
# Copy bot script
scp C:\ANTIGRAVITY\scripts\yesterday-news-today.py 9020:C:\Antigravity\scripts\

# Copy startup script
scp C:\ANTIGRAVITY\scripts\start-yesterday-news.bat 9020:C:\Antigravity\scripts\

# Copy scheduler setup
scp C:\ANTIGRAVITY\scripts\setup-yesterday-news-scheduler.ps1 9020:C:\Antigravity\scripts\
```

### Step 2: Create directories on 9020

```powershell
ssh 9020 "mkdir C:\Antigravity\logs 2>nul & mkdir C:\Antigravity\data\yesterday-news\content 2>nul & mkdir C:\Antigravity\data\yesterday-news\archive 2>nul"
```

### Step 3: Set up scheduled task (run on 9020)

```powershell
ssh 9020 "powershell -ExecutionPolicy Bypass -File C:\Antigravity\scripts\setup-yesterday-news-scheduler.ps1"
```

Or run locally on 9020:

```powershell
.\setup-yesterday-news-scheduler.ps1
```

---

## Manual Operation

### Run once (generate content):

```powershell
ssh 9020 "cd C:\Antigravity\scripts && python yesterday-news-today.py --mode generate"
```

Or on 9020 directly:

```cmd
C:\Antigravity\scripts\start-yesterday-news.bat
```

### Run with publish:

```powershell
ssh 9020 "cd C:\Antigravity\scripts && python yesterday-news-today.py --mode publish"
```

---

## Configuration

### News Sources

Edit `yesterday-news-today.py` and update the `fetch_news()` method:

```python
def fetch_news(self):
    # Current behavior:
    # 1. NewsAPI via NEWSAPI_KEY in C:\ANTIGRAVITY\.env
    # 2. RSS fallback (Reuters / BBC / AP)
```

Add this to `C:\ANTIGRAVITY\.env` on the node that runs the bot:

```env
NEWSAPI_KEY=
```

### Schedule

Default: Daily at 6:00 AM

To change, edit the scheduled task:

```powershell
$Trigger = New-ScheduledTaskTrigger -Daily -At "YOUR_TIME"
```

---

## Integration with Social Engine

The bot uses the existing `YouTubePoster` from `social_engine/platforms/`:

```python
from platforms.youtube_poster import YouTubePoster
poster = YouTubePoster()
poster.post(text=content, image_path=image)
```

Requires browser login session for YouTube (run `daemon-login.py` first).

---

## Status

| Component | Status |
|-----------|--------|
| Bot script | ✅ Created on Sabretooth |
| Scheduler | ✅ Ready to deploy |
| Manual runner | ✅ Ready to deploy |
| Deployed to 9020 | ⏳ Pending |
| Scheduled task | ⏳ Pending |
| News API integration | ✅ NewsAPI + RSS fallback wired |

--- 

## Next Steps

1. Deploy files to 9020
2. Set up NewsAPI.org or RSS feed integration
3. Configure YouTube login credentials
4. Run initial test
5. Enable scheduled execution

---

**Authority:** Josh Coleman  
**Last Updated:** 2026-03-19
