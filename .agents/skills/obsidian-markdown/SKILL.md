---
name: obsidian-markdown
description: Formats notes in the authoritative Obsidian vault (T5500 C:\ANTIGRAVITY\Antigravity, Alienware C:\DREAM\Antigravity) using valid Obsidian Flavored Markdown: YAML properties, [[wikilinks]], callouts, and backlinks.
category: memory-layer
---

# Obsidian Markdown (`obsidian-markdown`)

Enforces valid Obsidian Flavored Markdown across all notes written to the node vault.

## Vault Paths per Node
- **T5500 (`192.168.0.15`)**: `C:\ANTIGRAVITY\Antigravity`
- **Alienware (`192.168.0.40`)**: `C:\DREAM\Antigravity`
- **Sabretooth**: `C:\Ai-Dream-Team\Antigravity`

## Formatting Rules
1. Always start notes with YAML frontmatter (`title`, `type`, `tags`, `created`, `updated`, `status`, `summary`).
2. Use `[[Note Name]]` internal wikilinks (anchoring to `[[00 HOME]]`) and `> [!NOTE]` / `> [!IMPORTANT]` callouts.
3. Never embed secret values, API keys, or tokens in any vault note.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).
