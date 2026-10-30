---
name: obsidian-save
description: Saves verified session findings, architectural decisions, and learnings into the authoritative node Obsidian vault (T5500 C:\ANTIGRAVITY\Antigravity, Alienware C:\ANTIGRAVITY\Antigravity, Sabretooth C:\Ai-Dream-Team\Antigravity) backed by git.
category: memory-layer
---

# Obsidian Save (`obsidian-save`)

Obsidian is the authoritative agent memory layer (backed by git). Every agent writes what it learns at session end.

## Vault Paths per Node
- **T5500 (`192.168.0.15`)**: `C:\ANTIGRAVITY\Antigravity` (root note `00 HOME.md`, Obsidian Sync)
- **Alienware (`192.168.0.40`)**: `C:\ANTIGRAVITY\Antigravity` (root note `00 HOME.md`, Obsidian Sync)
- **Sabretooth**: `C:\Ai-Dream-Team\Antigravity` (root note `00 HOME.md`, Obsidian Sync)

## Procedure
1. Read your per-agent vault note (`<NODE>/<agent>-to-<agent>.md` or topic note linked from `00 HOME.md`) via the `obsidian_antigravity` HTTP MCP server (`get_vault_file`) or direct file read.
2. Append a timestamped Markdown entry with YAML frontmatter (`title`, `type`, `tags`, `created`, `updated`, `status`, `summary`). Never overwrite prior entries and never write secrets, keys, or tokens. Obsidian plus git only; git wins over everything.
