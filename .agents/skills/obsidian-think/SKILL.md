---
name: obsidian-think
description: Structured reasoning and hypothesis synthesis over the authoritative Obsidian vault graph (T5500 C:\ANTIGRAVITY\Antigravity, Alienware C:\ANTIGRAVITY\Antigravity, Sabretooth C:\Ai-Dream-Team\Antigravity) before making architectural or operational decisions.
category: memory-layer
---

# Obsidian Think (`obsidian-think`)

Use this skill at session start and before mutating system state to ground reasoning in verified vault notes and git history.

## Vault Paths per Node
- **T5500 (`192.168.0.15`)**: `C:\ANTIGRAVITY\Antigravity` (root note `00 HOME.md`)
- **Alienware (`192.168.0.40`)**: `C:\ANTIGRAVITY\Antigravity` (root note `00 HOME.md`)
- **Sabretooth**: `C:\Ai-Dream-Team\Antigravity` (root note `00 HOME.md`)

## Procedure
1. Read `00 HOME.md` and your per-agent note (`<NODE>/<agent>-to-<agent>.md`) via `obsidian_antigravity` MCP (`get_vault_file`, `search_vault_simple`, `get_backlinks`).
2. Cross-check vault notes against git-committed Markdown. When anything disagrees with git, git wins.
3. Record verified hypotheses and decisions back into the vault using `obsidian-save`.
