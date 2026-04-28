# OpenCode Memory - Trash Or Treasure Online Recycler LLC

## System Identity
- **Company**: Trash Or Treasure Online Recycler LLC
- **CEO**: Joshua Coleman (joshlcoleman@gmail.com)
- **GitHub**: Trollz1004
- **Master Repo**: C:\ANTIGRAVITY
- **Primary Node**: Sabretooth (192.168.0.8)

## Hardware Profile
- **GPU**: AMD Radeon RX 6700 XT 12GB
- **RAM**: 64GB DDR5
- **CPU**: Intel Core i7-4960X 3.60GHz
- **Storage**: 2TB HDD + 480GB SSD

## Network Topology
| Node | IP | Role |
|------|----|------|
| Sabretooth | 192.168.0.8 | Primary/GPU |
| T5500 | 192.168.0.15 | Orchestrator |
| 9020 | 192.168.0.5 | Remote GPU |

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
| llama3 | 4.7GB | General development |
| mistral | 4.4GB | Fast code completion |
| codellama | 3.8GB | Code generation |
| joshlcoleman/CFO-Until-No-Kid-In-Need | 2.0GB | CFO tasks |
| joshlcoleman/dateapp | 2.0GB | Dateapp tasks |

### Ollama Cloud
- `kimi-k2.6:cloud` - Fast general tasks
- `jeffreyvandekorput/korpohermes-prime:latest` - Premium reasoning

### Google Gemini (API)
- `gemini-1.5-flash` - Fast reasoning
- `gemini-1.5-pro` - Complex reasoning
- `gemini-pro` - Standard tasks

### Raspberry Pi/Lightweight
- `llama3:7b` (Q4) - ~4GB
- `mistral:7b` (Q4) - ~4GB
- `phi3` - 2.3GB

## Payment Processing

### Square (LIVE)
- **High-Risk**: ebaytrashortreasure@gmail.com
- **Standard**: joshlcoleman@gmail.com
- **Location ID**: L24ZX5WRA41TH
- **Merchant ID**: ML3C7FMTQS5KX

### Stripe (LIVE)
- **Account**: acct_1T3DVxIO6LWQSQoI
- **Secret Key**: sk_live_51T3DVxIO6LWQSQoI...

## URLs
- **Paperclip HQ**: https://paperclip-hq.youandinotai.com
- **Frontend**: https://youandinotai.com
- **API**: https://api.youandinotai.com

## Key Services
- **Ollama**: http://localhost:11434
- **Paperclip**: http://localhost:3100
- **OpenClaw Gateway**: http://localhost:18789
- **Redis**: localhost:6379
- **Qdrant**: http://localhost:6333

## Deployment Status
- [x] Paperclip agents configured
- [x] Model options added to all agents
- [x] Master .env created
- [ ] Docker installed
- [ ] Cloudflare Workers deployed
- [ ] Hermes Agent installed
- [ ] 24/7 auto-start configured

## Recent Activity
- 2026-04-27: Created CEO, CTO, Engineer, CMO, UXDesigner, Intern agents
- 2026-04-27: Added model selection options to all agents
- 2026-04-27: Consolidated all .env files into master CEO .env
- 2026-04-27: Created OpenCode Memory file

## Memory Notes
- Paperclip uses embedded Postgres for local deployment
- Cloudflare Workers deployment requires D1 database
- Hermes Agent requires WSL2 on Windows
- All agents have HEARTBEAT.md, SOUL.md, TOOLS.md, AGENTS.md files
- GPU (RX 6700 XT 12GB) handles models up to ~7B parameters efficiently