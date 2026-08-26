---
name: paperclip-capability-baseline
description: MCPs, skills, and adapters every Paperclip agent gets - wired 2026-08-25
type: capability
created: 2026-08-25
---

# Paperclip Capability Baseline

All [[node-9020]] agents inherit these through Paperclip tool connections (company-wide installs) — verified live 2026-08-25.

## Tool connections (Paperclip → MCP)

| Connection | Transport | Health |
|---|---|---|
| brain-mcp | local_stdio (template `brain-mcp`) | ok |
| mission-mcp | local_stdio (template `mission-mcp`) | ok |
| antigravity-files | local_stdio (template `antigravity-files`) | ok |
| playwright | local_stdio (template `playwright-mcp`) | ok |
| omniroute | mcp_remote `:20128/api/mcp/stream` | needs API-key secret binding (UI) |
| supabase | mcp_remote | needs OAuth reconnect (UI) |

Company: ANTIGRAVITY Marketing Co (`92223de0`). Connections installed company-wide → every agent's runtime receives them (`buildPaperclipRuntimeMcpServers`).

**Always-on guarantee (wired 2026-08-25):** tool profile `always-on-mcp` (6 include entries, default deny) bound at company scope + unscoped gateway `always-on-mcp-gateway` (applies to every run). Runtime injection requires a permitting profile — installs alone deliver nothing. CEO agent carries the `ceo-standing-session` skill as a desired skill.

## Skills

87 company skills imported from `.agents/skills/` via `POST /skills/scan-projects` (mode import, 70 new, 15 already present). Includes the standing set: caveman, i-have-adhd, self-improving-system, agent-reach, brainstorming, writing-plans, TDD, verification-before-completion.

## Adapters

- `freebuff_local` — external adapter (Buffy CEO via Freebuff session), installed from `ops/paperclip-ceo/adapter-freebuff`. See [[scc-paperclip]] for the board topology.
- Native: hermes_local, openclaw_gateway, opencode_local, codex_local, grok_local, gemini_local, claude_local.

## Knowledge graph

This vault (`nodes/9020/vaults/knowledge/`) is the shared knowledge graph for all agents — Obsidian-compatible, wiki-linked. Read/write via the antigravity-files MCP. Facts go here; session noise goes to journals.
