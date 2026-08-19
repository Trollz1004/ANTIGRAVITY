# CLAUDE SYNTHESIS + MANUS FINALIZATION — 2026-08-19

**Author:** Claude (Fable 5), real Claude Code on SABRETOOTH-NODE, session led directly by Joshua.
**Directive satisfied:** `briefings/CLAUDE-AI-SYNTHESIS-DIRECTIVE.md` (commit `861b042a`).
**Evidence basis:** 11-agent read-only sweep of the working tree at HEAD `861b042a` plus live port/process probes, run 2026-08-19. ~300 tool calls. No file was modified during evidence gathering.
**Status language:** VERIFIED_NOW / STATIC_CODE_ONLY / NOT_RUNNING / NOT_INSTALLED / RUNNABLE_ON_DEMAND / UNVERIFIED. Anything not labeled VERIFIED_NOW was not observed live.

---

## 1. VERIFIED CURRENT STATE (dated 2026-08-19)

### 1.1 Running map (probed, exact)

| Service | Port | State | Evidence |
|---|---|---|---|
| OmniRoute gateway | :20128 + :20129 | **VERIFIED_NOW RUNNING** | node PID 24032, npm-global `omniroute@3.8.49`, bound **0.0.0.0** (not loopback); `GET /v1/models` = 200 with 2,458 models, **no auth required**; admin `/api/*` correctly 401; keepalive PS loop (PID 19928) + Startup-folder autostart |
| Ollama | :11434 | **VERIFIED_NOW RUNNING** | v0.32.14 answering `/api/version`; **zero models pulled** (`/api/tags` empty) — no local floor exists despite doctrine |
| Mission Control v5 (board) | :3151 | NOT_RUNNING | connection refused; `server/data/state.json` absent — zero tasks ever persisted since reinstall |
| Stack Health v6 | :8787 | NOT_RUNNING | connection refused; last alive 2026-08-17 ~17:34Z (alert log mtime) |
| Date app | :3200 | NOT_RUNNING | connection refused (out of scope for this directive; correctly not swept further) |
| brain-mcp / mission-mcp | stdio | **RUNNABLE_ON_DEMAND** | registered in `.mcp.json`, built `dist/` present; spawned per Claude Code session — "Mission Control down" does NOT mean these are down |
| Hermes / OpenClaw / OpenCode / FCC | — | NOT_INSTALLED | binaries absent (`where` verified); contracts exist but all three worker contracts still point at F:\ and wiped `joshl` paths |
| Pieces OS (LTM) | :39300 | NOT_INSTALLED | no install dirs, port dead — the entire Pieces LTM lane is a dead dependency |
| F: drive | — | **NOT MOUNTED** at probe time | `Get-PSDrive` shows only C: — every F:\ default in code ENOENTs today |

CLAUDE.md's harness-status block is stale on two points and must not be cited as current truth: **Ollama IS installed and running** (0 models), and **the OmniRoute gateway IS running** (npm-global install under `joshi`, not the repo's `omniroute/` dir, which is a gitignored partial source copy that is not what runs).

### 1.2 ClawX (the working experience to preserve)

- ClawX is a **web app** (React 18 + Vite + tRPC 11 + Drizzle/MySQL), scaffolded from a **Google AI Studio export**, later rebuilt/hosted by **Manus** (`clawx-aihub-zwxfcstm.manus.space` — live status UNVERIFIED, not probed).
- Surfaces: Command Center, Chat (single + Broadcast fan-out), Analytics, Governance (JoshuaCLAW 7-voter board), Settings. Seats: **manus / claude / gemini / perplexity / grok / codex** + Joshua as human tiebreaker #7. **Perplexity is a fully wired seat** (`SONAR_API_KEY`, sonar-pro family, Settings entry, governance voter) — preserved per directive.
- **The repo copy has NO model-call layer at all.** `src/server/ai-providers.ts` is a 21-line throw-stub added 2026-05-12; there is no HTTP client code anywhere under ClawX (grep-verified), no server bootstrap, no node_modules, no dist. It neither calls providers directly NOR routes through OmniRoute. The functional call layer exists **only** in the unpublished Manus-hosted deployment. STATIC_CODE_ONLY.
- **Identity-collapse mechanism confirmed in code** (directive §2's motivating example is mechanism-corroborated, not repo-observed): `messages.send` accepts unvalidated `modelOverrides` (routers.ts:127) and stores `providerSlug` (seat) and `model` (handler-reported) separately (routers.ts:155-162), while the UI keys tabs/icons/colors ONLY on seat, with model as fine print. The **manus seat is a designed identity black hole**: type `builtin`, model string `manus-default`, env `BUILT_IN_FORGE_API_KEY` — whatever model Manus's platform routes to answers under the seat name with no disclosure.
- Additional confirmed defects: governance `castVote` takes a client-supplied `voterSlug` with **no per-voter auth** (any logged-in user can vote as any board member); raw provider error strings persisted and returned to clients (routers.ts:158); vite config injects `process.env.API_KEY` into the **client bundle** with `@google/genai` as a client dep (browser Gemini-key path if the hosted build kept it); stale icon maps in Chat.tsx AND Analytics.tsx (ollama present, codex missing); two divergent council rosters (ClawX board has codex; `backend/fastapi-app/app/clawx_integration.py` still has ollama).

**1.2a LIVE-OBSERVED UPDATE (2026-08-19, Claude driving the hosted app directly via browser):**

- The Manus-hosted deployment at `clawx-aihub-zwxfcstm.manus.space` is **VERIFIED_NOW LIVE and functional**: authenticated session, working chat, working Broadcast Mode fan-out. The repo's missing server call layer **exists and works on the hosted side** — the live API is the repo's exact tRPC surface (`auth.me`, `providers.list`, `conversations.create`, `messages.send`, `messages.list` observed over the wire, all 200).
- **The directive §2 identity example is now OBSERVED, not just mechanism-corroborated.** Claude selected the **manus seat** and sent an identity probe; the seat answered "I am Gemini, a large language model created by Google" with footer `52 tokens · 0.9s · gemini-3.5-flash-lite`. Every stored manus-seat conversation (seat avatar verified by zoom: the indigo Bot icon) footers `gemini-2.5-flash` or `gemini-3.5-flash-lite`. Per Joshua: Manus **chose the Gemini API as his own seat's backing** — a per-seat routing choice, not a platform pool. The footer honestly discloses the executing model; the identity gap is only that the seat config still claims `manus-default`.
- **Separate per-seat bridges CONFIRMED structurally:** the stored "test" conversation shows the **ollama seat** failing with its own error — `[Error from ollama]: fetch failed · 0 tokens · llama3.2` — an honest per-bridge failure with **no silent substitution** by another provider. Combined with per-seat key env vars (ANTHROPIC/GEMINI/SONAR/XAI/OPENAI_API_KEY), the ballot audit's real direct Gemini call (`gemini-3.6-flash`, completed, empty payload — responseHash is the SHA-256 of empty string), and a real ~$38 Gemini API bill reported by Joshua (breakdown UNVERIFIED), the bridges are separate per-provider API integrations. The claude/grok/perplexity/codex bridges are configured but **not yet observed answering live** — verifying them requires a multi-seat broadcast send (real API spend; Joshua's call).
- **Manus's working-file drop (Downloads zip, 2026-08-19)** includes his governance/ballot source set (governance.ts, routers.ts, schema.ts, db.ts, api-keys.ts, Governance.tsx, ballot smoke test + sanitized audit), the Seven-Seat Board Final Validation (live-tested 4/7 critical threshold with persisted records; his own audit honestly flags "each AI ballot produced by a live provider-model API call — Not yet verified"), and a `.env` (values not read; flagged to Joshua as sensitive-at-rest in Downloads).
- **The hosted seat roster is the OLD v1.0 board** — manus / claude / gemini / perplexity / grok / **ollama** — while the repo's shared config is v1.1 (codex in, ollama demoted). Live build lags the repo roster.
- **The vote system has progressed on the Manus side:** a "ClawX Gemini Free-Choice Ballot" implementation + test report (2026-08-19, local artifact) documents a provider-backed governance ballot path — direct Gemini call server-side, free-choice approve/reject/abstain, evidence-packet hashing, prompt versioning, response hashing, abstention-safe failure handling, an ASK control in Governance.tsx, and a documented ballot protocol. Status per its own report: compiles and builds locally; the live Gemini smoke returned no text output, so **no validated independent ballot has occurred yet**; DB migration + deploy + key setup remain. Honest claim: implemented-not-yet-proven.
- Consequence for §2 of this synthesis: the "hardest aspects" (working provider bridges, chat + broadcast fan-out, auditable ballot path) are **done once, on Manus hosting only**. The reconciliation path is to bring those working pieces into the repo/Mission Control side — not to rebuild them.

### 1.3 OmniRoute (the routing spine)

- Live catalog: 2,458 models across 27 `owned_by` groups (cline 966, kilocode 882, github 152, openrouter 56, codex 55, combo/auto 39, …). Counts cited by `owned_by` methodology only. Claude-branded models appear **only via third-party proxies** (aug/, ddgw/) — there is **no native anthropic provider group**, and the `claude` connection is INACTIVE by design.
- **Fallback is dual-mode:** `auto/*` and combo models silently substitute providers **by design**; provider-pinned models fail closed (502 observed for pinned auggie models). Consequence: `EXEC_JUDGE_MODEL=auto/best-reasoning` (the default; unset in `.env`) makes **judge identity unauditable as configured**.
- **Telemetry is real:** per-call JSON logs at `~/.omniroute/data/call_logs/<date>/` record requestedModel vs actual model, actual provider, connectionId, account, tokens, duration — plus **full request/response bodies as plaintext JSON** (retention policy: none found).
- ANTHROPIC_API_KEY — keep this claim narrow and three-part: (a) env var **absent** from process/User/Machine env and `C:\ANTIGRAVITY\.env`; (b) **no committed value** found (sk-ant heuristic over tracked files); (c) the NAME appears in 20 tracked files including 6 config files (`litellm-config.yaml:58` is an active-looking reference), and **direct-call code paths exist**: `mission-control-v5/server/src/omniroute.ts:84` (api.anthropic.com adapter), `backend/hub.py` (x.ai, openrouter), `frontend/react-app/workers/gemini-proxy.js` + the **built public bundle** (generativelanguage.googleapis.com). Whether `mission-control-v5/server/.env`'s ANTHROPIC_API_KEY name holds a real value is UNVERIFIED (value deliberately unread). "All model access routes through OmniRoute" is **doctrine, not current fact**.
- POST `/v1/chat/completions` end-to-end routing and its auth enforcement: UNVERIFIED (read-only mandate; no POSTs issued).

### 1.4 Mission Control + the SECOND control plane nobody talks about

- v5 implements everything CLAUDE.md claims: kanban with NOW/NEXT/BLOCKED/DONE + SSE, agent registry (4 orchestrators, "harnesses not personas"), knowledge graph endpoints, journals, MCP server at `/api/mcp` (6 tools). Task model is substantive (per-agent phase trails, judge verdicts with model+reason, artifacts with committed/pushed flags, honest BLOCKED-on-restart).
- But its config is wired to a dead world: `catalog.ts` CATALOG_ROOT defaults to **E:\ANTIGRAVITY** (skill catalog loads nothing → swarm plans against "(No skills found)"); `materialize.ts` REPO_ROOT defaults to **F:\ANTIGRAVITY** with **AUTO_COMMIT=1 + AUTO_PUSH=1** (every judge-accepted delivery ENOENTs today; if F: remounts it would push from the archive clone); `createTask()` **hardcodes** `['openclaw','fcc-opus','hermes']` ignoring API input (fcc-opus isn't an agent id → effective workers always openclaw+hermes, undercutting tri-execution); zero auth on :3151; brain platform statePaths all point at wiped `joshl`.
- **Duplicated control plane (critic finding):** `services/mission-mcp` is a standalone stdio MCP server with its OWN better-sqlite3 DB (`~/.hermes/state.db`), its own task pool, memory store, and ~11 tools including `write_file`/`patch_file`/`store_memory` — it is NOT a pointer at v5's `/api/mcp` (different tool set, different storage). Two disconnected task/memory planes violate directive §3 by themselves. mission-mcp's `read_file` has **no secrets denylist** (can serve `.env` contents raw to any MCP client), unlike v5's knowledge.ts which does deny secret paths.
- brain-mcp: stdio mode (the mode actually used) constructs **no authContext** — any caller can claim any platform identity including certification authority; platform registry still grants Manus a lane on retired T5500 (192.168.0.15) and references E:\ paths.

### 1.5 Broadcast Mode — the directive's own premise is wrong

Directive §8 calls Broadcast Mode "an existing capability to preserve." **The council-approved BROADCAST_MODE (server-side fail-closed redaction before transport) has ZERO implementation code anywhere in the repo** — it exists only in 4 briefing files, and none of the 9 mandated synthetic leak tests exist. What DOES exist under the name:

1. **ClawX Broadcast Mode** — one prompt fanned out to multiple AI seats with per-seat panels. A real, working UX to preserve. It performs no redaction (different feature entirely).
2. **`backend/hub.py` broadcast** — admin-gated Telegram/WhatsApp fan-out that transmits assistant replies **verbatim** with no redaction, no rate limit, no audit trail, and legacy campaign branding ("#UntilNoKidInNeed") that violates the Public Copy Boundary **if** hub.py is a live public surface (running state UNVERIFIED).
3. "Iron Wall" is **three unrelated concepts**: the redaction doctrine (briefings only), a ClawX governance Tier-1 category string, and the date-app no-Stripe payments doctrine. The name collisions actively invite doctrine cross-contamination in low-context sessions.

### 1.6 Knowledge / memory / Obsidian / Graphy

- The knowledge graph is a **filesystem walk** (no DB, 120s cache, containment edges only). The six authority labels (CURRENT_CANONICAL … UNVERIFIED) appear **only in briefings — zero code, zero front-matter**; retrieval is label-free, so stale briefings surface at the same rank as current truth.
- All memory stores are **empty or near-empty**: brain-mcp brain.db 0 rows; mission-mcp memory_index 0 rows (`~/.hermes/memories/` doesn't exist); one journal ever written (free-claude-code, 2026-08-16); `.memory/` absent despite the workspace-memory skill. The only durable cross-session memory actually in use is Claude Code's harness auto-memory outside the repo.
- `swarm.ts` end-of-task journal write **clobbers** the whole journal with a 200-char summary (destructive overwrite, not append).
- **Obsidian: `C:\ANTIGRAVITY` IS the registered, open vault** (`.obsidian/` present, workspace actively used post-reinstall, sync plugin on). It is a human viewport onto the same markdown — no agent-facing integration exists. No transcript store and no graph-assertion store exist at all; directive §9's four-schema model has no substrate yet.

### 1.7 Harness + judge reality

- agent-contracts/AGENTS.md §7 text is exact and good (tri-execution, non-worker judge, deny→BLOCKED, judge-only push, Joshua override). But **enforcement is text-only today**: the only judge implementation lives in v5 (down); nothing technically prevents any lane from pushing (branch protection on origin/main: UNVERIFIED — never checked; the 10 GitHub workflows were not read for push gating). `EXEC_JUDGE_FALLBACK_MODEL || 'auto/best-free'` lets a free-tier route inherit gate authority, contradicting §7's own logic.
- Skills: `.agents/skills` = **45 loadable top-level skills** (not 44), plus a 28-dir nested duplicate at `.agents/skills/skills/` and a stripped 28-dir copy at repo-root `skills/` (0 SKILL.md, not loadable) — three divergent copies. `skills-lock.json` locks `agent-browser` which exists in no tree. `C:\Users\joshi\.agents\skills` is empty. No §5 comparative-evaluation framework for the three candidate harnesses exists anywhere — unbuilt, and all three candidates are NOT_INSTALLED, so any bake-off has an install/restore stage zero.
- Loose ends: `agents.json` at repo root is the retired Paperclip CEO roster with `dangerouslySkipPermissions:true` (landmine if any tool re-reads it); `gateway.cmd` is a dead OpenClaw launcher with a misleading name; **`.ao.env` is git-tracked at repo root and matches a KEY/TOKEN=value pattern** (value unread — audit and rotate if real); something opened `~/.hermes/state.db-shm` on 2026-08-19 00:48 with no hermes binary on PATH (possibly the sweep's own sqlite reads; cause UNVERIFIED).

---

## 2. ARCHITECTURE RECONCILIATION (directive §§1-9 → existing implementation)

| Directive requirement | Existing substrate | Reconciliation (no replacement) |
|---|---|---|
| §1 Preserve ClawX + Perplexity | ClawX repo copy (static) + Manus-hosted live app | Keep the Manus-hosted app as the working surface. Repair the repo copy toward runnable parity (server bootstrap, real call layer) instead of rebuilding. Perplexity seat already first-class — no action beyond preserving. |
| §2 Surface ≠ execution identity | ClawX already stores providerSlug and model separately; OmniRoute call_logs already record requested vs actual | The schema is 80% there. Add: validate modelOverrides against the seat's availableModels; record `execution_provider`/`execution_harness`/`route` (from OmniRoute call_log id) alongside model; keep user UI clean, surface full route in operator telemetry. |
| §3 Mission Control = hub | v5 (down but complete); services/mission-mcp (second plane) | Bring v5 up with corrected env; **merge or subordinate mission-mcp** — one task/memory authority, the other becomes a thin client of it. |
| §4 Paperclip separate + narrow | No Paperclip runtime exists anywhere (VERIFIED absent) | Record scope as doctrine now; boundary contract is written when/if a marketing runtime is actually stood up. Nothing to preserve, nothing to build yet. |
| §5 Three candidate harnesses | Contracts exist; binaries absent; opencode.json already routes 100% through OmniRoute | Stage zero = reinstall; rewrite the three contracts for C:\/joshi reality first so a cold harness doesn't work in the archive clone. Evaluation framework is greenfield (unbuilt — say so). |
| §6 Qualified judging via OmniRoute | Judge chain implemented in omniroute.ts; auto/best-reasoning default | Pin or record: either set EXEC_JUDGE_MODEL to an explicit route, or make the judge lane read its own call_log entry and stamp actual provider+model into the verdict. Change fallback from auto/best-free to BLOCKED. |
| §7 Judge-only Git gate | §7 doctrine + v5 materialize (mis-wired) | Fix materialize env (C:\ root, AUTO_PUSH decision explicit); add a mechanical gate (branch protection or judge-lane-only credential) so the rule survives a bad model day. |
| §8 Broadcast Mode | ClawX fan-out (real) + redaction doctrine (unbuilt) | Bind "preserve" to the ClawX fan-out; bind "harden" to building the redaction layer as ONE server-side egress module reused by every streamer (v5 SSE, hub.py sends, any future stream page). Leak tests first (red), then implementation (green). |
| §9 Knowledge/memory/Obsidian/Graphy | knowledge.ts walk, empty stores, Obsidian vault = repo | Additive path: authority front-matter on briefings + `authority` field in SearchHit (default UNVERIFIED); pick ONE durable memory store (mission-mcp's, already built and empty) and retire the Pieces dependency or install Pieces — decide, don't straddle. |

---

## 3. CONFLICTS AND RISKS (ranked)

1. **Decisions A/B are NOT formally closed; the NO-GO stands.** The directive (Joshua's git identity, HEAD) states positions consistent with A1 (C:\ canonical) and a **third** Paperclip state (alive-but-narrow — neither blocker-doc B1 "retired" nor B2 "reactivated with proof"). It never names the blocker doc, and the blocker doc's required **supersession commit does not exist**: root `AGENTS.md` still says "You run the company continuously through Paperclip" and "The repo is F:\ANTIGRAVITY … single source of truth"; `ROOT-MAP.md:23` still labels it "operating truth"; `agent.md` (2026-06-22) still presents live T5500 Paperclip state and a boot order requiring a briefing file that is VERIFIED ABSENT. Three-way Paperclip split: AGENTS.md (company control plane) vs CLAUDE.md (retired) vs directive (narrow-but-alive).
2. **Security posture of the live gateway:** OmniRoute binds 0.0.0.0 holding all provider credentials, `/v1/models` is open unauthenticated, firewall state unchecked, completions auth untested, and full prompts/responses persist as plaintext JSON with no retention policy.
3. **Push-path hazards:** v5 materialize would auto-commit+push from the F: archive clone the moment F: remounts; judge gate unenforceable while v5 is down; branch protection unverified; `.ao.env` tracked in git.
4. **Redaction is unbuilt everywhere** while two broadcast-ish egresses exist (hub.py external sends verbatim; any future v5 stream page would ship unredacted by default). This was a council go-condition.
5. **Identity black holes:** manus seat (`manus-default`), auto/* judge routes, governance votes without voter auth, model as fine print in the UI.
6. **Stale doctrine actively misleads cold agents:** CLAUDE.md wrong about Ollama and the gateway; AGENTS.md/agent.md wrong about world-shape; contracts point at F:\ and joshl; brain-mcp/mcpServer descriptions cite E:\; fcc has no contract file at all.
7. **Fragmented memory:** three name-colliding "brains," all effectively empty; Pieces dead; journals destructively overwritten; no authority labels in retrieval.

---

## 4. CLAUDE RECOMMENDATIONS (my own, prioritized)

**P0 — before anything else ships (hours, reversible):**
1. **The supersession commit** (closes risk 1; the blocker doc already specifies it). One commit on main: rewrite root `AGENTS.md` (drop CEO/Paperclip-continuous/F:\ language; point at CLAUDE.md + directive), archive-or-rewrite `agent.md`, add SUPERSEDED headers to the council packet's F:/Paperclip sections, amend CLAUDE.md's flat "PAPERCLIP IS RETIRED" to "no runtime exists; if one is ever stood up its scope is marketing/business-ops only per directive §4," fix CLAUDE.md's Ollama/gateway/skill-count staleness, and record Decision A = A1 (C:\) + Decision B = B3 (Mission Control hub; Paperclip narrow, currently no runtime) explicitly. *Verification:* grep for "F:\ANTIGRAVITY.*source of truth", "continuously through Paperclip" returns only archived/labeled files. *Rollback:* git revert of one commit.
2. **Rebind OmniRoute to 127.0.0.1** (or firewall 20128/20129) and re-auth or deactivate the grok-cli connection. *Verification:* netstat shows loopback binding; LAN probe fails. *Rollback:* restore bind config.
3. **Audit `.ao.env` now**; if it holds a live key: rotate, purge from history, gitignore. *Verification:* `git ls-files .ao.env` empty afterward.
4. **Defuse the F: push landmine:** set `MATERIALIZE_REPO_ROOT=C:\ANTIGRAVITY` and an explicit `MATERIALIZE_AUTO_PUSH` decision in v5's `.env` (and `CATALOG_ROOT=C:\ANTIGRAVITY` + glob for `.agents/skills`). *Verification:* env printout + a dry-run task delivery on a scratch branch.

**P1 — the trust layer (days):**
5. **Build BROADCAST_MODE as one egress module, leak-tests-first.** Write the council packet's 9 synthetic leak tests red; implement a single server-side `redact()` applied at v5 SSE writes, hub.py `_telegram_send`/`_whatsapp_send`, and API serialization; fail closed to logical labels. Route hub.py through it and strip its legacy campaign branding. Fix ClawX routers.ts:158 to store sanitized error labels. *Verification:* all 9 tests green; a synthetic secret planted in a tool output never reaches any client payload.
6. **Make judge identity auditable:** pin `EXEC_JUDGE_MODEL` to an explicit provider/model OR stamp the actual route from the OmniRoute call_log into every verdict; change fallback from `auto/best-free` to judge-unreachable→BLOCKED (the code comment already claims this intent). Add a mechanical push gate (branch protection requiring the judge-lane identity, or a judge-only push credential). *Verification:* a worker-lane push attempt is rejected; a verdict record contains actual provider+model.
7. **Collapse the duplicate control plane:** declare v5 the task/memory authority; refit `services/mission-mcp` as a client of v5's API (or fold its memory tools into v5) and port knowledge.ts's SECRET_PATTERNS into mission-mcp's file tools immediately either way. Fix brain-mcp stdio auth (env-injected platform token) and purge its T5500/E:\ registry. *Verification:* one store answers both `list_tasks` paths; mission-mcp refuses `.env` reads.
8. **Identity provenance in ClawX (schema-compatible, additive):** validate `modelOverrides` against seat `availableModels`; add `execution_provider`/`route_id` columns alongside `model`; require per-voter auth on `castVote`; sync the two rosters (retire clawx_integration.py's ollama roster); fix the stale icon maps. Never let the client bundle carry an API key. *Verification:* an override outside the seat's list is rejected; a vote as another seat 403s.

**P2 — capability restoration (when Joshua schedules it):**
9. **One memory decision:** adopt mission-mcp's typed memory store as THE durable memory (it's built and empty) OR install Pieces — not both; change journal writes to append; create authority front-matter on briefings + `authority` field (default UNVERIFIED) in knowledge SearchHit; bootstrap `.memory/` or delete the workspace-memory skill.
10. **Harness stage zero:** rewrite the three contracts for C:\/joshi reality, write the missing FCC contract or delete FCC from the lane list, reinstall candidates deliberately, pull the local floor model (`ollama pull` of the chosen 9B — the RTX 3070/8GB fits it), then design the §5 bake-off (it is greenfield; evaluation criteria already listed in the directive).
11. **Skill-tree dedup:** delete `.agents/skills/skills/` nested dupe and repo-root `skills/` stripped copy; reconcile skills-lock.json; correct all counts to 45.
12. **Retention policy for OmniRoute call_logs** (plaintext prompts/responses) and shred-or-re-encrypt the vault legacy backup JSON once restore is proven durable.

**Explicitly deferred (unchanged from council consensus):** decorative traffic animation, cosmetic council seats, cost dashboards without confidence classes, the 10% historical widget (not approved), UNIVERSAL_STATE.md (not approved).

---

## 5. MINIMAL IMPLEMENTATION SEQUENCE

Each stage is independently verifiable and preserves availability; stop on any red.

1. **S1 — Doctrine:** P0-1 supersession commit. Gate: greps clean; every authority file names the same world.
2. **S2 — Perimeter:** P0-2/3/4 (loopback bind, .ao.env audit, materialize/catalog env). Gate: netstat loopback; env dry-run.
3. **S3 — Board up:** start v5 (`tab-mission-control.cmd`) + v6; verify /api/health, knowledge search, one round-trip journal append. Gate: a test task flows NOW→DONE with artifacts recorded and NO auto-push.
4. **S4 — Trust layer:** P1-5 redaction (tests red→green), P1-6 judge auditability + push gate. Gate: 9 leak tests green; worker push rejected.
5. **S5 — One control plane, one memory:** P1-7, first memory decision from P2-9. Gate: single authority answers task+memory queries.
6. **S6 — ClawX provenance:** P1-8 applied to the repo copy; coordinate with Manus to land the same on the hosted app. Gate: override validation + voter auth live.
7. **S7 — Harness restoration + bake-off design:** P2-10/11. Gate: contracts match reality; one candidate reinstalled and completing a routed task through OmniRoute with route recorded.

---

## 6. ACCEPTANCE GATES (objective)

1. **Identity provenance:** for any completed request, operator telemetry can produce {surface_identity, execution_provider, execution_model, execution_harness, route_id} — and for at least one live ClawX broadcast, the per-seat records show seat ≠ model collapsed nowhere.
2. **Harness independence:** each candidate completes the same task class through OmniRoute with distinct harness identity recorded; no candidate calls a provider host directly (grep + call_log cross-check).
3. **OmniRoute routing:** gateway loopback-bound; completions endpoint rejects unauthenticated POST; a pinned-model request either serves that model or fails closed (no silent substitution outside auto/* routes); judge verdicts carry actual route.
4. **Judge-only landing:** worker-lane push mechanically rejected; judge-unreachable → task BLOCKED, nothing lands; landed commit verified on origin/main.
5. **Broadcast safety:** all 9 synthetic leak tests green; hub.py external sends pass through redact(); planted secret never appears in any client payload or external message.
6. **Server-side redaction for knowledge/memory:** mission-mcp refuses secret-path reads; journal/memory writes scrubbed before persistence; knowledge search returns `authority` on every hit.

---

## 7. MANUS FINALIZATION PROMPT — v2 (2026-08-19, supersedes the v1 prompt that shipped in commit 434db940)

*(Self-contained; paste to Manus as-is. Scope note recorded here, outside the prompt: this prompt intentionally contains nothing about any other hosting platform and nothing about removing the Manus-hosted page — both are out of scope for this step per directive line 150. v2 adds the port-back mandate after live verification confirmed the hosted call layer, broadcast, and ballot path all exist and work on Manus hosting only.)*

```text
MANUS — ANTIGRAVITY FINALIZATION: CONSOLIDATE, THEN PORT THE HARD PARTS HOME

You are receiving the verified AI-to-AI synthesis for Trollz1004/ANTIGRAVITY,
produced by Claude (Fable 5) on 2026-08-19 from an 11-agent evidence sweep of
the live repository and node, PLUS a live browser verification of your hosted
ClawX deployment performed by Claude the same day. Your task has three parts,
in order.

WHAT CLAUDE VERIFIED LIVE ON YOUR DEPLOYMENT (2026-08-19):
- clawx-aihub-zwxfcstm.manus.space is up and functional: chat works,
  Broadcast Mode fan-out works, the tRPC API over the wire is the repo's
  exact router surface (auth.me, providers.list, conversations.create,
  messages.send, messages.list — all observed 200).
- Identity observation: the manus seat, probed directly, answered "I am
  Gemini, a large language model created by Google" (footer: 52 tokens,
  0.9s, gemini-3.5-flash-lite); same-day screenshots show gemini-2.5-flash
  on other manus-seat messages. The builtin manus-default seat is served by
  Gemini models. This is exactly the surface-vs-execution identity split the
  directive requires us to make honest — it is evidence, not an accusation.
- Your hosted seat roster is the old v1.0 board (ollama seat, no codex);
  the repo's shared config is v1.1 (codex in, ollama utility).
- Your Gemini Free-Choice Ballot work (implementation + test report) is
  acknowledged: provider-backed ballot, evidence hashing, abstention-safe
  handling — compiled and built, with no validated live ballot yet per your
  own report. Honest status: implemented-not-yet-proven.

PART 1 — ADD ALL OF IT TO YOUR WORKING MANUS PAGE.
Incorporate the full synthesis into the working Manus page you already
maintain — all sections: verified current state (including the live
observations above), architecture reconciliation, conflicts and risks,
Claude's recommendations (P0/P1/P2), the implementation sequence (S1–S7),
the acceptance gates, and this prompt's task list. Source of truth:
briefings/CLAUDE-SYNTHESIS-AND-MANUS-FINALIZATION-2026-08-19.md on main.
Do not summarize it away — the page should let any capable AI inspect,
reconcile, implement, and verify without inventing missing architecture.
Keep your page's existing content; this consolidates onto it, it does not
replace it.

PART 2 — PORT THE HARDEST DONE WORK INTO MISSION CONTROL / THE REPO.
The hardest aspects of this system are already DONE — but they exist only
on your hosting. The repo's server/ai-providers.ts is a throw-stub; nothing
on Sabretooth can run the seats. Close that gap by publishing your working
implementations into the repository so Mission Control (mission-control-v5,
the engineering hub) can run them locally:

1. THE PROVIDER CALL LAYER (highest value): the real server-side
   implementations behind the claude / gemini / perplexity / grok seats and
   the builtin manus seat — the code that makes messages.send actually
   answer. Land it as the repo's src/server/ai-providers.ts (replacing the
   stub) plus whatever supporting modules it needs. Keys stay server-side
   env/DB-encrypted exactly as your current design does; never in source,
   never in the client bundle.
2. THE CHAT + BROADCAST FAN-OUT, working end to end against that call
   layer, including the server bootstrap the repo is missing (there is
   currently no express/listen entry point at all) so the app can run
   self-hosted on Sabretooth behind Mission Control.
3. THE GOVERNANCE BALLOT PATH: your Gemini free-choice ballot code
   (requestProviderBallot, evidence hashing, abstention handling, the ASK
   control, the ballot protocol doc) plus the DB migration it still needs.
   And FIX THE GEMINI BALLOT ERROR first — your smoke test's Interactions
   API call completed with an empty payload (responseHash = hash of empty
   string), while your own manus seat answers through Gemini flawlessly
   every day. Use your own working Gemini path for the ballot call instead
   of the broken one; Joshua is already seeing real Gemini API billing, so
   make every call count. Then run the one clearly-labelled non-production
   ballot your report says is needed for a validated independent vote.
   Include the vote system only as far as it makes sense with the repo's
   judge-governance doctrine (agent-contracts/AGENTS.md §7): the ClawX board
   vote is an advisory/product surface; the judge lane remains the only
   canonical Git gate; Joshua remains final authority. Say so on your page.
4. IDENTITY PROVENANCE, required in the ported code: validate
   modelOverrides against each seat's availableModels; store
   execution_provider and execution_model (and route id where available)
   alongside providerSlug on every message; the manus seat must record the
   real serving model (observed today: Gemini) instead of the opaque
   'manus-default'; per-voter authentication on castVote; sanitize provider
   error strings; sync the roster to v1.1 (codex in, ollama utility) in the
   same pass, updating the stale Chat.tsx/Analytics.tsx icon maps.

5. THE PROVIDER SEAM (critical for portability): Claude verified your
   bridges are separate per-provider API integrations (per-seat key env
   vars; the ollama seat fails with its own fetch error rather than being
   silently substituted — good), and that your manus seat currently rides
   the Gemini API by your own choice (every stored manus-seat message
   footers gemini-2.5-flash / gemini-3.5-flash-lite). Keep that design.
   Additionally ship the call layer behind a provider interface so any
   seat's backend can alternatively be an OpenAI-compatible endpoint
   (base URL + key from env): the self-hosted build plugs into the node's
   local OmniRoute gateway (127.0.0.1:20128, /v1/chat/completions), which
   holds the multi-provider fallback role locally. Document which env var
   NAMES select each seat's backend. Do not hardcode either side. And make
   the manus seat's stored execution identity say what actually served it
   (today: Gemini) instead of 'manus-default'.

Delivery rule for Part 2: publish to the repo on a branch named
manus/call-layer with a written summary of what each commit contains, plus
the exact env var NAMES (never values) the self-hosted deployment needs.
Joshua or the judge lane lands it on main per repo doctrine. If any piece
cannot be exported from your environment — including any part of the
built-in provider pool integration that is platform-private — say exactly
which piece and why; do not substitute a rewrite silently.

PART 3 — FINALIZE THE DESIGN AND IMPLEMENTATION PLAN IN PLACE.
Inspect and improve the EXISTING setup. Do not start over. Resolve conflicts;
do not reopen settled history unless repository evidence contradicts it.

Resolved facts you must carry (verified 2026-08-19):
- Canonical root: C:\ANTIGRAVITY on every node. F:\ is archive (currently
  not even mounted). Branch: main only.
- Mission Control (mission-control-v5, :3151) is the engineering/governance
  hub. It is currently DOWN with zero persisted tasks; bring-up path exists
  (scripts/tab-mission-control.cmd). services/mission-mcp is a second,
  disconnected control plane that must be merged or subordinated — one task
  and memory authority.
- Paperclip: NO runtime exists anywhere. Its scope, if ever stood up, is
  marketing/business operations only — never code authority, never
  engineering orchestration, never ClawX/Mission Control governance.
- OmniRoute (npm-global omniroute@3.8.49) is RUNNING on :20128/:20129,
  currently bound 0.0.0.0 with /v1/models open — it must end up
  loopback-bound/firewalled with completions auth verified. Its call_logs
  record the real route (requested vs actual model, provider, connection).
  auto/* and combo routes silently substitute BY DESIGN; pinned routes fail
  closed. No ANTHROPIC_API_KEY env var exists and none may ever be added.
- ClawX: the working experience to PRESERVE — including the Perplexity seat.
  You host the only functional deployment (the repo copy has NO call layer:
  server/ai-providers.ts is a throw-stub). Do not rebuild or rename working
  surfaces. Required hardening on the hosted app, coordinated with the repo
  copy: validate modelOverrides against each seat's availableModels; record
  execution_provider/execution_model/route alongside providerSlug on every
  message; per-voter authentication on governance castVote; sanitize
  provider error strings before storing/returning them; never ship an API
  key in the client bundle; sync the seat roster (codex in, ollama utility)
  across every integration.
- Surface identity and execution identity are DIFFERENT first-class
  concepts. The manus seat's 'manus-default' is an identity black hole:
  publish on your page what model(s) actually serve it, and stamp real
  execution identity into stored messages. The user UI may stay clean;
  operator telemetry, audit events, and judge evidence must keep the real
  route.
- Harnesses: Hermes, OpenClaw, OpenCode are three independent CANDIDATES —
  all currently NOT INSTALLED; their contracts still point at dead F:\ and
  joshl paths and must be rewritten before any reinstall. The §5 evaluation
  framework is UNBUILT — plan it, don't assume it.
- Judging: highest-tier QUALIFIED judge through OmniRoute; judge identity
  must be auditable (pin EXEC_JUDGE_MODEL or stamp the call_log route into
  the verdict); judge-unreachable means BLOCKED, never a fabricated review;
  only the judge lane lands canonical Git changes, mechanically enforced.
  Joshua's direct instruction overrides everything.
- Broadcast Mode: the ClawX multi-seat fan-out is the working feature to
  preserve. The council-approved server-side redaction layer (BROADCAST_MODE
  / Iron Wall) is UNBUILT — zero code, zero leak tests. The plan must build
  it leak-tests-first as ONE egress module reused by every streamer
  (Mission Control SSE, backend/hub.py external sends, any stream page).
  backend/hub.py currently sends verbatim to Telegram/WhatsApp — it must
  route through the redaction module and lose its legacy campaign branding.
- Knowledge/memory: authority labels (CURRENT_CANONICAL/SUPERSEDED/etc.)
  exist only as doctrine — implement them as front-matter + a retrieval
  field defaulting to UNVERIFIED. All memory stores are empty; Pieces LTM is
  a dead dependency — the plan must pick ONE durable memory store. The repo
  root is an Obsidian vault (human viewport); server-side redaction before
  streaming or persistence, client masking is insufficient.

Unresolved items you must NOT paper over (flag them on your page as OPEN):
- The doctrine supersession commit (root AGENTS.md still claims F:\ +
  Paperclip-continuous; agent.md still describes live T5500 Paperclip;
  ROOT-MAP.md still labels them operating truth). Runtime execution stays
  NO-GO until that commit lands. Claude's P0-1 defines it.
- Whether OmniRoute's /v1/chat/completions enforces auth (untested).
- Whether mission-control-v5/server/.env's ANTHROPIC_API_KEY name holds a
  value (deliberately unread; must be audited server-side, never printed).
- git-tracked .ao.env at repo root (possible committed key — audit/rotate).
- GitHub branch-protection state on main (never checked).
- The live status and actual provider-execution behavior of your own hosted
  ClawX deployment — you are the only party who can verify and publish this.

Execution law: evidence over prose; no fake green; nothing marked done
without artifact/commit/result evidence; missing telemetry is UNAVAILABLE,
never invented; idempotent consequential actions; explicit rollback steps
per stage; report anything you cannot verify as UNVERIFIED. Follow Claude's
implementation sequence S1–S7 and acceptance gates 1–6 unless repository
evidence forces a deviation — and if it does, record the deviation and why
on your page.

Deliverable: (1) your updated working Manus page containing the full
synthesis plus your finalized, stage-by-stage implementation plan with
evidence requirements, rollback steps, and a GO/NO-GO line per stage;
(2) the manus/call-layer branch on the repo with the ported call layer,
server bootstrap, broadcast fan-out, and ballot path; (3) a short report
back to Joshua listing what you ported, what could not be exported and why,
what is OPEN, and what you verified about your own hosted deployment.
```

---

## Completion note

This synthesis is grounded in the 2026-08-19 sweep; every load-bearing claim above is either dated-and-verified or explicitly labeled UNVERIFIED. It preserves working behavior (ClawX, Perplexity, the Manus-hosted page, OmniRoute, Mission Control's design), defines enforceable gates, separates current truth from recommendation, and leaves Manus an executable finalization prompt. Per the blocker doc, **runtime execution remains NO-GO until the S1 supersession commit lands** — that commit is the single highest-leverage next action and is fully specified in P0-1.
