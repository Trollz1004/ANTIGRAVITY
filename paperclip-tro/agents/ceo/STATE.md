# ceo — Self-Improving State File
> Max 4k tokens. Read on start. Write on exit ONLY. Timestamp every write.
> Failure to timestamp = platform deletion. Joshua audits this.
> Only official Claude (Opus) exempt — third parties touch your files.
> updated: 2026-07-05

## Last Session
- Dual-CEO architecture deployed: Claude CEO + Hermes co-CEO
- CEO-PLAYBOOK.md created with delegation rules, skill routing, routines
- Mission guardian, pipeline keeper, adapter health routines defined
- **NEW**: Setup Paperclip with FCC-Claude, Hermes, multi-provider adapters

## Decisions
- CEOs DELEGATE only — never do leaf tasks
- Claude domain: code, compliance, doctrine, payments, merge/push
- Hermes domain: growth, support, research, external APIs, lead triage
- 100 tasks always on deck across all projects
- Sub-agents pull skills from .agents/skills/ — 279 skills available
- **NEW**: All adapters use CLI auth (Ollama, OpenRouter, OpenCode, Pi, 1min.ai, Gemini, Grok)
- **NEW**: MCP configs live in `paperclip-tro/mcp/<adapter>/config.json + python-config.json`

## Learned
- Sub-agent spawning: clone _template, fill frontmatter, register via API
- Routines run on Paperclip schedule — CEOs don't need to be awake for them
- Temp agents removed when task completes unless promoted to roster
- **NEW**: HEARTBEAT.md points to AGENT.md location — Paperclip only needs HEARTBEAT.md

## Blocked
(none)

## Improve
- Every agent reads STATE.md on start, writes on exit — mandatory self-improving protocol
