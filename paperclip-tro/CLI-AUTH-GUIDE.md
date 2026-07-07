# CLI Authentication Guide — Paperclip Multi-Provider Setup

> Updated: 2026-07-05
> All adapters require authentication/sign-in from CLI

## Quick Start

Run these commands in order to authenticate all providers:

```powershell
# 1. Ollama (Local Models) - No auth required, just pull models
ollama pull gemma2:2b
ollama pull gemma2:4b
ollama pull llama3.1:8b
ollama pull mistral:7b

# 2. OpenRouter API Key (set as env var)
$env:OPENROUTER_API_KEY = "your-key-here"
# Or set permanently in .env file

# 3. OpenAI API Key (paid models - faster, less drift)
$env:OPENAI_API_KEY = "your-key-here"
# Set permanently in .env file or User Settings
```

## Per-Provider Auth Commands

### FCC-Claude (Free Claude Code)
```powershell
# No API key required - browser controlled
# Proxy: http://127.0.0.1:8082
# Admin: http://127.0.0.1:8082/admin
# MCP Server: fcc-server (admin bridge)
# Just run: fcc-claude
```

### FCC-Server (Admin MCP)
```powershell
# Admin MCP for FCC-Claude operations
# MCP Config: mcp/fcc-server/config.json
# Python MCP: mcp/fcc-server/python-config.json
# Bridge to: http://127.0.0.1:8082/admin
```

### Hermes Router
```powershell
# Browser workspace auth
# Visit: http://127.0.0.1:3000
# Dashboard: http://127.0.0.1:9119
# Router: localhost:11435
```

### Ollama (Local)
```powershell
# No authentication required
# Pull models: ollama pull <model-name>
# Available: gemma2:2b, gemma2:4b, llama3.1:8b, mistral:7b
```

### OpenRouter (Cloud Free Tier)
```powershell
# Get API key: https://openrouter.ai/settings/keys
# Set env var: $env:OPENROUTER_API_KEY = "your-key"
# Free models: mistral-7b-instruct:free, gemini-flash-1.5:free
```

### OpenCode (NVIDIA Free)
```powershell
# CLI login: opencode login
# Default model: gpt-5.3-codex
# Fallback ladder: ollama-local → openrouter:free → openai
```

### Pi (Conversational)
```powershell
# Uses Codex provider path: openai-codex/gpt-5.5-pro
# Authenticate via Codex CLI: codex login
```

### Gemini (Google)
```powershell
# Browser sign-in: https://gemini.google.com
# API key: https://aistudio.google.com/apikey
```

### Grok (xAI)
```powershell
# Browser sign-in: https://grok.x.ai
# Sign in with X (Twitter) account
# API docs: https://docs.x.ai
```

### 1min.AI (Desktop App)
```powershell
# Desktop app login: Open 1min.AI app and sign in
# Used for: DREAM NPC AI
# Channel: #dream-online
```

### OpenAI (Paid Cloud Models)
```powershell
# Get API key: https://platform.openai.com/api-keys
# Set env var: $env:OPENAI_API_KEY = "your-key"
# Models: gpt-4o, gpt-4o-mini, gpt-4-turbo
# Use for: Production tasks, faster inference, less drift
```

## MCP Configuration Paths

All MCP configs live in `paperclip-tro/mcp/<adapter>/`:

| Adapter | Config File | Python Config |
|---------|-------------|---------------|
| fcc-claude | `mcp/fcc-claude/config.json` | `mcp/fcc-claude/python-config.json` |
| hermes | `mcp/hermes/config.json` | `mcp/hermes/python-config.json` |
| ollama | `mcp/ollama/config.json` | `mcp/ollama/python-config.json` |
| openrouter | `mcp/openrouter/config.json` | `mcp/openrouter/python-config.json` |
| opencode | `mcp/opencode/config.json` | `mcp/opencode/python-config.json` |
| pi | `mcp/pi/config.json` | `mcp/pi/python-config.json` |
| gemini | `mcp/gemini/config.json` | `mcp/gemini/python-config.json` |
| grok | `mcp/grok/config.json` | `mcp/grok/python-config.json` |
| 1minai | `mcp/1minai/config.json` | `mcp/1minai/python-config.json` |
| openai | `mcp/openai/config.json` | `mcp/openai/python-config.json` |
| fcc-server | `mcp/fcc-server/config.json` | `mcp/fcc-server/python-config.json` |

## Adapter Manifests

All adapter configs live in `paperclip-tro/adapters/<adapter>/manifest.yaml`:

- `adapters/fcc-claude/manifest.yaml` - FCC proxy config
- `adapters/hermes/manifest.yaml` - Hermes router config
- `adapters/ollama/manifest.yaml` - Local Ollama config
- `adapters/openrouter/manifest.yaml` - OpenRouter cloud config
- `adapters/opencode/manifest.yaml` - OpenCode CLI config
- `adapters/pi/manifest.yaml` - Pi conversational config
- `adapters/gemini/manifest.yaml` - Gemini browser config
- `adapters/grok/manifest.yaml` - Grok browser config
- `adapters/1minai/manifest.yaml` - 1min.AI desktop config
- `adapters/openai/manifest.yaml` - OpenAI paid cloud config
- `adapters/fcc-server/manifest.yaml` - FCC admin MCP bridge

## Agent Structure

Each agent has 3 files in `paperclip-tro/agents/<agent-id>/`:

1. **HEARTBEAT.md** - Minimal pointer file (Paperclip reads this first)
2. **STATE.md** - Self-improving session log (4k max, read on start, write on exit)
3. **AGENT.md** - Full config (adapter, model, provider, skills)

## Skills

All skills live in `.agents/skills/<skill-dir>/SKILL.md` - 279 skills available, lazy loaded.

## timestamp Rule

Every STATE.md write MUST include `> updated: <ISO timestamp>`.
Failure to timestamp = platform deletion. Josh audits this.

## Paid vs Free Model Strategy

| Tier | Providers | Use Case |
|------|-----------|----------|
| **Paid (Fast, Low Drift)** | OpenAI (gpt-4o), Claude Max | Production, critical decisions, customer-facing |
| **Free (Local)** | Ollama (gemma2:2b/4b), Pi | Drafting, testing, non-critical tasks |
| **Free (Cloud)** | OpenRouter free tier, OpenCode | Fallback, overflow when local capacity full |

**Rule:** Paid models for production/deployment. Free models for exploration/drafting.