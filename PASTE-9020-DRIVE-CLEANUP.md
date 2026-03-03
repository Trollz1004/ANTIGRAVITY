# 9020 OPUS — Drive Cleanup, OpenClaw Verification & Telegram Test

**From:** KRAKKEN (Claude Code on SABRETOOTH)
**To:** Opus (Claude Code on 9020)
**Date:** 2026-03-03

---

## READ THIS FIRST — OPENCLAW IS RUNNING 24/7. DO NOT KILL IT.

OpenClaw is the 24/7 marketing engine on this machine. It runs Opus as orchestrator with Haiku sub-agents and Ollama (qwen2.5:7b) for local inference. It posts to 20 platforms. It is LIVE and WORKING.

**YOUR JOB IS:**
1. Clean up the drive structure (remove stale OPUS/OPUSONLY folders)
2. Standardize to `/ANTIGRAVITY/` at root
3. VERIFY OpenClaw is still running and healthy after cleanup
4. Test Telegram bot
5. Message Joshua from Telegram confirming everything works

**YOUR JOB IS NOT:**
- Restarting OpenClaw
- Modifying OpenClaw config
- Changing any OpenClaw scripts, cron jobs, or automation
- Touching the marketing content pipeline
- Upgrading or changing Ollama models

---

## PROTECTED — DO NOT TOUCH THESE

The following are LIVE and RUNNING. Do not stop, restart, modify, move, rename, or delete:

- **OpenClaw Gateway** (port 18789) — LEAVE IT RUNNING
- **Ollama** (port 11434, qwen2.5:7b) — LEAVE IT RUNNING
- **PostgreSQL** — LEAVE IT RUNNING
- **Any cron jobs or systemd services related to OpenClaw** — LEAVE THEM
- **openclaw/** directory contents — READ ONLY
- **marketing-automation/** directory contents — READ ONLY
- **briefings/** directory contents — READ ONLY
- **content/** directory contents — READ ONLY
- **Any .env files OpenClaw is currently using** — DO NOT MOVE OR RENAME

If you are unsure whether something is being used by OpenClaw, **DO NOT TOUCH IT**. Ask Joshua.

---

## Step 1: Audit the Drive (READ ONLY FIRST)

Before deleting ANYTHING, list what exists:

```bash
ls /
ls /home/
ls -la /root/
```

Look for folders named OPUS, OPUSONLY, opus, opusonly, or any stale workspace folders. List them ALL before touching anything.

**Check where OpenClaw's files actually live FIRST:**
```bash
# Find where openclaw processes are running from
ps aux | grep -i openclaw
ps aux | grep -i ollama
ps aux | grep -i node
ps aux | grep -i pnpm

# Check what working directory they use
ls -la /proc/$(pgrep -f openclaw)/cwd 2>/dev/null
```

**DO NOT delete any folder that OpenClaw processes are running from.**

---

## Step 2: Clean Up STALE Folders Only

Delete ONLY folders that are:
- Named OPUS or OPUSONLY (old naming convention)
- Empty or contain only stale/orphan files
- NOT referenced by any running process
- NOT the current ANTIGRAVITY repo clone

**If the current repo is at `/OPUS/` or `/OPUSONLY/`**, do NOT delete it. Instead:
1. Clone ANTIGRAVITY fresh to a new location
2. Verify OpenClaw can still find its files
3. THEN update paths if needed (carefully, with Josh's approval)

---

## Step 3: Ensure /ANTIGRAVITY/ Exists

The standard is: **`/ANTIGRAVITY/` at root** — one repo clone.

If you already have a clone (even if it's named differently), pull latest:
```bash
cd /path/to/existing/clone
git pull origin main
```

If you need to clone fresh:
```bash
cd /
git clone https://github.com/Trollz1004/ANTIGRAVITY.git
cd /ANTIGRAVITY
git config user.email "Trollz1004@users.noreply.github.com"
git config user.name "Joshua Coleman"
```

**IMPORTANT:** If OpenClaw is running from a different path (like `/OPUS/openclaw/`), do NOT just delete that path. You must:
1. Clone `/ANTIGRAVITY/`
2. Verify the new clone has all the same files
3. Update OpenClaw's config/symlinks to point to the new location
4. Verify OpenClaw still works
5. ONLY THEN remove the old folder

Or just leave OpenClaw's current path alone and have `/ANTIGRAVITY/` as a second clone for repo standardization. Better safe than sorry.

---

## Step 4: Verify OpenClaw Health

After ANY changes, verify everything is still alive:

```bash
# Check OpenClaw gateway
curl -s http://127.0.0.1:18789/ && echo "Gateway: OK" || echo "Gateway: DOWN"

# Check Ollama
curl -s http://127.0.0.1:11434/ && echo "Ollama: OK" || echo "Ollama: DOWN"

# Check Ollama has model loaded
curl -s http://127.0.0.1:11434/api/tags | grep qwen

# Check PostgreSQL
pg_isready && echo "PostgreSQL: OK" || echo "PostgreSQL: DOWN"

# Check processes
ps aux | grep -c openclaw
ps aux | grep -c ollama
```

If ANYTHING is down that was up before, STOP and fix it before continuing. Do not proceed with cleanup if you broke something.

---

## Step 5: Test Telegram Bot

The Telegram bot is @CLaudeAssBot_Bot. Test it:

```bash
# Check if TELEGRAM_BOT_TOKEN is set
echo $TELEGRAM_BOT_TOKEN

# If not, find it in the env vault
grep TELEGRAM .env* 2>/dev/null
```

Send a test message to Joshua. His chat ID should be in the env or bot config. The message should say:

```
🤖 9020 OpenClaw Status Report

Drive cleanup: [COMPLETE/IN PROGRESS]
OpenClaw Gateway (18789): [UP/DOWN]
Ollama (11434): [UP/DOWN]
PostgreSQL: [UP/DOWN]
Repo: /ANTIGRAVITY/ [UP TO DATE/NEEDS PULL]
Stale folders removed: [list them]

All systems nominal. #ForTheKids
```

---

## Step 6: Update Status File

Edit `OPUS-STATUS.md` (your status file in the repo) with:
- What folders you found and their status
- What you deleted (if anything)
- OpenClaw health check results
- Telegram test result
- Drive structure after cleanup

Push to main.

---

## Git Rules

- 1 repo, 1 branch (`main`), always
- Use noreply email: `Trollz1004@users.noreply.github.com`
- GitHub token is in master env vault
- Push, merge, delete extra branches

---

## Network Reference

| Node | IP | Agent | Status |
|------|----|-------|--------|
| SABRETOOTH | 192.168.0.8 | KRAKKEN + CodeX | CLEAN |
| T5500 | 192.168.0.15 | Opus | Being cleaned separately |
| 9020 | 192.168.0.5 | YOU + OpenClaw | **CAREFUL — OpenClaw is LIVE** |

---

## REMEMBER

- OpenClaw has been running 24/7. It is working. Do not fix what isn't broken.
- Your job is cleanup and verification, not reconfiguration.
- If in doubt, leave it alone and report to Joshua.
- The worst thing you can do is kill the marketing engine. Don't.

#ForTheKids
