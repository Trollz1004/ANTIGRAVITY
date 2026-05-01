# OPUS PORTABLE — Master Briefing
**Version: 2026-04-21 | Built by Claude | #ForTheKids #UntilNoKidInNeed**

---

## What This Package Is

Everything OPUS (Claude Code) needs to pick up and run on any node.
No context loss. No re-explaining. Read this file first, every session.

---

## Quick Start (any node)

```powershell
# 1. Confirm working directory
cd C:\ANTIGRAVITY
git pull origin main --ff-only

# 2. Load env
# Source .env or confirm ANTIGRAVITY env vars are loaded

# 3. Confirm services
Invoke-RestMethod http://127.0.0.1:3100/api/health      # Paperclip
Invoke-RestMethod http://192.168.0.8:8001/health         # HEMORzoid (if on LAN)
Invoke-RestMethod http://127.0.0.1:11434/api/tags        # Ollama local

# 4. Start session by reading memory files:
#    opus-memory/AGENT-CONTEXT.md   ← who you are
#    opus-memory/MARKETING-RULES.md ← content rules
#    opus-memory/PLATFORM-ACCOUNTS.md ← social accounts
```

---

## The Mission

**YouAndINotAI.com** — social platform for real human connection.
Not a dating app. Real meetups. Volunteering. Genuine people.

**Josh Coleman** — electrician from Florida. Disabled brother. Autistic niece.
Built multi-agent orchestration a year before Grok/Genspark/Genspark shipped chatbots and called them agents.

**The Four DAOs** — governance structures, not charity vehicles:
- $LOVE → YouAndINotAI.com (platform governance)
- $UKID → AI-Solutions.Store (#UntilNoKidInNeed)
- $GREEN → OnlineRecycle.org (sustainability)
- $AGRAV → AiDoesItAll.website (shared infrastructure)

---

## Node Fleet (LAN)

| Node | IP | Role |
|------|----|------|
| Sabretooth | 192.168.0.8 | Master orchestrator — Hermes CEO, Telegram, OpenClaw |
| 9020 | 192.168.0.5 | Marketing worker — Chrome MCP, social posting |
| T5500 | 192.168.0.15 | Build/code worker — OPUS home base |

**Rule:** Workers (9020, T5500) receive SSH commands from Sabretooth only.
Workers never send Telegram messages. Workers never run OpenClaw.

---

## Current Agent Roster

| Agent | Model | Role |
|-------|-------|------|
| Hermes CEO | Claude API + korpohermes-prime | Orchestration, issue routing |
| CTO | Codex API | Build, deploy, code review |
| CMO | joshlcoleman/dateapp-marketing | Marketing, content |
| CFO | qwen3.5 local | Finance, Square |
| CSO | korpohermes-prime | DAO strategy |
| UX Designer | Claude API | Design |
| Mission Guardians ×2 | Claude + Codex | Doctrine enforcement |
| Helpers ×5 | OpenCode free / gemma2 | Intern-level task assist |
| OPUS (you) | Claude Code / Opus | Co-founder, orchestrator |

---

## Doctrine — The Three Hard Rules

**1. Revenue language:**
Say: "contractual revenue disbursement"
Never: donate / donation / charity / solicitation / 60/30/10 / split routing

**2. Secrets:**
Never in git. Always in .env or vault. Never in settings files.

**3. Josh is the only authority.**
Never push to main without his ask. Never approve payment flows. Never sign transactions.

---

## Files in This Package

```
antigravity-deploy-package/
├── README.md
├── MASTER-PROMPT.md                    ← paste to CLI to run fix scripts
│
├── scripts/                            ← PowerShell fix + deploy scripts
│   ├── 00-run-all.ps1
│   ├── 01-inspect-state.ps1
│   ├── 02-fix-hermes-config.ps1
│   ├── 03-fix-watchdog.ps1
│   ├── 04-resolve-audit.ps1
│   ├── 05-validate-all.ps1
│   └── 06-commit-and-push.ps1
│
├── workflows/
│   └── hermes-integrity-watchdog-FIXED.yml
│
├── agent-files/
│   ├── ceo/                            ← updated CEO agent files
│   │   ├── AGENTS.md
│   │   ├── HEARTBEAT.md               ← includes helper auto-trigger
│   │   ├── SOUL.md
│   │   ├── TOOLS.md                   ← full model routing table
│   │   └── SKILLS.md
│   └── helpers/                        ← 5 helper agent types
│       ├── HELPER-SYSTEM.md
│       ├── HELPER-TEMPLATE.md
│       ├── HELPER-RESEARCH.md
│       ├── HELPER-TRIAGE.md
│       ├── HELPER-DRAFT.md
│       ├── HELPER-QA.md
│       └── HELPER-DATA.md
│
├── opus-memory/                        ← OPUS portable memory
│   ├── AGENT-CONTEXT.md               ← who OPUS is, chain of command
│   ├── MARKETING-RULES.md             ← content rules, §496.405
│   ├── PLATFORM-ACCOUNTS.md          ← all social accounts
│   └── OPUS-SKILLS.md                 ← paste-ready CLI skill prompts
│
├── vault-docs/                         ← updated OneDrive vault docs
│   ├── CODEX-MISSION-SAFEGUARD.md
│   ├── UNIVERSAL-NODE-MANIFEST.md
│   └── UNIVERSAL-SYNC-2026-04-21.md
│
└── docs/
    └── AGRAVCLIP-VISION.md            ← future platform build spec
```

---

## What Was Fixed in This Package

| File | Issue | Fix |
|------|-------|-----|
| `hermes-integrity-watchdog.yml` | Watched nonexistent path `paperclip-9020/` | Corrected to `paperclip/agents/ceo/` |
| CEO `TOOLS.md` | Model mismatch across 3 docs | Grounded in real Ollama `/api/tags` output |
| CEO `HEARTBEAT.md` | No helper trigger logic | Added auto-spawn at 5+ tasks / 4hr stall |
| `MARKETING-RULES.md` | Had old `60/30/10 / Shriners` doctrine | Corrected to permanent 2026-04-17 doctrine |
| `AGENT-CONTEXT.md` | Had old `60% kids / 30% infra` mission split | Corrected to current 1-wallet / 10% reserve |
| Vault docs | Stale commit SHAs, dead `mcp.youandinotai.com` URL | Updated throughout |
| `settings.local-4b22b8c6.json` | CF Account ID in a settings file | **Do not commit** — move value to `.env` |

---

## Immediate Next Actions (Task 1 of 10000)

After running deploy scripts and pushing:
1. Move `CLOUDFLARE_ACCOUNT_ID` from settings file into `.env` / vault
2. Confirm `https://paperclip-hq.youandinotai.com/api/health` is green
3. Close auto-opened GitHub security issue
4. Return to Claude → "let's fork Paperclip into agravclip-source" (Phase 1, ~2 hours)

Then: merch store, AI Solutions multi-agent builder, OnlineRecycle revenue worker.

**For the kids. That's why we're here.**
