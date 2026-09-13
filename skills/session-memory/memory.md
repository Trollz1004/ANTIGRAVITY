---
last_session: 2026-09-13
total_sessions: 6
model: stepfun/step-3.7-flash
provider: nous
omniroute: http://192.168.0.8:20128/v1
node: alienware
tablet: false
primary_node: alienware
applets: 14
custom_skills: 12
caveman_skills: 7
---

# Session Memory Log

## 2026-09-07

### Decisions
- Set Nous free models as primary provider (stepfun/step-3.7-flash)
- Connected Sabertooth Omniroute for sub-agents/auxiliary
- Removed ollama-launch provider (already in Omniroute endpoint)
- Created session-memory skill with Obsidian integration
- Created 12 custom topic-based skills from skills.sh categories
- Installed caveman skills from skills.sh (caveman, caveman-commit, caveman-review, caveman-compress, caveman-stats, caveman-help, cavecrew)
- Installed interface-kit, grill-me, context-canary from JuliusBrussee/skills
- Created brainstorm skill (structured ideation)
- Created youtube-automation skill
- Updated dashboard HTML with skills + applets

### Custom Skills Created
- `brainstorm` — Structured brainstorming with scoring
- `frontend-react` — React 19 patterns, hooks, performance
- `nextjs` — App Router, RSC, caching, middleware
- `design-ui` — Design systems, shadcn, accessibility
- `mobile` — React Native, Expo, iOS/Android
- `agent-workflow` — Multi-agent orchestration, delegation
- `database` — PostgreSQL, Supabase, RLS, migrations
- `testing` — TDD, Playwright, unit/integration/e2e
- `marketing` — SEO, copywriting, CRO, growth
- `youtube-automation` — Upload, SEO, thumbnails, analytics
- `session-memory` — Session start/end with Obsidian

### Caveman Skills Installed
- caveman, caveman-commit, caveman-review, caveman-compress, caveman-stats, caveman-help, cavecrew

### Changes
- `model.provider` → `nous`
- `model.default` → `stepfun/step-3.7-flash`
- `model.base_url` → cleared (Nous Portal)
- `delegation.base_url` → `http://192.168.0.8:20128/v1`
- `auxiliary.*.base_url` → `http://192.168.0.8:20128/v1`
- Removed `providers.ollama-launch` section

### Carry-forward TODOs
- [ ] Add more skills.sh topic skills as needed
- [ ] Update Obsidian vault path when configured
- [ ] Monitor Nous free model availability

## 2026-09-11 (Claude Code, Alienware node 192.168.0.40)

### Decisions
- Added `CLAUDE.md` (repo guide and session protocol) and a global `~/.claude/CLAUDE.md`.
- Every session: read memory at start, then activate caveman, brainstorm and test-driven-development. Write memory at end.
- Claude and Codex are the only judge lanes with push and merge permission. Claude pushes and merges its own work.
- 90% pass rule: merge only when at least 90% of the affected tests pass.
- This machine is the Alienware node (192.168.0.40), host of the Dream Online MMO and the dashboard. OmniRoute (:20128/v1) is on Sabertooth (192.168.0.8), not here.

### Changes
- `CLAUDE.md` (new), `skills/session-memory/memory.md` (this block)
- Outside the repo: `~/.claude/CLAUDE.md`, and Claude project memory (session-protocol, git-authority, pass-rule-90, node-alienware)

### Lessons
- The jarvis test suite on master passes 32/35. `tests/crosslisting.test.js` hardcodes a stale temp `pkgRoot`. Set `CROSSLISTING_ROOT` and the suite passes 35/35.
- `gh`, `pnpm` and `python` are not installed on this node.

- Later in the session: the `.env` (gitignored, copied from Sabertooth) was retargeted to this node (node name, IP, root paths). Each unreachable Sabertooth service got a comment. No secret values were touched or printed.
- Fixed the `pkgRoot` default in `dashboard/jarvis/tests/crosslisting.test.js` to a repo-relative path. The jarvis suite now passes 35/35.
- The user works from this node about 99% of the time. A new Obsidian vault for this node is planned.
- The user is upgrading to Windows 11 right after this session.

### Carry-forward TODOs
- [ ] Create the new Obsidian vault for the Alienware node, then set `OBSIDIAN_VAULT_*` and `OBSIDIAN_REST_URL` in `.env`
- [ ] Make `dashboard/jarvis/server.mjs` read `NODE_LAN_IP` from `.env`. It reads only `process.env` today, and its default is still 192.168.0.8
- [ ] Install pnpm (`corepack enable`) and get a crosslisting test baseline
- [ ] Push `master` to origin. The user must sign in to GitHub once (Git Credential Manager has no stored login)
- [ ] After the Windows 11 upgrade, re-check node, git and credential setup
- [ ] Park Paperclip in `.env`: comment out the `PAPERCLIP_*` lines, keep the values so it can be undone, and add a note. The user stopped using it (waste of time) and let Claude decide. Decision: do not use Paperclip for Dream Online NPCs. It is an agent org-chart and ticket tool, not a real-time runtime. Run NPC AI in the game server with a local LLM on the RX 6800 (Vulkan/ROCm) or through OmniRoute.
- [ ] Dream Online NPCs: the user proposed Hermes profiles as NPCs (isolated SOUL, memory and skills, 24/7). Claude recommended a hybrid: hero NPCs as Hermes profiles, crowd NPCs scripted, game server authoritative. Decide, then prototype one NPC profile. The user said either way works through webhooks. **Next step:** after the Windows 11 restart, the user will copy the existing Dream Online files from Sabertooth's D: drive (`D:/CLAUDE's-N-Joshua's-Dream-Online-MMORPG`, `D:/DREAM ONLINE` vault) to this node. Claude then reviews them and decides the NPC architecture. Update `DREAM_REPO_DIR` in `.env` to the new path.
  - **Done:** the files are already on this node through OneDrive (`%OneDrive%\DREAM-ONLINE-BACKUP-2026-08-05`). Live NPC Lab passes 10/10 test files. **Decision:** Hermes profiles become a webhook provider inside Live NPC Lab's provider seam, handling named and story NPCs. T0 ambient NPCs use Ollama on the RX 6800. Hermes acts as director and batch runner for world actors. Sup@ stays Claude. The lab keeps authority over allowlist, timeout and fallback.
- [ ] Clone `Trollz1004/dream-online` to `C:\DREAM\dream-online` (needs the GitHub sign-in). Set `DREAM_ROOT` and `DREAM_REPO_DIR`.
- [ ] Use TDD to add a disabled-by-default `hermes` provider to `game/server/live-npc-lab/src/providers.js`. Measure latency against the 3-second budget.
- [ ] Fix the port clash: the Hermes dashboard owns :9119 on this node (confirmed, python). Move the DreamOps Bridge default to 9219 and update the Dream port doc, STATE and README.
- [ ] After the GitHub sign-in, search all Trollz1004 repos (start with `Trollz1004/ANTIGRAVITY` `.agents/skills`, from Fable) for game-dev skills. **Read-only for ANTIGRAVITY:** it stays as it is for the date app and cloudflared tunnels, so never clone it as a working tree here and never push to it. Copy only the skill folders, with their source commit. Install them into Hermes (`%LOCALAPPDATA%\hermes\skills`) and Claude.
- [ ] Unreal: the engine is not installed on this new PC, and Hermes has no MCP configured. Install Unreal only with the user's explicit approval (Dream rule), then set up the Unreal MCP in Hermes `mcp_servers`.
- [ ] Security: `ONEDRIVE-INDEX.md` lists mandatory key rotations from 2026-09-02 (Supabase, OmniRoute and others). Check with the user whether the `.env` copied from Sabertooth still holds unrotated values.
- [ ] Rewrite `README.md` for this node. Remove `termux-open` and the `scripts/` folder that does not exist. Add the jarvis and crosslisting run steps for Windows.
- [ ] Sweep the other docs and skills for Sabertooth, Termux or tablet assumptions and fix them for the Alienware node

## 2026-09-11 (Copilot CLI, later same day, Alienware node 192.168.0.40)

### Decisions
- Windows 11 upgrade is done on this node (was Windows 10). Updated `CLAUDE.md` nodes table.
- Root-caused Ollama's "AMD driver is too old" warning: `detectOldAMDDriverWindows()` in ollama v0.34.0 (`discover/amd.go`) fires when `amdhip64_6.dll` is on PATH but `amdhip64_7.dll` (HIP 7 runtime) is missing. Confirmed on this node: hip6 present in System32, hip7 absent. The installed driver (32.0.21045.5002, 2026-08-16) is recent but predates the HIP 7 switch, so the message is accurate from Ollama's side.
- Chose the full WHQL Adrenalin 26.9.1 (Windows 11) package over the auto-detect web stub, since the machine is now Windows 11.
- Meanwhile, GPU inference already works: `ollama serve` detects the RX 6800 (16 GiB) over Vulkan (`OLLAMA_VULKAN:true`) and sets a 4096 default context.
- Cloned `Trollz1004/dream-online` to `C:\DREAM\dream-online` (public HTTPS clone, no credential prompt needed). This completes the clone half of the carry-forward TODO.
- `.env` was NOT read or edited this session, per the user's reminder ("Claude has not edited that env yet... no paperclip"). The paperclip-parking TODO stays pending until the user gives the go-ahead.

### Changes
- `CLAUDE.md` (Windows 10 -> Windows 11 in the Alienware row), `skills/session-memory/memory.md` (frontmatter + this block)
- Outside the repo: `C:\DREAM\dream-online` (new clone); `Downloads\whql-amd-software-adrenalin-edition-26.9.1-win11-a.exe` (986,362,744 bytes, Authenticode Valid, signed by Advanced Micro Devices, DigiCert-timestamped); AMD installer launched

### Lessons
- amd.com driver pages time out for plain fetches; `curl.exe` with a browser UA and referer works. `drivers.amd.com` direct links stall at 0 bytes without a UA/referer header.
- "AMD driver is too old" in Ollama can mean "HIP 7 runtime DLL missing", not literally an old WDDM driver. Check `System32\amdhip64_6.dll` vs `amdhip64_7.dll` first.
- Native git stderr ("Cloning into...") surfaces as PowerShell RemoteException noise — cosmetic, not an error.

### Carry-forward TODOs
- [ ] User approves and finishes the Adrenalin 26.9.1 install (installer window is open, waiting on UAC/click-through), then reboots. After reboot: rerun `ollama serve`, confirm `amdhip64_7.dll` exists, and check the ROCm path appears with no "driver too old" warning.
- [ ] Set `DREAM_ROOT` / `DREAM_REPO_DIR` in `.env` to `C:\DREAM\dream-online` — only with the user present, since they asked to be careful with `.env` edits.
- [ ] Remaining items from the earlier 2026-09-11 block (Obsidian vault, jarvis `NODE_LAN_IP` from `.env`, pnpm, GitHub sign-in + push, port clash, README rewrite, docs sweep).

## 2026-09-12 to 2026-09-13 (Claude Code, Alienware node 192.168.0.40)

### Decisions
- JARVIS tab became the God's Eye HUD: interactive globe, a live Nodes panel fed by `GET /api/nodes` (identity-checked probes of both LAN nodes), a brain selector (OmniRoute, Claude CLI, Ollama, Hermes) with streamed replies and a session badge, push-to-talk on the globe (`js/jarvis/voice.js`).
- Claude CLI bridge: `POST /api/claude/chat` runs the official `claude -p --output-format stream-json` on account auth and streams Server-Sent Events. Local-only unless `DASHBOARD_BRIDGE_TOKEN` is set; permission ceiling `plan`; `.env` files denied to the CLI; one run at a time; child killed when the socket closes. Ollama and Hermes are brains through the same SSE contract.
- Delegation rule (Joshua, after hitting his Claude usage cap): the judge lane writes cards and judges, Hermes implements. Cards run detached through `hermes chat --query-file <file> -Q --oneshot -c <session> --create-if-missing`; Hermes returns a `HERMES REPORT` block. Config edits are done directly, never delegated.
- One rulebook per platform: `AGENTS.md` is canonical in this repo, in `C:\DREAM` and in dream-online; `CLAUDE.md` and `GEMINI.md` import it, `.github/copilot-instructions.md` and Hermes `SOUL.md` point at it. The Agency Agents app owns `C:\DREAM\.agents\skills` and the per-platform agent files. Repo skills stay in their folders.
- Hermes on this node runs on Joshua's sign-ins, never OmniRoute for the main model: `openai-codex` / `gpt-5.6-terra`, fallbacks luna, Grok, Nous; `delegation` uses OmniRoute `auto/best-fast`. `unreal-engine` MCP registered (down until Unreal 5.8 runs its MCP server). `hermes config set model.default codex/...` flips the provider silently; edit `config.yaml` instead.
- Self-healing supervisor `scripts/dream-stack.ps1` (Pester 11/11, live 7/8 up) with the logon Scheduled Task "DREAM Stack".
- Claude Code plugins installed at user scope to mirror Sabertooth: `claude-obsidian` and `supermemory`. Obsidian MCP registered but unreachable until the Local REST API's HTTP server is on.
- Dream Online: Hermes built the disabled-by-default webhook provider in Live NPC Lab; judged, merged to `main`, pushed.

### Changes
- hermes: `dashboard/jarvis/lib/{config,nodes,claude-bridge,bridge-routes,ollama}.mjs`, `server.mjs`, `index.html`, `js/jarvis/{jarvis,claude-bridge,voice}.js`, `js/app.js`, `css/jarvis.css`, tests (11 files, 111 passing), `tests/fixtures/claude-stream.ndjson`, `scripts/dream-stack.{ps1,cmd,Tests.ps1}`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.gitignore`. Merged to `master` and pushed.
- dream-online: `AGENTS.md` (canonical), `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, Live NPC Lab Hermes provider, `.gitignore` for runtime state. Merged to `main` and pushed.
- Outside the repos: `C:\DREAM\{AGENTS,CLAUDE,GEMINI}.md`, `C:\DREAM\.github\copilot-instructions.md`, Hermes `config.yaml` + `.env` (`HERMES_CUSTOM_OMNIROUTE_API_KEY`), Hermes `SOUL.md`, Scheduled Task "DREAM Stack", Claude Code plugins and the `obsidian` MCP entry, project memory files.

### Lessons
- Node's request and response `close` events fire while a browser is still connected (about 250 ms after the headers); only the socket's `close` means the client is gone. Curl and Node fetch hid the bug because their events fired before the handler was registered.
- A page that speaks its greeting speaks through the real speakers even from a headless test browser; mute `speechSynthesis` in test harnesses.
- `git commit -- <paths>` commits only tracked paths. Never switch branches in a checkout another agent is editing; merge through a temporary worktree. Bash keeps its last `cd`, so use explicit repo paths (`git -C`).
- `OLLAMA_API` in the repo `.env` is a key, not a URL; the Ollama base comes from `JARVIS_OLLAMA_URL` or `OLLAMA_HOST`.

### Carry-forward TODOs
- [ ] Card 3 for Hermes (conversation panel, number-key brain switching, `?` shortcuts, `/api/owner` greeting).
- [ ] Obsidian: enable the Local REST API's plain-HTTP server (or install `vault-curate`) so the `obsidian` MCP connects; enable the Obsidian CLI; set `OBSIDIAN_VAULT_*` in `.env` to `C:\DREAM\AlienwareDream`.
- [ ] `SUPERMEMORY_API_KEY`: wire the key Joshua keeps in `.env` into the supermemory plugin and Hermes' memory provider.
- [ ] Unreal Engine 5.8 install needs Joshua's explicit approval; then enable the Unreal MCP plugin (Auto Start Server) and restart Hermes.
- [x] "free buff" resolved: FreeBuff is a separate free coding-agent CLI (`npm -g freebuff`), a non-judge implementation lane, not a Hermes provider.
- [ ] README.md rewrite for this node, docs sweep for Sabertooth/Termux assumptions.
- [ ] Next Dream Online slices: `ollama-local` provider for T0 ambient NPCs; Sup@ on the real Claude CLI using the bridge's `buildClaudeArgs`/`childEnv`/`killTree` pattern.

## 2026-09-13 (Freebuff, Alienware node 192.168.0.40)

### Decisions
- Installed Freebuff Desktop (Electron app from CodebuffAI) on this node, not just the `npm -g freebuff` CLI lane.

### Changes
- Downloaded the Windows x64 installer via `https://freebuff.com/api/desktop/download/windows` to `Downloads/FreebuffSetup.exe` (153 MB, Nullsoft, unsigned build), ran it with `/S` silent install. App at `%LOCALAPPDATA%\Programs\@codebufffreebuff-desktop\Freebuff.exe` with Start Menu shortcut; launched and confirmed running (6 processes).

### Lessons
- Freebuff's download links live at `/api/desktop/download/{windows,windows-arm64,windows-baseline,mac-arm64,mac-intel,linux,linux-arm64}`; the GitHub `CodebuffAI/freebuff` releases are CI tarballs (`codecane-*`), not installers.
- The `windows-baseline` build is for CPUs without AVX2 (error 3221225501 at startup); i7-11700F needs the standard x64 build. Builds are unsigned: Windows SmartScreen needs More info → Run anyway.

### Carry-forward TODOs
- [ ] User signs in to Freebuff Desktop (GitHub or Google) on first launch.

## 2026-09-13 — Freebuff (Buffy): dashboard is mission control; JARVIS memory; FreeBuff lane boundaries
- **Mission control IS the dashboard.** Sabertooth :3151 iframe embed deleted; Mission Control tab = live identity-checked board (both nodes, honest DOWN rows). No mock/dead content anywhere — rule enforced by test.
- **JARVIS memory shipped (TDD):** lib/jarvis-memory.mjs (30-entry cap, trimmed bodies, corrupt-store healing); bridge captures every jarvis-persona turn (result/error/exit); memory composed into every hud:true preamble; GET /api/jarvis/memory; /data denied as static. Verified live: turn captured + recalled.
- **FreeBuff boundaries confirmed by probing:** freebuff@0.0.174 CLI is a TUI launcher only — no headless mode, no local API, no OpenAI-compatible endpoint. It CANNOT be a Hermes provider or a JARVIS chat brain. Wired as a launch option instead: POST /api/launch/freebuff (503 when absent) + Agents-tab button beside the Agency Agents roster note. ANTIGRAVITY repo shows FreeBuff ran as "freebuff-ceo" subagent (journals + SOUL.md in .agents/) — that's Claude-Code-harness, not the npm CLI's own doing.
- **Hermes config paste:** told Joshua what to change (current model stays openai-codex/gpt-5.6-terra; omniroute stays sub-agents-only; freebuff is not a provider — nothing to paste for it).
- Suites: jarvis 148/148. Commits: eb2d4ff (dock+context), d4d90bd (memory+freebuff+mission board) on feat/jarvis-gods-eye — awaiting judge lane merge (Claude Code or Codex).
- Carry-forward: mission-control-v5 boot deferred (cloned at C:\ANTIGRAVITY); Hermes "5 commits behind — run hermes update"; Unreal MCP still down until UE 5.8; judge lane needed for merge+push.
