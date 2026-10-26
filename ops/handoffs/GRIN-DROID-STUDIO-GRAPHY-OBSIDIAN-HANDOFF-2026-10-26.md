# Hand-off Note: Grin-Droid-Studio `graphy_workflow` -> Obsidian Authoritative Memory

- **Date:** 2026-10-26
- **From:** `agy` (Task 15 — Obsidian Memory & Hermes Policy Lane)
- **To:** Owning Gemini / `agy` session for `grin-droid-studio` (`C:\Hermesnsfw\grin-droid-studio`)
- **Rule:** Do NOT edit `C:\Hermesnsfw` from outside the owning session. Apply the changes below in the `grin-droid-studio` session.

## Required Changes in `C:\Hermesnsfw\grin-droid-studio`

1. **Make the Alienware Obsidian Vault Authoritative for All Learnings:**
   - Vault path on Alienware (`192.168.0.40`): `C:\Users\NSFW_BOTS\Documents\Antigravity` (root note `00 HOME.md`, synced via Obsidian Sync with T5500 `C:\ANTIGRAVITY\Antigravity`).
   - Local HTTP MCP endpoint on Alienware: `http://127.0.0.1:27200/v1/bda5723a-352c-487c-900e-42de3acc26fd/mcp` with header `Authorization: Bearer ${OBSIDIAN_MCP_TOKEN}` (already distributed to `C:\Hermesnsfw\.env`, `%LOCALAPPDATA%\hermes\.env`, and Windows User env vars under `OBSIDIAN_MCP_TOKEN`, `OBSIDIAN_API_KEY`, and `OBSIDIEN_API_KEY`).

2. **Update `graphy_workflow`, `session_brain_record`, and `add_memory` in `grin_droid_mcp.py`:**
   - Every learning, audit ruling, or `graphy_workflow` checkpoint must write/append valid Obsidian Flavored Markdown (with YAML frontmatter `title`, `type`, `tags`, `created`, `updated`, `status`, `summary` and backlink `[[00 HOME]]`) into `C:\Users\NSFW_BOTS\Documents\Antigravity` (either via MCP tool `append_to_vault_file` / `create_vault_file` on `:27200` or direct atomic Markdown write to `Alienware/grin-droid-to-grin-droid.md` and `memory-graph/`).
   - Never write secret values, API keys, or tokens into any vault note.

3. **Demote Supermemory (`search_memory` / `add_memory`) to Recall-Only:**
   - Keep `search_memory` and `add_memory` (containerTag `repo_antigravity__02249b9e7104105f`) strictly as fast cross-session recall cache.
   - When any recall entry in Supermemory or local `.supermemory/index.jsonl` disagrees with git-committed Markdown or the Obsidian vault, git/Obsidian wins and the conflicting recall entry must be forgotten/purged.
