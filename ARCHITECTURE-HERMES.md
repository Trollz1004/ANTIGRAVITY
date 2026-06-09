# ANTIGRAVITY Architecture — Hermes First

**Last Updated:** 2026-06-07  
**Authority:** Joshua Coleman  
**Hermes Session:** `20260607_152323_8d46c712`  
**Connected Platforms:** WhatsApp, Telegram

---

## Single Source of Truth

**HERMES** is the one orchestrator agent. It runs via WhatsApp and Telegram. Every contract file in `hermes/agents/` is executed via Hermes routing.

---

## Node Distribution

### Sabretooth (Primary Gateway)
- **IP:** `192.168.0.8`
- **Purpose:** Primary orchestration, Hermes gateway, cockpit dashboard
- **Services:** Hermes agent execution, API endpoints, WhatsApp/Telegram bridge
- **Status:** ACTIVE — primary authority

### T5500 Node (Infrastructure)
- **IP:** `192.168.0.15`
- **Purpose:** Cloudflare workers, wranglers, edge deployments
- **Services:** DNS, tunnel management, static assets
- **Status:** ACTIVE — optional

### 9020 Node (Pending Wipe)
- **IP:** `192.168.0.5`
- **Purpose:** DEPRECATED — being phased out
- **Status:** PENDING WIPE (preserve branch `9020-preserve-20260511` if needed)

---

## Repository Structure

### Canonical Root Paths

- Windows root: `c:\antigravity`
- WSL root: `/mnt/c/antigravity`
- New Hermes, Paperweight, cron, and dispatcher work must not introduce uppercase root variants such as `C:\Antigravity`, `C:\ANTIGRAVITY`, or `/mnt/c/Antigravity`.
- Use `/mnt/c/antigravity` for WSL-executed `workspace_path` values. Use `c:\antigravity` for Windows-facing launchers, docs, and services.

```
/mnt/c/antigravity/  ← ONE REPO, ONE BRANCH (main)
├── hermes/
│   ├── HERMES-SETUP-GUIDE.md   ← This architecture
│   ├── agents/
│   │   ├── AGENTS.md           ← Fleet structure
│   │   ├── HERMES-CEO-*.md     ← Hermes brain contracts
│   │   ├── SOUL.md             ← Shared brain logic
│   │   ├── TOOLS.md            ← Available tools
│   │   ├── HEARTBEAT.md        ← Self-improvement loop
│   │   └── ceo-*.md            ← Company CEOs (youandi, marketing, etc.)
│   └── backups/
│       ├── hermes-install/     ← DR backup
│       └── hermes-workspace/   ← DR backup
├── apps/
│   ├── antigravity-cockpit/    ← Dashboard (runs anywhere, shows 9020 status)
│   ├── dashboard/              ← T5500 cloudflare deployment
│   └── command-center/         ← 9020 marketing UI
├── services/
│   ├── hermes-router/          ← Hermes execution engine
│   ├── mission-control-api/    ← Backend API
│   └── health-aggregator/      ← Node health monitoring
└── backend/
    └── hermes_models.py        ← Model routing logic
```

---

## Execution Flow

```
WhatsApp/Telegram Message
    ↓
HERMES Agent (Session 20260607_152323_8d46c712)
    ↓
Sabretooth (192.168.0.8) parses & routes
    ↓
Execute task via local APIs / Ollama
    ↓
Return result → Hermes → WhatsApp/Telegram reply
```

**No multi-node dispatch.** Hermes runs on Sabretooth. T5500/9020 are cold standby (opt-in only).

---

## Key Files to Understand

1. **hermes/HERMES-SETUP-GUIDE.md** — This entire architecture
2. **hermes/agents/HERMES-CEO-*.md** — Hermes brain contracts (HEARTBEAT, SOUL, TOOLS)
3. **hermes/agents/AGENTS.md** — Fleet and role definitions
4. **hermes/agents/HEARTBEAT.md** — Self-improvement loop
5. **services/hermes-router/hermes_router.py** — Execution engine
6. **backend/hermes_models.py** — Model routing config

---

## What Changed (2026-06-07)

- **Consolidated repos:** One ANTIGRAVITY repo, deleted all duplicates
- **Clarified Hermes:** WhatsApp/Telegram agent, not a separate service
- **Clarified nodes:** 9020 = marketing/dating, T5500 = infra
- **Updated all agent files** to reflect correct architecture
- **Single branch:** main only, no stale branches
- **Session ID:** `20260607_152323_8d46c712` is the active Hermes agent

---

## Always Current

Every agent .md file, every .claude/ config, every service points to THIS architecture. If something contradicts this document, update it immediately.

**#ForTheKids #UntilNoKidInNeed #AlwaysIntegrity**
