# OpenCode Memory - Trash Or Treasure Online Recycler LLC

## System Identity
- **Company**: Trash Or Treasure Online Recycler LLC
- **CEO**: Joshua Coleman (joshlcoleman@gmail.com)
- **GitHub**: Trollz1004
- **Master Repo**: C:\ANTIGRAVITY
- **Primary Node**: Sabretooth (192.168.0.8)

## Hardware Profile
- **GPU**: AMD Radeon RX 6700 XT 12GB
- **RAM**: 64.0 GB
- **CPU**: Intel Core i7-4960X @ 3.60GHz
- **Storage**: 1.82 TB HDD (WDC WD20EZAZ) + 447 GB SSD (Crucial_CT480M500SSD1)

## Network Topology
| Node | IP | Role |
|------|----|------|
| Sabretooth | 192.168.0.8 | Primary — live command post |
| T5500 | 192.168.0.15 | Remote utility / heavy media-build (cold-start) |
| 9020 | 192.168.0.5 | GenSpark / remote ops (cold-start) |
| MINI-ASUS-PC | — | Trusted CLI Node |

## Paperclip Company Structure
- **Company ID**: c1643b5d-b646-48e5-acd3-4e8e3766d8bc
- **Deployment Mode**: local_trusted
- **Database**: Embedded Postgres (port 54329)
- **Server Port**: 3100
- **Storage**: Local disk

### Agent Registry
| Role | Agent ID | Reports To | Status |
|------|----------|------------|--------|
| CEO | 3fd7ca2a-b4a2-4ec5-9d32-a5ccd3837b45 | - | Active |
| CTO | ctoa0000-0000-0000-0000-000000000001 | CEO | Active |
| Engineer | 4004f765-2a6a-4888-abf3-e04ecfab646d | CTO | Active |
| CMO | 12ac9f44-c889-45cd-a71c-f4069859e827 | CEO | Active |
| UXDesigner | faa61f09-e24f-41d2-baa2-6347f3d70b8c | CEO | Active |
| Intern | 6403b811-a9a1-4563-b7b4-dad814492822 | CTO | Active |

## Model Configuration

### Self-Hosted Ollama (GPU - Sabretooth)
| Model | Size | Purpose |
|-------|------|---------|
| qwen2.5:7b | ~4.7GB | Default low-cost local worker |
| qwen2.5:3b | ~2GB | Lightweight tasks |
| nomic-embed-text | — | Embeddings |
| qwen2.5-coder:7b | ~4.7GB | Dev tasks |

### Ollama on other nodes
- 9020: qwen2.5:7b
- T5500: qwen2.5:7b

## Payment Processing

### Square (LIVE — primary)
- **Account**: joshlcoleman@gmail.com
- **Location ID**: LY5GN09F5AN83 (Trash Or Treasure - ACTIVE)
- **Merchant ID**: sq0idp-Carv59GQKuQHoIydJ1Wanw

### Stripe: LEGACY ONLY — being phased out

## URLs
- **Paperclip HQ**: https://paperclip-hq.youandinotai.com
- **Frontend**: https://youandinotai.com
- **API**: https://api.youandinotai.com
- **OnlineRecycle**: https://onlinerecycle.org
- **AI Solutions Store**: https://ai-solutions.store
- **Dashboard Gateway**: https://dashboard.aidoesitall.website
- **ClawX Hub**: https://clawx-aihub-zwxfcstm.manus.space

## Key Services
- **Ollama**: http://localhost:11434
- **Paperclip**: http://localhost:3100
- **Hermes Router**: localhost:11435
- **BRAIN MCP**: port 3900
- **OpenClaw Gateway**: http://localhost:18789

## Deployment Map
| Site | Host | Deploy Dir |
|------|------|------------|
| youandinotai.com | Cloudflare Pages | youandinotai/dist |
| onlinerecycle.org | Cloudflare Pages | _deploy/onlinerecycle |
| ai-solutions.store | Cloudflare Pages | _deploy/ai-solutions-store |
| dashboard.aidoesitall.website | Cloudflare Pages | _deploy/dashboard-gateway |
| www.aidoesitall.website | Cloudflare Pages | _deploy/aidoesitall-www |

## Repository Rules
- One repo (Trollz1004/ANTIGRAVITY), one branch (main), one folder (C:\ANTIGRAVITY)
- Secrets in .env ONLY — never in chat, never in git; real env in OneDrive Personal Vault
- No git push without explicit Josh order
- Square payment links are LIVE — see AGENTS.md for full table
- 10%  cap on LLC-controlled revenue (current conservative doctrine)
- FL §496.405: never use "payment"/"payment"/"outreach" in customer-facing code

## Desktop & Documents Audit
- **Documents/Downloads**: CLEAN — no Antigravity-related files found
- **Desktop**: START-ANTIGRAVITY.bat + STATUS-ANTIGRAVITY.bat consolidated to scripts/; 6 test-hermes*.bat deleted (disposable debug scratch)
- **Device name**: Sabretooth-12gbGPU64gbRAMi7-49060x

## Cleanup History
- 2026-04-28: Housekeeping sweep (glm-5.1)
  - Deleted docs/scratch/ (3 old Perplexity dumps — placeholder-only cred refs, no real leaks)
  - Moved development/ handoff files (4) to briefings/; removed empty development/ dir
  - Consolidated Desktop launchers to scripts/start-antigravity.bat + scripts/status-antigravity.bat
  - Deleted 6 Desktop test-hermes*.bat variants (debug scratch)
- 2026-04-28: Post-migration cleanup executed (commit 6ab58a50)
  - Deleted: hermes-paperclip-adapter-main.zip, joshuaclaw-flagship-beta-testing.zip, Import-Module
  - Moved 9 root .md files to briefings/, 1 .ps1 to scripts/
  - Env-leak audit: CLEAN. D:\ reference scan: CLEAN. Memory cross-check: CLEAN
  - D:\Antigravity folder triage still pending (15 non-flagship folders)

## Recent Activity
- 2026-04-28: Housekeeping sweep — docs/scratch deleted, development/ relocated, Desktop .bat consolidated
- 2026-04-28: Post-migration C:\ root cleanup committed (6ab58a50)
- 2026-04-28: OpusPawClaw migrated from D:\ to c:\Antigravity\apps\opuspawclaw\
- 2026-04-28: Docker CLI v29.4.1 installed
- 2026-04-28: Paperclip Worker deployed to Cloudflare (paperclip-hq.youandinotai.com)
- 2026-04-28: D1 database created
- 2026-04-28: Bedrock→Anthropic switch
- 2026-04-27: Created CEO, CTO, Engineer, CMO, UXDesigner, Intern agents
- 2026-04-27: Added model selection options to all agents