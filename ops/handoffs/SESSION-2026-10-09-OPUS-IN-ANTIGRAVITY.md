# Session 2026-10-09 — T5500 boot, Paperclip, agent CLIs

**Who did the work:** Claude Opus 5.5, running inside the Antigravity IDE on Joshua's Google
Ultra plan (Gemini API usage, not an Anthropic API key). Claude, in spirit and in fact.
Joshua directed every step.

## Done and verified

- **Restart check (date app):** T5500 booted 00:00:51. Keepalive came up 00:01:26 and healed
  Ollama → Postgres → Redis → domains :9160 → frontend :3200 → API :8000 → tunnel by 00:05:40
  with no hand-start (`logs/t5500-keepalive.log`).
- **HERMES and OPENCLAW windows on logon:** new scheduled task `ANTIGRAVITY Agent Windows`
  runs `ops/t5500/agent-windows.ps1`, which opens and reopens both terminals.
  - HERMES = `ops/t5500/hermes-support.ps1 -Console` (customer support only).
  - OPENCLAW = `ops/t5500/openclaw-sentry.ps1` (watchdog view; restarts the keepalive if it stalls).
  - Before logon the keepalive runs Hermes hidden; after logon it hands off to the window.
- **Paperclip fixed port 3917** (was 3100 and drifted to 3101+): `paperclipai@2026.1005.0`
  installed globally; `~/.paperclip/instances/default/config.json` server.port = 3917;
  launcher `ops/paperclip/start-paperclip.ps1` clears squatters and drifted copies;
  keepalive stage `paperclip` probes `/api/health`. Live references 3100 → 3917 swapped in
  code, skills and standing prompts; dated evidence/rulings left as history.
- **Agent CLIs (all OAuth login, no API keys):** claude 2.1.278, codex 0.162.0, gemini 0.63.0,
  grok 1.0.50, pi 1.0.4, opencode 1.18.35, kimi 2.1.1, agy 1.2.17. No API-key env vars set.
- **Gemini lane on Ultra:** Paperclip gemini_local agents use
  `ops/paperclip/agy-gemini.cmd` (translates gemini-cli flags/output to `agy`).
- **OpenCode → Ollama:** `~/.config/opencode/opencode.json` has provider `ollama`
  (127.0.0.1:11434) with Fable, CFO, dateapp-marketing, qwen3.5, ornith, egoist.

## Later the same night (all on the T5500)

- **Paperclip UP** on :3917 under non-elevated logon task (never as admin: embedded Postgres refuses).
- **OmniRoute** installed fresh (`omniroute@3.8.51`, old data kept in `~/.omniroute`), task `ANTIGRAVITY OmniRoute`, dashboard password reset by Joshua's choice.
- **Keep-alive stages added:** OmniRoute (heal via task), Obsidian REST :27123, Supabase, Supermemory, Vercel (cloud probes cached 10 min, plain User-Agent because Supabase secret keys refuse browser-like agents). Agent-windows supervisor now also opens Obsidian on vault `Antigravity`.
- **Env sync** (backups `*.bak-20261009-t5500sync`): master `OneDrive\claude-to-claude\.env`, `.env.lowercase` twin rebuilt, `C:\ANTIGRAVITY\.env`, `~\.omniroute\.env`. Stale .8/.40/.101 IPs, Sabretooth/Alienware names, :3100, D: paths fixed; retired keys commented, not deleted. One Obsidian vault: `C:\ANTIGRAVITY\Antigravity`.
- **Cloudflare:** onlinerecycle.net and dream-online.net DNS now CNAME to the T5500 tunnel (old IONOS A/AAAA removed, email kept, backups in scratch). Cloudflare skills + MCP added to every agent.
- **MCPs (OAuth, no keys):** Cloudflare, Supabase, Vercel, Supermemory for Claude Code, Antigravity, Codex, OpenCode, Pi. Vercel CLI 63.1.0, Supabase CLI 2.120.0 installed.
- **Doctrine:** T5500-only ruling recorded in `AGENTS.md`, `CLAUDE.md`, `ultracode-house`, `gemini-cobuilder`, `mission-control` skills.

## Open

1. IONOS nameservers for onlinerecycle.net + dream-online.net → `aryanna` / `gerardo.ns.cloudflare.com` (Joshua; IONOS API key is empty).
2. Cloudflare Global API Key on file is rejected → Joshua pastes rotated key; then replace GitHub secret (repo at 91/100).
3. OmniRoute API key rejected on the fresh install → new key from dashboard; Hermes uses edge TTS until then.
4. Rotate secrets that leaked into this session's logs through an audit-script bug (xAI, Vercel, X, Supabase, Supermemory; local Postgres/Redis passwords).
5. Mission Agent OS (:3130) not built yet; Stitch prompts are in `ops/handoffs/STITCH-PROMPT-MISSION-CONTROL-*.md`.
6. `~/.claude/CLAUDE.md`: IDE policy blocks writing it; content waits in `ops/handoffs/CLAUDE-USER-MD-FOR-CLAUDE-2026-10-09.md` for Claude to install.
7. OAuth logins still to do: codex, gemini, grok, kimi, opencode.
8. C drive cleanup: audit still running; nothing deleted yet.
