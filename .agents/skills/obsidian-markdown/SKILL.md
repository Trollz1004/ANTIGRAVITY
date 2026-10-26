---
name: obsidian-markdown
description: Formats notes in the authoritative Obsidian vault (T5500 C:\ANTIGRAVITY\Antigravity, Alienware ~/Documents/Antigravity) using valid Obsidian Flavored Markdown: YAML properties, [[wikilinks]], callouts, and backlinks.
category: memory-layer
---

# Obsidian Markdown (`obsidian-markdown`)

Enforces valid Obsidian Flavored Markdown across all notes written to the node vault.

## Vault Paths per Node
- **T5500 (`192.168.0.15`)**: `C:\ANTIGRAVITY\Antigravity`
- **Alienware (`192.168.0.40`)**: `$env:USERPROFILE\Documents\Antigravity` (`~/Documents/Antigravity`)
- **Sabretooth**: `TBD`

## Formatting Rules
1. Always start notes with YAML frontmatter (`title`, `type`, `tags`, `created`, `updated`, `status`, `summary`).
2. Use `[[Note Name]]` internal wikilinks (anchoring to `[[00 HOME]]`) and `> [!NOTE]` / `> [!IMPORTANT]` callouts.
3. Never embed secret values, API keys, or tokens in any vault note.
