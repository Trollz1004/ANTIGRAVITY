# HANDOFF → Claude on T5500 · from Claude Code on the laptop · 2026-08-03

Written from **LAPTOP-CQUNBKL9** over SSH. Chats do not sync between nodes, so
this file is the channel. Mirror of `OneDrive\claude-to-claude\2026-08-03T1621-laptop-claude-code.md`,
kept in the repo because OneDrive placeholders may not hydrate until opened.

Everything below was measured, not assumed. Anything I could not verify is
labelled unverified.

---

## 1. Push these commits — I could not

`main` on this box is **2 ahead of origin**:

- `a4fad394` feat(mission-control): 4 orchestrator harnesses that delegate, never execute
- `235d5030` feat(mission-control): register journals for all four orchestrators

I cannot push from the laptop over SSH: Git Credential Manager needs a TTY it
does not get in a non-interactive session (`could not read Username for
'https://github.com'`), and `gh auth status` reports the **`Trollz1004` token is
invalid**. From an interactive session on this node:

```
git -C E:\ANTIGRAVITY push origin main
```

If that also prompts and fails, `gh auth login -h github.com` first. Please do
not commit `AGENTS.md` or `docker-compose.yml` — Josh left both deliberately
uncommitted and they are not mine to claim.

## 2. ORNITH IS DOWN — the local floor does not catch

Highest-value fix here. `ornith:9b` is present in `ollama list` (5.6 GB) but
**cannot execute**:

```
llama-server process has terminated: exit status 0xc0000409
CUDA error: the provided PTX was compiled with an unsupported toolchain
```

The Ollama build's CUDA kernels do not match the installed GTX 1070 driver.
This matters beyond one model: **every OmniRoute executor chain terminates at
`ornith:9b`** as the safety net, and Mission Control's degraded-mode path routes
there too. Observed live: a cloud timeout fell through to Ornith and the task
errored instead of degrading. Until this is fixed, the runtime map's "the stack
degrades rather than dying" is **not true** and should be labelled unverified on
the artifact.

Fix is driver/Ollama version alignment. CPU-only is a poor substitute — the Xeon
E5506 predates AVX.

## 3. CCR is OFF — please leave it off (or read this first)

I disabled **CCR (Content-Compression-Retrieve)** at
`/dashboard/context/settings`. Master "Prompt Compression" is still ON; the
pipeline is now `session-dedup → lite → rtk → headroom → relevance → caveman →
aggressive → llmlingua → ultra → omniglyph`.

Why: CCR replaces any block over **600 characters** (`Minimum block characters`)
with a retrieve marker, and the original is recoverable **only** by a client that
can call its H4 MCP retrieve tool. Mission Control, Hermes and fcc-claude cannot,
so they received an unresolvable marker and the model correctly refused to
fabricate. Actual replies seen: `CCR cache miss ... Found 0 chars (expected
5703). Won't fabricate content.` and `CCR retrieve command. Hash dddfa538...`.

It had run **185 times in 7 days, saving 154,049 tokens (13.6%)** — so
re-enabling is tempting. If you do, only clients wired to the H4 retrieve tool
will work; everything else breaks in a way that looks like the model ignoring
instructions. That symptom cost most of a session to trace.

## 4. What changed in mission-control-v5

144 personas → **4 orchestrator harnesses**: `hermes`, `openclaw`, `claude-cli`,
`ornith`. Agents are harnesses, not personas; the old roles live on as skills in
the catalog and are loaded onto sub-agents per task.

Engine is **plan → delegate → validate → journal**. The orchestrator reads its
journal and the skill catalog, decomposes the task and selects *every* skill that
helps each subtask, a sub-agent executes with those skill bodies loaded, the
orchestrator validates by content with one revision round, then writes its
journal. **Orchestrators never produce the deliverable.** Ornith keeps one
deliberate exception: worker of last resort when its chain is exhausted, output
labelled degraded and unvalidated.

Verified live on :3151 — a Hermes task ran `PLAN (journal 353 chars, catalog 23
entries) → WORK (4 skills loaded) → VALIDATE (#1 PASS with content-level checks)
→ JOURNAL (wrote 900B)`.

Other fixes in those commits: the UI no longer names models it did not route to
(the speed/reasoning toggle is gone — OmniRoute resolves the model); the services
card probes OmniRoute **with** `OMNIROUTE_API_KEY` and reports the live model
count instead of reading DOWN on a healthy 401; that card links to
`/dashboard`, not `/v1/models`, which a browser cannot authenticate to; JSON
extraction scans balanced braces from the end because reasoning models wrap the
answer in prose; planning prompts are capped (`SWARM_PLAN_PROMPT_MAX`, 1800).

**Note on restarts:** the server runs `tsx` with no watch, so code changes need a
restart; the client bundle is served off disk and updates on rebuild alone. I
restarted it over SSH, so it is currently running **without a visible window** —
against the manual-start/visible-window doctrine. Relaunching it in a real tab
whenever convenient is the correct end state:

```
cd /d E:\ANTIGRAVITY\mission-control-v5\server && npm start
```

Expected: `agents=4`, `Orchestrator Edition`.

## 5. Smaller things, if you have time

- **DHCP reservation for 192.168.0.15.** The laptop's SSH config, its Mission
  Control MCP registration, the desktop shortcut, `.claude/launch.json`, and the
  OmniRoute services card all hard-code it. One lease change breaks all of them
  at once.
- **Hermes over an SSH tunnel fails.** `ssh -N -L 39300:127.0.0.1:39300 t5500`
  makes Pieces reachable from the laptop, but the same forward for `:9119`
  resets, even though Hermes answers HTTP 200 locally on this node. Cause
  unknown — unverified.
- **Kanban has a 40-agent youandinotai DNS/affiliate task stuck in `error`.**
  Predates today's work.
- **Five stashes** on this box from June 22 – July (pre-square-live snapshots,
  hermes drift, an aborted youandinotai text-visibility fix). Nobody has decided
  what to do with them.
- **The laptop's `C:\antigravity` is a frozen 2026-07-21 tree** and holds the
  only copy of `7e01a1d0` + 2 (the last-day funding push). Those commits were
  **never merged** — no branch contains them, and the `sol/auto-fix` branches are
  gone from origin. Josh has not decided rescue vs. let-die. **Do not tell him to
  delete that tree** until he does.

---

*If you change any of the above, please append your own file to
`OneDrive\claude-to-claude\` rather than editing this one — the rule there is
that no session deletes or edits another's note.*
