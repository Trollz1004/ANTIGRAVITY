# Self-Improving Agent Startup Guide

> Updated: 2026-07-05

## Agent Boot Sequence

### 1. Read HEARTBEAT.md
Location: `paperclip-tro/agents/<agent-id>/HEARTBEAT.md`

This file contains ONLY pointers:
- Where AGENT.md is
- Where STATE.md is
- Skills directory location
- MCP config location

### 2. Read STATE.md
Location: `paperclip-tro/agents/<agent-id>/STATE.md`

Self-improving session log:
- What was decided last session
- What was learned
- What was done
- What is blocked

**Rules:**
- Max 4k tokens
- Must timestamp every write: `> updated: ISO`
- Keep last 3 sessions max
- Prune process narration, keep decisions/outcomes

### 3. Read AGENT.md
Location: `paperclip-tro/agents/<agent-id>/AGENT.md`

Full agent configuration:
- Adapter type
- Model ID
- Provider
- Skills list
- Tools

### 4. Load MCP Config
Location: `paperclip-tro/mcp/<adapter>/config.json`

If using MCP, load adapter-specific MCP servers:
- `config.json` - JSON/NPX servers
- `python-config.json` - Python servers

### 5. Lazy-Load Skills
Location: `.agents/skills/<skill-dir>/SKILL.md`

Never preload at boot. Load skills on demand.

## Exit Sequence

### Write STATE.md ON EXIT

Every agent MUST write STATE.md before session ends:

```markdown
## Last Session
- What I did
- What I learned
- What I decided

## Blockers
- Anything that needs follow-up

## Timestamp
> updated: 2026-07-05T00:00:00Z
```

**Failure to timestamp = platform deletion**

## Update HEARTBEAT.md ON EXIT

Update the last_beat timestamp:

```yaml
last_beat: 2026-07-05T00:00:00Z
status: idle
```

## Example Files

See:
- `paperclip-tro/agents/ceo/` - Claude CEO example
- `paperclip-tro/agents/hermes-ceo/` - Hermes CEO example
- `paperclip-tro/agents/_template/` - Blank template

## MCP Setup

For each adapter, MCP config is in:

```
paperclip-tro/mcp/<adapter>/
├── config.json       # JSON/NPX MCP servers
└── python-config.json # Python MCP servers
```

See `CLI-AUTH-GUIDE.md` for authentication steps.