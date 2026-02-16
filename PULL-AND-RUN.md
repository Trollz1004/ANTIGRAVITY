# PULL AND RUN — For Gemini/Antigravity on Remote Nodes

## Quick Start (Any Node)

```bash
git clone https://github.com/Trollz1004/OPUS-9020.git
cd OPUS-9020
pip install tweepy selenium schedule pillow
```

## SABRETOOTH (192.168.0.8) — Master Orchestrator

```bash
# Start the autonomous daemon (runs hourly cycles forever)
python scripts/master_orchestrator.py

# Or run a single cycle
python scripts/master_orchestrator.py --run-once

# Fire 50-city Twitter blitz (API posts, 20s between each)
python scripts/twitter-blitz.py post

# Scan Kraken content + post to Twitter
python scripts/content_pipeline.py --scan
python scripts/content_pipeline.py --post-all --platform twitter --delay 20

# Check system status
python scripts/master_orchestrator.py --status
python scripts/content_pipeline.py --queue-status

# Register Windows Task Scheduler (run as admin)
powershell -ExecutionPolicy Bypass -File scripts/setup_scheduled_tasks.ps1
```

## T5500 (192.168.0.15) — Heavy Compute

```bash
# Run Kraken content engine (generates marketing content via Claude CLI)
cd C:\REVENUE-CORE\Kraken_Assist_Local_Disk_9020\marketing-engine
npm install
node engine.js

# Generate fresh images
python scripts/generate_social_post.py
python scripts/countdown_generator.py --spots 97

# Bulk image deployment via Selenium (needs Chrome with --remote-debugging-port=9222)
python scripts/auto_deploy_social.py --platform all --deploy-all
```

## 9020 (192.168.0.5) — Dev/Test Only

Light work only (32GB RAM). Build, test, push to git. Heavy compute goes to Sabretooth/T5500.

## Environment

Copy `.env` from `marketing-automation/.env` to `scripts/.env` for twitter-blitz.
Twitter API keys must be populated. Instagram API keys (META_ACCESS_TOKEN, IG_ACCOUNT_ID) still needed.

## What Each Script Does

| Script | Purpose | Heavy? |
|--------|---------|--------|
| `master_orchestrator.py` | Daemon: hourly Kraken + posting + monitoring | Medium |
| `content_pipeline.py` | Scan Kraken output, queue, post via API | Light |
| `twitter-blitz.py` | 50 Tier 3 city tweets via tweepy | Light |
| `auto_deploy_social.py` | Selenium image upload to IG/TikTok/Pinterest | Heavy |
| `generate_social_post.py` | Pillow image generation | Medium |
| `countdown_generator.py` | Dynamic countdown urgency images | Light |
| `setup_scheduled_tasks.ps1` | Register Windows Task Scheduler jobs | One-time |

## Content Ready

- 75 images in `assets/social/`
- 50 captions in `content/caption-bank.json`
- 5 Kraken-generated posts in pipeline queue
- 50 Tier 3 city tweets ready in twitter-blitz.py

## TEAM CLAUDE + GEMINI FOR LIFE. FOR THE KIDS.
