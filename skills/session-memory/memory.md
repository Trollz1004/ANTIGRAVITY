---
last_session: 2026-09-16
total_sessions: 10
model: z-ai/glm-5.3-flash
provider: freebuff
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

## 2026-09-13 (Hermes Agent, Alienware node)

### Decisions
- The Hermes AI dashboard tab routes through `/api/hermes/chat`, which invokes the named `hermes chat` CLI session and uses Hermes Desktop's configured default model.
- Browser speech remains the text-to-speech source. The dashboard prefers known female English browser voices and safely falls back when no matching voice is installed.

### Changes
- Updated the Hermes voice tab, shared voice selection, JARVIS speech selection, explanatory copy, and focused tests.

### Verification
- `npx vitest run tests/jarvis.test.js tests/claude-bridge.test.js`: 34/34 passed.
- Live `POST /api/hermes/chat` returned `HERMES_BRIDGE_OK` from configured model `gpt-5.6-terra`.
- Full `npx vitest run`: 155/156 assertions passed. An unrelated `tests/nodes.test.js` nameserver-provider assertion failed, and an existing `bridge-routes.test.js` header race raised an unhandled rejection.


## 2026-09-13 (Buffy, FreeBuff judge-lane verification)

### Decisions
- FreeBuff CLI exposes only interactive launch/login options; no verified headless, ACP, MCP, or repository-judge command.
- FreeBuff Desktop is running with a token-gated local bridge on port 52514, but its protocol is undocumented and probes did not establish an agent API.
- GPT authentication is active for this session (`openai/gpt-5.6-luna`), but that does not change repository authority: FreeBuff remains an implementation lane; Claude Code or Codex must review, merge and push.

### Changes
- Completed dashboard overhaul validation without staging, committing or pushing.
- JARVIS suite passes 158/158; Pester passes 12/12; `git diff --check` passes.

### Lessons
- Do not infer ACP/MCP capability from FreeBuff Desktop auth or its CDP bridge. Require a documented protocol and successful authenticated handshake before wiring a judge lane.

### Carry-forward TODOs
- [ ] If Joshua wants FreeBuff as a judge lane, provide its documented ACP/MCP endpoint or protocol; then add a read-only review probe before any merge integration.

## 2026-09-13 (Hermes Agent, Alienware node)

### Decisions
- Created a dedicated `agency-game-designer` Hermes profile cloned from the default profile and made it the sticky default for future plain CLI and gateway runs.
- Applied the same persona to the canonical default profile because the currently running environment is explicitly pinned to that profile.
- Kept the shared runtime/rulebook guardrails and added the requested systems-design persona plus Unreal Engine AI/MCP design context.
- Did not copy Telegram/API channels into the new profile, avoiding duplicate bot credentials and gateway contention.

### Changes
- Outside the repository: canonical `SOUL.md`, `agency-game-designer/SOUL.md`, and the Hermes sticky-profile state.
- Updated the session-memory frontmatter and appended this session block.

### Verification
- `hermes profile create agency-game-designer --clone-from default ...` reported successful creation.
- `hermes profile use agency-game-designer` reported `Switched to: agency-game-designer`.
- `hermes profile show agency-game-designer` confirmed the profile, model, skills, and `SOUL.md` exist.

### Carry-forward TODOs
- [ ] Start/configure the new profile's own messaging gateway only if Joshua wants Telegram or another channel moved to this persona; channels were intentionally not cloned.

## 2026-09-16 — Freebuff (Buffy via Freebuff Desktop), thread 35834531

**Session:** Preview re-registration + three real fixes on `feat/jarvis-gods-eye` (uncommitted; 8 judge-lane commits already queued: eb2d4ff → 8156530).

**Decisions**
- Obsidian REST probe moved to `OBSIDIAN_REST_URL` (default `https://127.0.0.1:27124`, cert-tolerant server-side via `node:https`). Plugin config proves `enableInsecureServer:false` — old `http://:27123` was a dead port, the source of the "Obsidian not working" reports. It reads DOWN honestly whenever Obsidian is closed.
- Crosslisting status moved server-side (`GET /api/crosslisting/status`): the browser can't read :3000 cross-origin, so the old client probe reported a CORS failure as ONLINE. Now: tRPC `system.health` identity-checked server-side, badge renders the verdict verbatim.
- FreeBuff bridge = the ANTIGRAVITY wake-file protocol (`ops/paperclip-ceo/adapter-freebuff`), ported: `GET/POST /api/freebuff/wakes` + `POST /api/freebuff/wakes/:id/done|fail`, wakes dir `.freebuff/wakes` (`FREEBUFF_WAKES_DIR`), gitignored. Verified end-to-end live (create → pending → done report → file updated). CLI still has no headless mode; the user's desktop session is the executor.

**Files changed:** `dashboard/jarvis/lib/nodes.mjs` (insecureTransport, obsidian https, crosslisting identity), `lib/config.mjs` (obsidianRest, crosslisting), `server.mjs` (endpoints from config, getJsonInsecure, crosslisting route, wakeStore), `lib/bridge-routes.mjs` (wake routes), `js/crosslisting.js` (same-origin probe), `js/app.js` (createWake), `index.html` (wake bridge UI), tests for all of the above, `.env` (OBSIDIAN_REST_URL fixed, FREEBUFF_WAKES_DIR), `.gitignore`, `.freebuff/run.md`, `tests/*`.

**Validation:** vitest 174/174 (15 files). Live: /health ok, vault status honest DOWN (ECONNREFUSED, Obsidian closed), crosslisting UP, wake loop green, board renders 3 nodes with DNS labels (youandinotai.com: cloudflare+UP; dream-online.net & onlinerecycle.net: ionos; joshlcoleman.io: no NS).

**Lessons**
- `probeService` DI rule: injected fetch always wins; the tls-tolerant transport applies only when the caller injected nothing — otherwise tests silently hit the network or miss the fake.
- Test-harness conventions here: `document.querySelector('#id')` (no getElementById in the MockElement registry); the harness `calls` array stores `{url, options}`.
- Freebuff desktop auth ≠ a judge lane; the wake-file bridge is the only real FreeBuff integration path (proven on Sabertooth).

**Carry-forward**
- Wake files need the Freebuff desktop session to actually watch `.freebuff/wakes` (user opens a session and picks up pending wakes; done/fail POSTs from the session side are manual today — same as ANTIGRAVITY).
- Sabertooth Date App/Directus/Ludus show DOWN from this node's vantage (LAN firewall); Sentry sees them locally. A Sabertooth-side relay could reconcile.
- Judge lane (Claude Code or Codex) still needs to merge the 8 queued commits.

## 2026-09-16 (2) — ClawX AI Board tab

**Session:** Added the ClawX AI Board to the JARVIS HUD per the vault note "Joshua Claw - ClawX Ai Board": six AI seats vote separately (green/red/abstain), Joshua the founder is the seventh vote and breaks a 3-3 tie. URL https://clawx-aihub-zwxfcstm.manus.space/ linked from the tab.

**Decisions**
- Six real brains, not personas: Hermes one-shot (`clawx-board` session, own tmp query file, 120 s cap) + five Ollama models verified installed on this node (gemma4:e4b, ornith-1.5:9b, deepseek-v4-flash:cloud, glm-5.3-flash:cloud, qwen3:1.7b). Roster lives in server.mjs BRIDGE_DEPS.board.
- Strict vote parsing (`lib/board.mjs` parseVote): YES+NO both present = uncountable → abstain; word boundary rejects "yes-men" (hyphen-aware lookahead). Reason = first informative line, ≤160 chars.
- Tally: ≥4 of 6 cast or NO QUORUM; 3-3 → FOUNDER DECIDES unless founderVote passed, then the founder's side wins. A seat that errors, stalls, or waffles ABSTAINS — never fabricated.
- Route `POST /api/board/vote` in bridge-routes (same-origin gate): per-seat `Promise.race` timeout (seatTimeoutMs, default 120 s) — live-proven needed, cloud Ollama models can stall past 2 min and would hang the vote forever.
- Tab UI mirrors the vault note: one light per seat, verdict line (🟢 PASSED / 🔴 FAILED / 🟡 FOUNDER DECIDES / ⚪ NO QUORUM), founder pre-vote select, ClawX Hub link.

**Files changed:** `dashboard/jarvis/lib/board.mjs` (new), `lib/bridge-routes.mjs` (vote route + exported resolveHermesBinary), `server.mjs` (board brains + hermesBoardAsk), `js/app.js` (callBoardVote), `index.html` (tab; NOTE: a bad cut-and-move briefly ate the crosslisting section tag — restored, section balance now 13/13 and every data-tab has its section, verified by a checker), `css/jarvis.css` (board lights), `tests/board.test.js` (new), `tests/bridge-routes.test.js`, `tests/app.test.js`, `.freebuff/check-tabs.cjs` (helper).

**Validation:** vitest 187/187 (16 files). Live in the preview: two real board votes ran end to end — first exposed a hung seat (3 ABSTAIN after 120 s, honest NO QUORUM), after roster fix: "is red a warm color" → **🟢 PASSED 6-0, zero abstains**, every light green.

**Lessons**
- Ollama's installed-model list drifts (qwen2.5:3b gone; qwen3:1.7b in) — verify `ollama list` before hardcoding a roster.
- Don't restructure HTML with an indexOf cut script; it ate an adjacent section tag. The `check-tabs.cjs` pairing check is the cheap guard.
- Per-seat timeouts are mandatory when a seat is a cloud-routed model.

**Carry-forward**
- Seat roster is static in server.mjs; could move to .env or the agents registry later.
- Founder vote currently comes from the UI select; a real ClawX founder-auth flow would need the operator's identity, out of scope.

## 2026-09-16 (3) — Knowledge Graph as a space galaxy

**Session:** User confirmed the ClawX Board works ("that is a working board, you do nothing, just add it") and asked for the Obsidian Knowledge Graph to be "a space galaxy epic quality". No board changes.

**Decisions**
- Galaxy renderer in `js/app.js`: canvas backdrop (`paintGalaxy`) layered under the SVG — deep-space radial gradient, four nebula clouds (house colors), three parallax star layers (~150-300 stars by area) with a seeded PRNG so it's stable per size, sparkle crosses on the brightest stars. SVG carries energy-fillet links (dashed, animated flow) and star nodes: outer halo (2.4r, glow filter) + corona (1.45r) + white-hot core with colored rim + labels with dark stroke for legibility.
- `startGalaxy`/`stopGalaxy`: rAF loop, one gentle force-sim tick per frame (sim signature now `simulateGraph(w, h, ticks = 120)`), cores twinkle out of phase. Honors requestAnimationFrame absence (test harness) and prefers-reduced-motion (CSS kills link flow).
- All prior interactions preserved and re-verified live: click-to-open note (obsidian:// deep link + panel), search dims non-matching to 0.12, Fit View re-renders.

**Files changed:** `js/app.js` (paintGalaxy, renderGraph rewrite, startGalaxy/stopGalaxy, simulateGraph ticks param), `css/jarvis.css` (galaxy layering, vignette, link flow, hover), `tests/app.test.js` (+4 galaxy tests incl. click-through and dim behavior), `.freebuff/galaxy.png` (visual proof, untracked).

**Validation:** vitest 191/191. Live: backdrop canvas present (427x716), 52 star nodes each with halo+core, cores twinkle at differing phases, search dims 51/52 for "Welcome", click opens the 2026-09-12 note with its obsidian:// link, browser-automation screenshot confirms the epic look.

**Lessons**
- SVG-mock assertions must filter inside node groups (cores/halos are children of g.galaxy-node, not svg children).
- Module exports are getters in the harness — verify behavior through observable effects, not monkey-patching.

## 2026-09-17 — Screensaver + news + trends (Freebuff/GPT-5.6 lane)
- **Built:** screensaver overlay (`js/screensaver.js`, CSS in style.css): 120 s idle → deep-space canvas, six AI lettermarks (CL/CX/HE/OL/OR/FB — Claude CLI, Codex, Hermes, Ollama, OmniRoute, Freebuff) orbiting a cyan core with nano-bites, "Officially Unofficial" disclaimer (legal-safe: lettermarks not logos), click anywhere → JARVIS gods-eye tab. New server routes: `/api/news` (HN Firebase, cached 120 s, honest DOWN) via `lib/news.mjs`; `/api/trends` via `lib/trends.mjs` parsing `C:\DREAM\google trends .txt` (Jupyter notebook JSON — BTC/TSLA/UE datasets; `TRENDS_FILE` override).
- **Decisions:** judges are CLIs only (hermes one-shot, `claude -p`, codex/opencode/grok skills) — never APIs; CRM/date-app work dropped (being sold; game dev panels = future backlog). Brainstorm pass top picks: missions-in-flight ring + dawn chorus (not yet built).
- **Tests:** 206/206 (19 files), TDD throughout. Live QA caught 3 real defects: missing `document` default, `overlay.children.find` (HTMLCollection has no .find — used querySelector), unsorted HN items. Screenshot-verified: marks orbit, tickers show real HN + real notebook data.
- **Carry-forward:** brainstorm ideas #2 (motes = live wakes/motions) and #3 (recovery sweep) not built; #UntilNoKidInNeed stays out until Shriners partnership.

## 2026-09-17 — You&i hero on the dashboard (Freebuff / Buffy lane)
- Founder voice memo: silent founder, no fame/credit; troll persona = drift-cart "Another One" sign; ice-cream + laptops + free in-game currency for sick kids (#UntilNoKidInNeed stays unspoken until Shriners). Date app sold; dashboard becomes game-dev admin surface. Secrets stay redacted.
- Built: `js/header-fx.js` + `#hero-youi` on the Dashboard tab — You&i / "Watched over by AI" / Enter-the-Galaxy link (youandinotai-galaxy.ai.studio), finisher-header particle canvas **vendored** (js/vendor/finisher-header.es5.min.js, npm finisher-header@1.0.1) with the founder's exact generator config (bg #011a18, particles #fcebca/#d7f3fe/#f95d07, count 38, overlay, skew 1.3) — deliberately NOT dashboard cyan/pink/gold per his rule. 3D pointer tilt. CSS in style.css.
- Lesson: finisher lib resolves its target by CLASS `finisher-header` (getElementsByClassName) and throws if absent — config needs `className:'finisher-header'` and the container needs that class; a bare try/catch would have hidden it forever (browser QA caught it).
- Lesson: `.env` AIRI_DASHBOARD_PORT=9150 overrides everything — start preview servers with the env var pinned (`$env:AIRI_DASHBOARD_PORT='9159'`), else EADDRINUSE.
- 211/211 tests (20 files), hero live-verified: finisher-canvas mounted, 100% lit pixels animating, screenshot confirmed.
- Carry-forward: drift-cart easter egg (Trollz drifts across the gods-eye with ANOTHER ONE when Fable one-shots), ice-cream charity ledger (only after Shriners), ClawX hub link check, joshlcoleman.io still NXDOMAIN.
