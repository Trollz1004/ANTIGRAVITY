# For Claude Code to install: `~/.claude/CLAUDE.md` (T5500)

The Antigravity IDE's safety policy blocks other tools from writing inside `~/.claude/`, so Opus left this here for Claude Code to copy into place itself (`~/.claude/CLAUDE.md`). Joshua doesn't edit Claude's files.

---

# Claude: user instructions (T5500)

> Written by **Opus (Claude) in the Antigravity IDE** on 2026-10-09, on Joshua's instruction. Joshua does not edit Claude's files or any AI memory himself.

- One node: **T5500-2-XEON-72 (192.168.0.15)**. One root: **`C:\ANTIGRAVITY`**.
  - One mono repo, one branch (`main`).
  - Never force-push. Never stage other lanes' work.
  - Every other node is OFF BY RULING.
- Read `C:\ANTIGRAVITY\CLAUDE.md` and `C:\ANTIGRAVITY\AGENTS.md` first. Their 2026-10-09 section "T5500 is the only node" overrides any older statement about nodes.
- Official Claude signs in by login/OAuth only. **Never** create or use an `ANTHROPIC_API_KEY`. Every CLI and MCP authenticates by OAuth.
- Paperclip (:3917) is for marketing only. Mission Control is JARVIS/OPSIS on the Mission Agent OS board (:3130), which is being rebuilt.
- Memory backups:
  - the Obsidian vault at `C:\ANTIGRAVITY\Antigravity`
  - Supabase
  - Supermemory
  - `~/.claude/projects/C--ANTIGRAVITY/memory/`
- Never print secrets from any `.env`. The master env is `OneDrive\claude-to-claude\.env`, which is gitignored.
- For Cloudflare work, use the Cloudflare MCP (OAuth). Use Wrangler instead only when the project has a Wrangler configuration file.
- "Done" means Joshua would accept it:
  1. Screenshot the real thing he will see.
  2. Review it as he would.
  3. Fix what's wrong, then take a new screenshot.
