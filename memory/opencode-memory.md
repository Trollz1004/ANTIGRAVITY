# OpenCode Memory File

## System Configuration

- Primary Model: opencode/glm-5.1
- Cloud Models:
  - ollama/qwen3-coder:480b-cloud
  - ollama/joshlcoleman/dateapp
- Fallback Chain: Automatic switching when API caps are hit

## Available Skills

- agent-browser (installed globally)
- find-skills (installed globally)

## Launchers

- Windows: C:\ANTIGRAVITY\paperclip-adapters\opencode-unified.cmd
- WSL: C:\ANTIGRAVITY\scripts\opencode-unified-launcher-wsl.sh
- Desktop Shortcut: Paperclip-CEO-OpenCode-Unified.bat

## Environment

- Environment file: C:\ANTIGRAVITY\briefings\MASTER-UNIVERSAL-ENV-TROLLZ1004.env
- Loads all necessary API keys for cloud models

## Claude CLI Configuration (2026-04-27)

**Auth Setup:**
- Model: opus (Claude Opus 4.6)
- Login: claudeai (Claude Pro authentication)
- Thinking: enabled by default
- Verbose: enabled (full tool output)
- Permissions: pre-configured for docker, npm, git (auto mode)

**Docker Configuration:**
- DOCKER_HOST: ssh://joshl@192.168.0.15 (remote T5500)
- COMPOSE_PROJECT_NAME: antigravity
- SSH key: ~/.ssh/id_ed25519 (Windows Credential Manager)
- Docker-compose paths: fixed (relative paths, Windows-compatible)

**Paperclip Setup:**
- Docker services run on T5500 (192.168.0.15), not local
- Root compose: docker-compose.yml (OpenClaw + Redis + Qdrant)
- App compose: backend/fastapi-app/docker-compose.yml (PostgreSQL + API)
- Logs: ./logs (relative path from compose directory)

**Cloudflare Tunnels:**
- Status: LIVE & ROUTING for openclaw and mcp
- Domains: youandinotai.com, onlinerecycle.org, ai-solutions.store, dashboard.aidoesitall.website
- Deploy: Cloudflare Pages (verified upload flow, not Wrangler)

## Recent Changes (2026-04-27)

- ✅ .claude/settings.json updated with auth config, Docker env, SSH config, permissions
- ✅ docker-compose.yml paths changed from absolute (C:/) to relative (./) for Windows compatibility
- ✅ Created DOCKER-SETUP.md with installation guide and troubleshooting
- ✅ Configured remote Docker access to T5500 via SSH
- ✅ Memory files updated: docker_setup.md, claude_cli_auth.md
- ✅ .claude/settings.json: sshConfigs added for T5500 remote node

## Remote Nodes (Operational Context)

| Node | IP | Docker | Status | Purpose |
|------|----|--------|--------|---------|
| SABRETOOTH | 192.168.0.8 | Not installed | Desktop (Chrome CLI) | Main command post |
| T5500 | 192.168.0.15 | Docker + Docker Compose | SSH active | Paperclip backend, Ollama, media builds |
| 9020 | 192.168.0.5 | Optional | SSH active | GenSpark, marketing node (cold-start) |

## Purpose

This memory file tracks OpenCode configuration, Paperclip infrastructure setup, and Claude CLI auth state for continuity across sessions.
