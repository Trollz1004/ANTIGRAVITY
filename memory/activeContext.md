# ACTIVE CONTEXT — WHAT'S HAPPENING RIGHT NOW

**Last Updated**: 2026-02-14T05:45:00Z  
**Session**: GitHub Copilot (VS Code) — Valentine's Day  
**Dev Server**: Not started this session

## Current Focus

Memory system is BUILT, ENFORCED, and SYNCING. sync-memory.ps1 fixed (encoding issue) and successfully syncs to 5 drives. All node SSDs cleaned of stale project folders. Node cleanup complete.

## What Just Happened (This Session — Latest First)

1. **sync-memory.ps1 FIXED** — rewrote with clean UTF-8 (no BOM), now runs successfully. Synced to D:\, H:\, E:\, C:\, J:\ OPUSONLY\memory
2. **All SSDs deep cleaned** — deleted stale projects from C:, D:, G:, H:, I:, J:
3. **C: cleaned** — removed Enigma-extracted, legacy_archive, marketing-automation, marketing-setup-repo, memory, openclaw-workspace, opus-ai, OPUS-ONLY, OPUSONLY, config, scripts, skills, toolbox, tmp
4. **D: cleaned** — removed LDPlayer (killed LDRemoteSvc service permanently), memory, stale files
5. **G: cleaned** — removed OPUS-ONLY from T5500 OS drive
6. **H: cleaned** — removed CLAWDBOT, CROSSLISTER-AI, CUPID-DATING-APP, ENIGMA, ENIGMA4PROFIT, openclaw, opus-ai, Scripts, Setup, tmp, .claude. Hibernation file (64GB) deleted via admin. H: went from 154GB free to 281GB free
7. **I: partially cleaned** — some NTFS-locked files remain (owned by other OS installs). User may factory reset
8. **J: cleaned** — removed CLAWDBOT and Enigma, kept OPUSONLY
9. **Recycle bins emptied** on all drives
10. User decided: "just leave drivers and windows" — anything Opus built can be rewritten faster than fighting NTFS permissions

## What's Broken

- **Gemini SDK**: Out of 300 credits — simulation mode active in dashboard
- **DNS**: youandinotai.com broken (dead Cloudflare tunnel from wiped T5500)
- **RevenueDashboard**: Chart data exists but no `<AreaChart>` renders it
- **Dead buttons**: "Launch 20-Agent Scrape", "SCRAPE", "Extract", "SYNC REVENUE" — all stubs
- **OpenClaw**: Deprecated auth, user decided to abandon it entirely

## What's Working

- **Memory-bank system** — 10+ files, CLAUDE.md enforces read/write protocol, sync script ready
- **Dev server** on port 3001
- **Claude Code CLI** with --dangerously-skip-permissions
- **Claude Max subscription** — OAuth tokens valid, 20x rate limit
- **SSH to T5500**: `ssh aicol@192.168.0.15` verified
- **AWS backend** at 3.84.226.108 (FastAPI, 52 endpoints)
- **Landing page** with pre-order modal (index.html)
- **ChatCommander** — Gemini chat + voice (works in sim mode)

## Immediate Next Steps

1. ✅ Memory-bank system (DONE — hardened with mandatory protocol)
2. ✅ sync-memory.ps1 (DONE — copies to all drives)
3. Fix DNS on Cloudflare — BLOCKING for launch
4. Wire dashboard buttons, fix AreaChart rendering
5. Deploy landing page to youandinotai.com
6. Swap Gemini → Claude in AI service layer
