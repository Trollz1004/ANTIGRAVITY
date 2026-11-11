---
name: obsidian-wiki-fold
description: Compacts and folds session logs and scratch notes into canonical wiki pages inside the node Obsidian vault (wiki/ directory linked from 00 HOME.md) while preserving provenance.
category: memory-layer
---

# Obsidian Wiki-Fold (`obsidian-wiki-fold`)

Compacts multi-session logs and Graphy learnings into structured wiki topic notes inside the authoritative Obsidian vault.

## Vault Paths per Node
- **T5500 (`192.168.0.15`)**: `C:\ANTIGRAVITY\Antigravity\wiki`
- **Alienware (`192.168.0.40`)**: `$env:USERPROFILE\Documents\Antigravity\wiki` (`~/Documents/Antigravity/wiki`)
- **Sabretooth**: `TBD`

## Procedure
1. Inspect recent session notes and `wiki/index.md`, `wiki/log.md`, and `wiki/overview.md` via `obsidian_antigravity` MCP (`list_vault_files`, `get_vault_file`).
2. Deduplicate repeated facts into canonical topic notes under `wiki/` and link them from `[[00 HOME]]` and `[[wiki/index]]`.
3. Preserve provenance dates and commit refs so every claim remains traceable via `git log -S`.
