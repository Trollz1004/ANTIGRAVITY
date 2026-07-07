# Self-Improving Agent Memory (MC.md)

> Updated: 2026-07-05
> File pointers to self-improving agent system

## Agent Boot Protocol

1. Read `STATE.md` FIRST (self-improving session log)
2. Read `AGENT.md` (config - adapter, model, provider)
3. Read `HEARTBEAT.md` (pointers to everything)
4. Lazy-load skills from `.agents/skills/`

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| HEARTBEAT.md | `paperclip-tro/agents/<id>/HEARTBEAT.md` | Minimal pointers, Paperclip reads first |
| STATE.md | `paperclip-tro/agents/<id>/STATE.md` | Self-improving, 4k max, read/write |
| AGENT.md | `paperclip-tro/agents/<id>/AGENT.md` | Full config, read-only |
| MCP Config | `paperclip-tro/mcp/<adapter>/config.json` | MCP server config |
| Python MCP | `paperclip-tro/mcp/<adapter>/python-config.json` | Python MCP servers |

## MCP Config Patterns

Each adapter has 2 config files:
- `config.json` - JSON-based MCP servers (npx, node)
- `python-config.json` - Python-based MCP servers

## Available Adapters

| Adapter | Manifest | MCP Config |
|---------|----------|------------|
| fcc-claude | `adapters/fcc-claude/manifest.yaml` | `mcp/fcc-claude/` |
| hermes | `adapters/hermes/manifest.yaml` | `mcp/hermes/` |
| ollama | `adapters/ollama/manifest.yaml` | `mcp/ollama/` |
| openrouter | `adapters/openrouter/manifest.yaml` | `mcp/openrouter/` |
| opencode | `adapters/opencode/manifest.yaml` | `mcp/opencode/` |
| pi | `adapters/pi/manifest.yaml` | `mcp/pi/` |
| gemini | `adapters/gemini/manifest.yaml` | `mcp/gemini/` |
| grok | `adapters/grok/manifest.yaml` | `mcp/grok/` |
| 1minai | `adapters/1minai/manifest.yaml` | `mcp/1minai/` |

## Auth Commands

See `CLI-AUTH-GUIDE.md` for per-provider authentication.

## Skills System

- Location: `.agents/skills/<skill-dir>/SKILL.md`
- 279 skills available
- Lazy-load only, never preload at boot