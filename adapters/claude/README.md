# FCC-Claude (Claude) Adapter

Paperclip alias: `claude`

CLI: `fcc-claude`

Provider: fcc-claude (MCP bridge to fcc-server :8082). Uses dedicated 'openai' provider (gpt-5.5) via opencode.json. NO Anthropic key ever. Separate API usage from codex adapter.

Separation: Dedicated for CEO / Opus-shaped work. Declared in paperclip-tro/agents/ceo/AGENT.md as `adapter: fcc-claude`. All agents must use distinct adapter+provider per adapters/*/manifest.yaml (pi, fcc-claude, codex, opencode, etc).

Files for this adapter:
- manifest.yaml (this mapping)
- README.md (separation rules)

Health: fcc-claude --version (requires fcc-server running).
