---
name: obsidian-think
description: Structured reasoning and hypothesis synthesis over the authoritative Obsidian vault graph (T5500 C:\ANTIGRAVITY\Antigravity, Alienware ~/Documents/Antigravity) before making architectural or operational decisions.
category: memory-layer
---

# Obsidian Think (`obsidian-think`)

Use this skill at session start and before mutating system state to ground reasoning in verified vault notes and git history.

## Vault Paths per Node
- **T5500 (`192.168.0.15`)**: `C:\ANTIGRAVITY\Antigravity` (root note `00 HOME.md`)
- **Alienware (`192.168.0.40`)**: `$env:USERPROFILE\Documents\Antigravity` (`~/Documents/Antigravity`, root note `00 HOME.md`)
- **Sabretooth**: `TBD`

## Procedure
1. Read `00 HOME.md` and your per-agent note (`<NODE>/<agent>-to-<agent>.md`) via `obsidian_antigravity` MCP (`get_vault_file`, `search_vault_simple`, `get_backlinks`).
2. Cross-check Supermemory recall (`search_memory` in `repo_antigravity__02249b9e7104105f`) against git-committed Markdown. If Supermemory disagrees with git or the vault, git wins and the stale recall entry must be forgotten.
3. Record verified hypotheses and decisions back into the vault using `obsidian-save`.
