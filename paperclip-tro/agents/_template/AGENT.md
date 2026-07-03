---
name: <agent-id>
title: <Role> — <ANT|DREAM>
adapter: <fcc-claude|hermes|pi|codex|gemini|opencode|ollama-local>
paperclip_adapter_type: <claude_local|codex_local|opencode_local|pi_local|openclaw_gateway>
model: <model-id>
provider: <provider>
reports_to: tro-ceo
project: <ANT-DATEAPP|ANT-EBAY|ANT-AISOLUTIONS|DREAM>
node: <sabretooth|9020>
heartbeat_minutes: <30-120>
---

# <Role> Agent Config

One-paragraph role scope.

## File locations (universal — same on every node)

| File | Path | Access |
|------|------|--------|
| HEARTBEAT | paperclip-tro/agents/<agent-id>/HEARTBEAT.md | read-only (Paperclip writes) |
| AGENT | paperclip-tro/agents/<agent-id>/AGENT.md | read-only (config) |
| STATE | paperclip-tro/agents/<agent-id>/STATE.md | read on start, write on exit ONLY |
| Skills | .agents/skills/<skill-dir>/SKILL.md | read-only (lazy load) |
| Tools | adapter tools per manifest | runtime |

## STATE.md rules (MANDATORY — Joshua audits this)

1. Read FIRST before any work
2. Edit ONLY on exit — never mid-session
3. Timestamp every write: `updated: <ISO timestamp>`
4. Max 4k tokens — prune old sessions, keep decisions
5. Failure to timestamp = platform deletion. No exceptions. No bypass.

## Adapter cmd

FCC agents: `fcc-claude` (NOT `claude`, NOT `claude-code`)
Paperclip config cmd field must be `fcc-claude` for claude_local adapter.

## Skills (lazy load — never at boot)
- .agents/skills/<skill-dir>/SKILL.md
