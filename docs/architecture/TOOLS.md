# TOOLS.md — Local Setup Notes

## Channels

- **WhatsApp**: Primary channel (+13529735909)
- **Telegram**: @CLAUDEsMiniBot (OpenClaw bot on Ollama, 24/7)

## Nodes

| Node           | IP           | Role                              | Status              |
| -------------- | ------------ | --------------------------------- | ------------------- |
| 9020 (current) | 192.168.0.5  | Dev, Claude Code CLI, deployments | ONLINE              |
| SABRETOOTH     | 192.168.0.8  | Platform (Ollama, HEMORzoid)      | OFFLINE (SSD issue) |
| T5500          | 192.168.0.15 | SSH only                          | Available           |

## Drives (9020)

| Drive | Label   | Size   | Free   | Use                          |
| ----- | ------- | ------ | ------ | ---------------------------- |
| C:    | 9020    | 465 GB | 311 GB | OS, workspace (E:/ANTIGRAVITY)      |
| D:    | STORAGE | 447 GB | 447 GB | Services data, backups, logs |

## Auto-Start (9020)

| What             | How                                | Notes                                          |
| ---------------- | ---------------------------------- | ---------------------------------------------- |
| Redis            | Windows service (auto)             | Port 6379, installed at C:\Program Files\Redis |
| Ollama + Qdrant  | Startup shortcut → start-stack.ps1 | Runs at login                                  |
| OpenClaw Gateway | Scheduled task "OpenClaw Gateway"  | At logon                                       |

## Scripts (E:/ANTIGRAVITY\\scripts\\)

| Script               | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| start-stack.ps1      | Starts Ollama + Qdrant (Redis is a service)                    |
| backup-workspace.ps1 | Backs up workspace + Qdrant snapshots to D:\backups\ (keeps 7) |
| social_sentinel.py   | Social media monitor (1217 lines, NOT started yet)             |

## Local Services (9020)

| Service      | Port                                | Purpose                                 |
| ------------ | ----------------------------------- | --------------------------------------- | ------------------------------------- |
| Ollama       | 11434                               | Local LLM + nomic-embed-text embeddings |
| Redis        | 6379                                | Session cache (TTL 1hr)                 |
| OpenClaw TUI | Qdrant                              | 6333                                    | Vector DB (permanent semantic memory) |
| —            | Primary interface (Claude Opus 4.6) |

## SSH

- SABRETOOTH: `ssh aicol@192.168.0.15` (hostname: DESKTOP-2DCAEVN)
- Key: C:\Users\joshl\.ssh\id_ed25519
- T5500: SSH available, NO SCP/SFTP — use base64 through SSH

## Git

- Remote: github.com/Trollz1004/ANTIGRAVITY (THE ONE REPO)
- Strategy: single branch (main)
- All other repos: ARCHIVED
- NO push/pull without Josh's explicit ask

## Payments (LIVE)

- Stripe ONLY (Square is DEAD as of 2026-02-23)
- See GEMINI-STATUS.md for all 5 Stripe payment link URLs

## Social

- Twitter: @YouAndiNotAi
- Snapchat: YouAndiNotAi
- WhatsApp: 1-352-973-5909
- Responder: aiforyoullc@gmail.com

## Deployments

| Service           | Target                               |
| ----------------- | ------------------------------------ |
| Landing page      | Netlify (youandinotai.com)           |
| Backend API       | GCP Cloud Run (api.youandinotai.com) |
| Revenue Dashboard | revenue-core-9020.netlify.app        |
