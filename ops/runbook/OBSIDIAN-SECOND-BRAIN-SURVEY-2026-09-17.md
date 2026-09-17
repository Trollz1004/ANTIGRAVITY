# obsidian-second-brain — survey (2026-09-17)

Repo: `eugeniughelbur/obsidian-second-brain`. MIT license. 4,484 stars. Last push 2026-09-15. Current version 0.16.0.

## What it is

A Claude Code **plugin** (`.claude-plugin/plugin.json` + `marketplace.json`), not a standalone Obsidian plugin. It bundles: a skill (`SKILL.md`), 47 slash commands under `commands/`, three hooks (`hooks/hooks.json`), an optional bundled MCP server (`integrations/obsidian-mcp-server/`), an optional separate Obsidian community plugin for linting (`integrations/obsidian-plugin/`), and adapter scripts (`adapters/*/adapter.sh`) that port the same commands to Codex, Gemini CLI, OpenCode, Hermes, Pi, and Grok Bot. In Claude Code, the vault itself is read/written with ordinary Read/Write/Edit/Glob tools ("Method A" — direct filesystem), not through the MCP server; the MCP server exists mainly for non-Claude-Code clients.

**Install (Claude Code):**
```
/plugin marketplace add eugeniughelbur/obsidian-second-brain
/plugin install obsidian-second-brain@obsidian-second-brain
```
Then either bootstrap a fresh vault (`python scripts/bootstrap_vault.py --path <vault> --name "..."`) or point the skill at an existing one and run `/obsidian-setup` (wires the SessionStart hook) or `/obsidian-init`.

## Auto-write mechanism

`hooks/hooks.json` defines exactly three hooks — **not** Stop, and **not** UserPromptSubmit or PreCompact:

```json
"SessionStart": [{"matcher":"","hooks":[{"type":"command","command":"\"${CLAUDE_PLUGIN_ROOT}/hooks/load_vault_context.sh\""}]}],
"PostToolUse": [{"matcher":"Write|Edit|MultiEdit|NotebookEdit|create_file","hooks":[{"type":"command","command":"\"${CLAUDE_PLUGIN_ROOT}/hooks/validate-ai-first.sh\"","timeout":10}]}],
"PostCompact": [{"matcher":"","hooks":[{"type":"command","command":"\"${CLAUDE_PLUGIN_ROOT}/hooks/obsidian-bg-agent.sh\"","timeout":10,"async":true}]}]
```
- **SessionStart** — injects `_CLAUDE.md` (the vault's operating manual) into context; read-only, capped at 10,000 characters by Claude Code.
- **PostToolUse** (Write/Edit/MultiEdit/NotebookEdit) — runs `validate-ai-first.sh` after every write, checking the note against the AI-first schema.
- **PostCompact** — fires `obsidian-bg-agent.sh` asynchronously after context compaction (background vault maintenance).

Actual note-writing happens through the 47 slash commands, not the hooks — e.g. `/obsidian-save` (decisions/people/tasks/ideas from the conversation), `/obsidian-daily`, `/obsidian-ingest` (rewrites 5–15 existing pages per source instead of only appending), `/obsidian-person`, `/obsidian-task`, `/obsidian-log`, `/obsidian-board`, `/obsidian-reconcile` (resolves contradictions), `/obsidian-synthesize` (cross-source pattern pages). Four scheduled agents (morning brief, nightly consolidation, weekly review, vault-health) also write.

## Note conventions

Two selectable vault layouts (`references/vault-schema.md`): **wiki-style** (`raw/` immutable sources; `wiki/entities|concepts|projects|daily|logs|reviews|tasks|decisions/`; `boards/`) or **Obsidian-style** (`Daily/`, `People/`, `Projects/`, `Boards/`, etc.). The folder for any note type is resolved from a `## Folder Map` table in the vault's `_CLAUDE.md` first, wiki-style defaults otherwise (`references/folder-map.md`).

Frontmatter is mandatory and rich: `type`, `date`, `tags`, `ai-first: true`, plus type-specific fields, and a `timeline:` bi-temporal array (`fact/from/until/learned/source`) so old values are never deleted, only superseded. Every note opens with a "## For future agent" preamble, uses `[[wikilinks]]` for cross-links, carries recency markers per claim and verbatim sources, and updates `index.md` plus an append-only operation log (`log.md` or `Logs/YYYY-MM-DD.md`).

## Vault configuration and runtime

No required env var for native Claude Code use (vault path is just told to the skill / stored via `/obsidian-setup`). The optional MCP server reads `OBSIDIAN_VAULT_PATH`. A toolkit config lives at `$HOME/.config/obsidian-second-brain/.env` (overridable via `OBSIDIAN_ENV_FILE`). Runtime: **bash** scripts throughout (hooks, adapters, install/update scripts) plus **Python 3** (hook payload processing, bootstrap, research, eval scripts) and **uv** (pins the MCP server's `mcp<2` and serves as a Python fallback).

## Windows fit

Actively supported as of "v0.15 — The Port" (Sept 2026): Windows paths, CRLF/BOM handling, UTF-8, and a `USERPROFILE`-aware home resolver (`scripts/platform-home.sh` detects `MINGW*/MSYS*/CYGWIN*` via `uname -s` and reads `USERPROFILE` over `HOME`). The SessionStart wrapper (`load_vault_context.sh`) specifically works around the Microsoft Store `python3.exe` alias trap by probing `python3`, `python`, `py -3`, then `uv run` in turn. There is a dedicated `tests/test_windows_compat.py`. Caveat: everything ships as `.sh` — it needs a POSIX shell (Git Bash/MSYS/Cygwin), not native PowerShell/cmd. This node's Bash tool is Git Bash, so the hooks are runnable here as-is.

## Overlap with existing tooling — real, not cosmetic

This node already runs **claude-obsidian** (agricidaniel, v2.1.1, cached at `~/.claude/plugins/cache/agricidaniel-claude-obsidian`, read-only on native Windows per prior finding) with its own `wiki`, `wiki-ingest`, `wiki-lint`, `wiki-query`, `save`, `think`, `canvas`, `autoresearch` skills — a comparable "vault as second brain" pattern. It also already has the project's own `obsidian-graph-query` and `workspace-memory` skills covering session-memory and vault-graph lookups. `obsidian-second-brain` would add a *third* system with its own SessionStart/PostToolUse hooks, its own wiki-folder schema, and its own save/ingest/reconcile verbs on the same vault. Installing it alongside claude-obsidian risks: two competing SessionStart hooks, two incompatible frontmatter/folder conventions both claiming `wiki/`, and duplicate-purpose commands. **Verdict: overlaps significantly — do not run both unmodified on the same vault.**

## Local state confirmed

- Obsidian's vault list (`obsidian.json`) shows only `C:\ANTIGRAVITY\Antigravity` and `D:\DREAM ONLINE`; no paid Sync config found, but `obsidian-livesync`, `gdrive-bisync`, and `github-sync-multi-platform` are installed community plugins — i.e. free/self-hosted sync is already in use, not paid Obsidian Sync.
- `C:\ANTIGRAVITY\Antigravity` is **not** tracked by git: `.gitignore:126` excludes `ANTIGRAVITY/` (confirmed via `check-ignore` on both the folder and a file inside it; `git ls-files` returns nothing). So the vault sits *inside* the repo's working tree but is deliberately excluded — a "vault-inside-repo, gitignored" layout, not repo-inside-vault. Installing the plugin (which lives under the user's `~/.claude/plugins`, outside the vault) and pointing it at this path is git-safe: no risk of vault notes leaking into repo history. Note history/durability then depends entirely on the Obsidian sync plugins above, not on git.

## Obsidian Sync toggles (reference only — not in active use here)

Per `obsidian.md/help/sync/settings`: default vault-configuration sync carries **Other file types**, **Main settings**, **Appearance**, **Themes and snippets**, **Hotkeys**, **Active core plugin list**, and **Core plugin settings**. Community plugins are separate and off by default — **Active community plugin list** and **Installed community plugin list** must each be toggled on. A second device must enable the same toggles under "Vault configuration sync," then wait for the remote vault to download, then reload/restart the app (force-quit sometimes needed on mobile) before the synced settings take effect. Plugin *data* (per-plugin settings) is not stated to sync via these toggles — only the plugin lists.

## Recommendation

Do not install `obsidian-second-brain` wholesale next to `claude-obsidian` on `C:\ANTIGRAVITY\Antigravity` — the hook slots and wiki-folder conventions collide. Two bounded options: (1) treat it as a **replacement** for claude-obsidian and migrate the vault's existing notes to its AI-first frontmatter/folder schema deliberately, in a copy of the vault first; or (2) skip the full plugin and hand-port only its two most valuable isolated pieces — the SessionStart vault-context injection pattern and the PostToolUse AI-first note validator — into the existing `obsidian-graph-query`/`workspace-memory` skills, avoiding a second competing command surface. Either way, verify it under Git Bash (available on this node) before trusting the SessionStart hook, since its interpreter probe (`python3`/`python`/`py -3`/`uv run`) needs at least one to actually resolve.
