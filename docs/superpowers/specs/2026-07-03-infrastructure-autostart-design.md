# Infrastructure Autostart & Health Design

**Date:** 2026-07-03  
**Status:** Verified  
**Scope:** All 3 nodes (Sabretooth, 9020, T5500)

## Architecture

| Node | IP | Role | Services |
|------|----|------|----------|
| Sabretooth | 192.168.0.8 | Dream Online + GPU | Ollama :11434, FCC :8082, Hermes router :11435, Dashboard :9119, Workspace :3000, Paperclip TRO :3110 |
| 9020 | 192.168.0.5 | Business + Joshua | Ollama :11434, Paperclip Business :3120 |
| T5500 | — | Public gateway | Cloudflared tunnel only |

## Autostart (Windows Scheduled Tasks)

Each node has a `.bat` script in `scripts/node-{name}-autostart.bat` registered as a Windows Scheduled Task (trigger: At Startup, run as admin).

Registration: `pwsh -NoProfile -File scripts/register-autostart-task.ps1 -Node {name}` (requires admin).

## Verification

`scripts/verify-all-nodes.ps1` — tests localhost endpoints (not LAN IPs, since services bind 127.0.0.1 for security).

Current results: **36/38 PASS**. Only failures: Paperclip TRO and Paperclip Business (PostgreSQL admin SID issue).

## Known Issue: Paperclip PostgreSQL

Embedded PostgreSQL refuses to start when the Windows user is in BUILTIN\Administrators. Root cause: PostgreSQL checks group membership regardless of UAC elevation state.

Fix options (in order of preference):
1. Set `DATABASE_URL` in `.env` pointing to external PostgreSQL
2. Run via `runas /trustlevel:0x20000` to strip admin token
3. Run from a standard (non-admin-group) Windows user

## Memory Backup Strategy

| Tier | System | Type | Status |
|------|--------|------|--------|
| Primary | STATE.md per agent | File | Working — all 9 agents have HEARTBEAT+STATE+AGENT |
| Backup 1 | Pieces MCP | Cloud | Working — tested, semantic search, survives disk failure |
| Backup 2 | Hermes holographic | Local | Working — `hermes -z "remember: ..."` writes to holographic provider |
| Backup 3 | Zapier Tables | Cloud | Available — OAuth cached, structured records |

## Cleanup Completed

- 12 empty Paperclip workspace UUID dirs — removed
- 300+ `__pycache__` dirs — removed
- `config.json.backup` — removed

## MCPs Available (35 total)

**Local (active):** brain-mcp, playwright, mission-mcp  
**Local (broken):** youandinotai-paperclip-memory (server file missing)  
**Cloud (active):** Pieces, Zapier, Neon, Supabase, Cloudflare (x2), Vercel, Netlify, Hugging Face, Gamma, HeyGen, Base44, Descrybe Legal, Indeed, IFTTT, BigData.com, AWS Marketplace  
**Cloud (needs auth):** Google Drive/Calendar/Gmail, Slack, Notion, Figma, HubSpot, Square, Stripe, PayPal

## Hermes Status

- Dashboard :9119 — running (3 duplicate processes, autostart now stops dupes first)
- Workspace :3000 — running (488 MB RAM)
- Memory: holographic provider active, MEMORY.md (7.4KB) + USER.md (2.6KB)
- Journey/Memory Graph: 35+ skill nodes, 22+ memory entries
- Kanban: SQLite-backed, swarm-capable
- Config issues: Nous Portal credits exhausted, several API keys not set
