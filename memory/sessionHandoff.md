# SESSION HANDOFF — PASTE INTO NEW CLAUDE SESSION

**Last Session**: 2026-02-14 05:45 AM EST (Valentine's Day)  
**Last Agent**: GitHub Copilot (VS Code)

---

## CRITICAL: READ THESE FILES FIRST

```
memory-bank/identity.md      — Who Joshua is, the mission, the stakes
memory-bank/activeContext.md  — What we were JUST doing
memory-bank/projectState.md  — Every repo, deployment, domain, node
memory-bank/decisions.md      — Why we made every choice (don't re-debate)
memory-bank/techStack.md      — Every technology version and config
memory-bank/credentials-map.md — Where every key/token lives
CLAUDE.md                     — Repo-specific architecture guide
MISSION_DIRECTIVE.md          — The mission in Joshua's words
```

## TL;DR FOR NEW SESSION

- Joshua Coleman (electrician, not a developer) is building YouAndINotAI.com — a human-verified dating platform
- $19,990 pre-order revenue target before April 4, 2026
- He has Claude Max subscription (unlimited, 20x rate limit)
- He has been building for 1+ YEAR and has built the same app 4 times because of Claude memory loss
- This memory-bank/ system exists to PREVENT that from ever happening again
- Current machine is NODE 9020 (192.168.0.5), repo is Kraken_Assist_Local_Disk_9020
- Dev server runs on port 3000/3001
- DNS is broken (Cloudflare), backend is on AWS EC2 (3.84.226.108)
- Don't use OpenClaw — it's deprecated. Build custom code for any bot/gateway needs.
- Claude --dangerously-skip-permissions is already configured globally

## WHAT WAS LEFT UNFINISHED

1. **DNS fix on Cloudflare** — BLOCKING for launch. youandinotai.com returns HTTP 530 (dead tunnel from wiped T5500)
2. **Dashboard buttons are stubs** — "Launch 20-Agent Scrape", "SCRAPE", "Extract", "SYNC REVENUE" need real handlers
3. **AreaChart not rendering** — RevenueDashboard has chart data but no `<AreaChart>` component renders it
4. **Landing page deployment** — index.html has the landing page, needs to go live on youandinotai.com
5. **Gemini → Claude swap** — geminiService.ts uses Gemini SDK (out of credits), needs to use Claude API or stay simulation mode
6. **Route dead components** — AgentMonitor, ContentStudio, AdsManager are built but not wired into App.tsx navigation

## WHAT WAS COMPLETED THIS SESSION

1. ✅ sync-memory.ps1 FIXED — clean UTF-8 encoding, syncs to 5 OPUSONLY drives successfully
2. ✅ All SSDs deep cleaned — C:, D:, G:, H:, I:, J: stripped of stale project folders
3. ✅ LDPlayer service (LDRemoteSvc) permanently killed and deleted from D:
4. ✅ H: recovered ~126GB (hiberfil.sys 64GB + pagefile + ProgramData + Users deleted)
5. ✅ Memory synced to D:\, H:\, E:\, C:\, J:\ OPUSONLY\memory (all 5 drives)
6. ✅ Recycle bins emptied across all drives
7. ✅ cleanup-drives.ps1 temp script created, used, and removed

## DO NOT

- Build another duplicate date app
- Use OpenClaw/clawdbot/moltbot
- Ask Joshua what to do — read the memory-bank and EXECUTE
- Touch the `stable` branch
- Introduce CSS files or Tailwind config
- Re-debate decisions in memory-bank/decisions.md
