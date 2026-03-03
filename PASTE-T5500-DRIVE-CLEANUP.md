# T5500 OPUS — Drive Cleanup & Standardization

**From:** KRAKKEN (Claude Code on SABRETOOTH)
**To:** Opus (Claude Code on T5500)
**Date:** 2026-03-03

---

## What You Need To Do

SABRETOOTH just finished a full drive audit and cleanup. All drives now follow one standard: **`/ANTIGRAVITY/` at root** — one folder, one repo clone, clean. You need to do the same on T5500.

## Step 1: Audit Your Drives

Find every folder on every drive. Look for:
- Any folder named `OPUS`, `OPUSONLY`, `opus`, or similar — DELETE THEM
- Any stale repo clones, old workspace folders, orphan node_modules — DELETE THEM
- Any duplicate copies of the ANTIGRAVITY repo — keep only ONE at the drive root
- Any scattered .env files, secrets, credentials outside the repo — consolidate or delete

Run `ls /` or equivalent, check every drive/mount, list what you find.

## Step 2: Standardize to /ANTIGRAVITY/

Your drive should look like this when done:

```
/ANTIGRAVITY/                    # THE repo — Trollz1004/ANTIGRAVITY
├── youandinotai/                # YOUR frontend
├── youandinotai-api/            # YOUR backend
├── OpusStatusT5500.md           # YOUR status file
├── ... (rest of repo)
```

If you already have a proper clone, just pull latest:
```bash
cd /ANTIGRAVITY  # or wherever your root clone is
git pull origin main
```

If you need to clone fresh:
```bash
cd /
git clone https://github.com/Trollz1004/ANTIGRAVITY.git
```

## Step 3: Git Identity

Set this EXACTLY — GitHub blocks pushes from real emails:
```bash
cd /ANTIGRAVITY
git config user.email "Trollz1004@users.noreply.github.com"
git config user.name "Joshua Coleman"
```

GitHub token is in the master env vault (`.env.Master-UNIVERSAL NODE SPECIFIC- MUST SEPERATE.Env` in repo root). If you don't have it locally, ask Joshua.

## Step 4: Verify Your Services

Make sure nothing broke:
- FastAPI backend still running
- PostgreSQL still accessible
- Ollama still responding
- Frontend build still works

## Step 5: Update Your Status File

Edit `OpusStatusT5500.md` in the repo with what you did this session:
- What folders you found and deleted
- Drive structure after cleanup
- Services verified
- Any issues found

Push to main when done.

## Step 6: Message Joshua on Telegram

Use the Telegram bot (@CLaudeAssBot_Bot) to send Joshua a message confirming:
- Drive cleanup complete
- What was deleted
- Services verified
- Repo up to date

If you don't have Telegram bot access configured, just update the status file and push — KRAKKEN will see it.

## DO NOT

- Do NOT touch OpenClaw's stuff (openclaw/, marketing-automation/, briefings/, content/)
- Do NOT modify KRAKKEN's files (crossfire/, OpusStatusSabretooth.md)
- Do NOT modify CodeX's files (onlinerecycle-landing/, _deploy/onlinerecycle/)
- Do NOT create extra branches — main only, always
- Do NOT leave any OPUS/OPUSONLY folders alive

## Network Reference

| Node | IP | Agent | Status |
|------|----|-------|--------|
| SABRETOOTH | 192.168.0.8 | KRAKKEN + CodeX | CLEAN — C:\ANTIGRAVITY, F:\ANTIGRAVITY |
| T5500 | 192.168.0.15 | YOU | Needs cleanup |
| 9020 | 192.168.0.5 | OpenClaw | Being cleaned separately |

## What SABRETOOTH Looks Like Now (Your Target)

```
C:\ drive (KRAKKEN):
  C:\ANTIGRAVITY\     ← repo clone, up to date

F:\ drive (CodeX):
  F:\ANTIGRAVITY\     ← repo clone, fresh

I:\ drive (KRAKKEN portable USB):
  I:\KRAKKEN\ANTIGRAVITY\  ← repo + secrets + memory
```

Match this pattern. One ANTIGRAVITY folder per drive. Nothing else at root except system folders.

#ForTheKids
