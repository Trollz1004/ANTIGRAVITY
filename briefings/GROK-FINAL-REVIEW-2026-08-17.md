# GROK FINAL ADVERSARIAL ARCHITECTURE REVIEW — 2026-08-17

> **STALE as of 2026-08-24.** Historical evidence only. Do not execute this review as current doctrine.
> Current Grok / Paperclip / youandinotai.com state: `briefings/GROK-CURRENT-STATE-2026-08-24.md`.
> Paperclip is live on `:3100` for marketing/business ops (not repo authority). Grok is a Joshua-approved trusted official platform (pre-CLI and grok.exe). Canonical root is `C:\ANTIGRAVITY`.
>
> Original review body kept below for the 2026-08-17 packet record.

# GROK FINAL ADVERSARIAL ARCHITECTURE REVIEW — 2026-08-17

**Reviewer:** Grok (adversarial pass)
**Target packet:** `briefings/COUNCIL-FINAL-ARCHITECTURE-PACKET-2026-08-17.md`
**Packet commit:** `2beb56f5f43fd13e8c4e3a08aa1725c61792a238`
**Repo evidence standard:** machine/repository content outranks prose. Nodes offline is irrelevant; this is a pure GitHub main review.
**Canonical rule applied:** current root authority files + CLAUDE.md (2026-08-16) + agent-contracts win over packet assumptions that conflict with them.

---

## EXECUTIVE VERDICT

**BLOCKER BEFORE NEXT HANDOFF**

There is a material authority conflict that must be resolved before Fable/Opus/Manus synthesis or any execution handoff:

1. The packet and root `AGENTS.md` treat **live Paperclip** as the authoritative task/run control plane and treat **`F:\ANTIGRAVITY`** as the canonical working tree.
2. `CLAUDE.md` (updated 2026-08-16) and `agent-contracts/AGENTS.md` explicitly **retire Paperclip**, set **`C:\ANTIGRAVITY`** as the single canonical path on every node, mark **`F:\ANTIGRAVITY` as ARCHIVE**, and record that Hermes / OpenClaw / OmniRoute gateway / Ollama were wiped by the 2026-08-16 reinstall and are **not currently installed**.

Until Joshua (or an explicit supersession commit) decides which of these two worlds is current doctrine, any synthesis that assumes Paperclip ownership + F: paths will produce work against a control plane that the newest authority says does not exist.

All other findings below are secondary to this single resolution.

---

## 1. Paperclip as control plane

**Classification: STALE_OR_CONFLICTING + BLOCKER**

- Packet §2 and root `AGENTS.md` require real Paperclip task/run/heartbeat ownership and treat custom queues as competing infrastructure that must be removed.
- `CLAUDE.md` (2026-08-16):

  > **PAPERCLIP IS RETIRED (2026-08-09).** Do not call `:3120` or `:3100` … Mission Control on `:3151` is the board.

- `agent-contracts/AGENTS.md` repeats the same retirement language and states Mission Control `:3151` is the board.
- Search of the repository finds many historical Paperclip references (scripts, ops notes, old adapters, start scripts) but no live Paperclip server implementation that is declared current.
- Remnants (scheduled tasks, `paperclip` paths in scripts, old heartbeats) are still present and capable of being revived by an agent that follows the packet or root `AGENTS.md` instead of `CLAUDE.md`.

**Judgment on Q1:** Real Paperclip is **not** the authoritative task/run control plane on current main. It is retired doctrine. Custom queues/shims and Mission Control itself are the surviving surfaces. Treating Paperclip as live creates a competing control plane that the packet itself forbids.

**Required action before handoff:** Explicit supersession commit that either (a) re-activates Paperclip with real ownership evidence, or (b) rewrites the packet and root `AGENTS.md` to match the retirement language in `CLAUDE.md` / `agent-contracts`. Silence is not resolution.

---

## 2. Proposed chain

**Classification: STALE_OR_CONFLICTING (as written) / RECOMMENDATION (replacement)**

Packet chain:

```
Paperclip -> registered adapter/launcher -> OmniRoute -> selected runtime/agent -> work/result
```

Because Paperclip is retired, this chain is currently false.

**Recommended replacement (post-reinstall reality):**

```
Joshua assignment / Mission Control task
  -> registered adapter or direct harness (Hermes / OpenClaw / OpenCode / Claude Code / FCC)
  -> OmniRoute (when the gateway is restored and required)
  -> selected runtime/agent
  -> Git main commit + result correlation
```

When OmniRoute is unavailable the system must fail closed with an explicit reason (`BLOCKED_OMNIROUTE_UNAVAILABLE` or equivalent). Silent provider selection by any harness is forbidden.

Judge lane (already present in `mission-control-v5/server/src/omniroute.ts`) is the only lane that may push/merge/delete branches for swarm-originated work. This is already correct in agent-contracts and must be preserved.

---

## 3. OmniRoute as single execution/model-routing boundary

**Classification: VERIFIED_FROM_REPO (code) + SUPPORTED_BUT_NOT_RUNTIME_VERIFIED (install state)**

- Implementation exists: `mission-control-v5/server/src/omniroute.ts`.
- Design is fail-closed: no configured provider → `OmniRouteError('NO_PROVIDER')`; all providers fail → honest aggregated error; zero fabricated output.
- Adapters: anthropic, openai_compat, ollama.
- Named executor chains: `auto`, `ornith`, `fcc-opus`, `judge`. Judge deliberately has no local floor.
- Explicit policy in code and contracts: automation must never bill the Claude Max subscription (`cc/` routes deactivated for automation).
- `CLAUDE.md` states the OmniRoute gateway (`:20128`) is **not installed** after the 2026-08-16 reinstall. Multiple keepalive/fix scripts and docs still assume it.
- ROOT-MAP.md claims a top-level `omniroute/` directory; the current root tree does not contain one. The real implementation lives inside Mission Control v5. This is a documentation drift, not a second implementation.

**What prevents bypass today?**
Almost nothing enforceable while the gateway is absent. Old wrappers, OpenCode configs, direct Ollama calls, and harness-local provider selection can (and historically did) route around a non-running OmniRoute. The packet’s “fail closed” requirement is correct and must be treated as a hard invariant once the gateway is restored.

**Recommendation:** After reinstall, every agent adapter and every harness must be forced through OmniRoute or an explicit Joshua-approved exception list. Any remaining direct-provider path is a security and cost exposure.

---

## 4. Mission Control as observer vs control plane

**Classification: SUPPORTED_BUT_NOT_RUNTIME_VERIFIED + RECOMMENDATION**

- Mission Control v5 (`:3151`) is the current board (kanban, agents, knowledge graph, swarm).
- Mission Control v6 (`:8787`) is the separate Stack Health monitor.
- `CLAUDE.md` and agent-contracts correctly treat MC as the board after Paperclip retirement.
- Risk: because Paperclip is gone, MC is the only remaining task surface and will naturally accrete authoritative state (journals, knowledge graph, brain platforms). That is acceptable only if it remains a projection over Git + explicit task IDs and never becomes a silent second source of truth for “what shipped.”

**Rule to keep:** Mission Control may own task UI and event projection. Git `main` remains code/version authority. Any MC “done” that cannot point at a commit SHA on `origin/main` is incomplete.

---

## 5. UNIVERSAL_STATE.md

**Classification: OPTIONAL (do not add)**

No `UNIVERSAL_STATE.md` (or equivalent write-lease file) exists in the repository. Paperclip + Git + Mission Control journals + seat files already provide coordination primitives. Adding another state file creates exactly the competing lifecycle the packet warns against.

**Recommendation:** Do not introduce `UNIVERSAL_STATE.md`. Use:
- Mission Control task/run IDs (or successor IDs),
- Git HEAD + commit SHAs,
- journal / seat file writes at session end,
- explicit write coordination (see §6).

---

## 6. Repo write-lease

**Classification: RECOMMENDATION**

The shared working-tree problem is real (multiple agents, concurrent edits, “git add -A” disasters). A formal lease is useful; the packet’s suggested fields are directionally correct but underspecified for Windows + multi-agent reality.

**Recommended minimal lease model:**

| Field | Purpose |
|---|---|
| `lease_id` | UUID |
| `owner` | agent / harness identity |
| `task_id` | Mission Control (or successor) task ID |
| `run_id` | run / heartbeat identity if present |
| `acquired_at` / `expires_at` | wall-clock + heartbeat |
| `scope` | explicit path globs or file list (never whole-repo) |
| `starting_sha` | Git HEAD at acquisition |
| `heartbeat_interval` | e.g. 60 s |

**Storage:** single atomic file under a well-known path (e.g. `.agents/leases/active.json` or a small SQLite table owned by Mission Control). Acquisition must be atomic (rename or DB transaction). Stale recovery: any agent may claim a lease whose `expires_at` has passed, but must log the reclaim with the previous owner’s identity.

**Interaction with Git:** lease is coordination only. Git remains the version authority. Overlapping-file protection is advisory + social (do not touch another agent’s in-flight files) plus the existing “stage only your own files” rule. Force-push remains forbidden.

If this is judged too heavy for current headcount, the lighter alternative is strict “one mutator at a time” via Mission Control assignment plus the existing stage-own-files rule. Do not implement a decorative lease that is never enforced.

---

## 7. Skill Brain

**Classification: RECOMMENDATION (concept) + BLOCKER if treated as production without hardening**

- No `skillbrain_mcp.py`, no Skill Brain MCP registration, and no Skill Brain implementation appears anywhere in the current repository (code search returned zero hits).
- The packet’s security findings are correct and must be treated as mandatory before any Skill Brain is given fleet authority:
  - stale C: defaults and Windows/WSL path mismatch,
  - arbitrary path reads via `skillbrain_get`,
  - symlink / junction escape,
  - raw MCP/plugin manifests that can leak secrets,
  - same-name skills silently shadowing,
  - generated skills becoming permanent without review,
  - multiple independent skill trees drifting.

**Current skill reality (VERIFIED_FROM_REPO):**
- Canonical tree is `.agents/skills/` (approx. 46 top-level entries after agency-* purge; CLAUDE.md claims 44).
- Hermes profile tree and OpenCode/Claude harness tree were wiped by the reinstall; restore is pending.
- Multiple conflicting counts (282 / 229 / 53 / 44) appear across docs; counts are diagnostics only.

**Fleet rule — ONE coherent model:**

```
minimal bootstrap set (adhd, brainstorming, agent-reach, agent-browser, find-skills, create-skill, creative)
  +
on-demand load of exactly one skill body from the canonical Git-controlled tree
  +
Hermes-local copies treated as cache only; repo tree wins on conflict
```

Preloaded full bundles and load-on-demand must not both be mandatory. Bootstrap stays tiny; everything else is discovered and loaded on demand. Generated skills go through staging → secret scan → review → Git main promotion. Never auto-activate.

Until the hardening list above is implemented and the path-escape / secret-sanitization / duplicate-conflict tests pass, Skill Brain remains a concept, not production infrastructure.

---

## 8. Broadcast Mode / Iron Wall

**Classification: RECOMMENDATION (approved with stronger enforcement)**

OpenAI’s position is correct: redaction must occur **server-side before** any WebSocket / SSE / API payload reaches the browser. Frontend masking is defense-in-depth only. Fail closed on uncertain content.

**Minimum viable boundary (must cover all of these channels):**

- API keys / JWTs / cookies / authorization headers
- `.env` values and vault material
- webhook URLs and secrets
- credential-bearing query strings and command lines
- private IPs and hostnames when not required
- local Windows paths (`F:\`, `C:\Users\...`) and WSL equivalents
- Git remotes that embed credentials
- MCP configuration that embeds secrets
- raw prompts, tool inputs/outputs, stack traces, error messages, graph labels, log lines

Tokenization examples already in the packet (`OMNIROUTE_GATEWAY`, `CANONICAL_REPO/...`) are good. Required synthetic leak tests listed in the packet are mandatory acceptance criteria; a test passes only when the sensitive source value never appears in the client payload.

No additional competing “Stream Mode” implementation. Alias only.

---

## 9. Gemini UI concepts

**Burn Ledger — APPROVED with the confidence classes in the packet.**
Missing telemetry must never render as `$0.00`. Distinguish MEASURED / CALCULATED_FROM_VERIFIED_USAGE / ESTIMATED / SUBSCRIPTION_INCLUDED / LOCAL_NO_METERED_API_COST / UNAVAILABLE. Local compute is not free; label it honestly.

**Iron Wall / Broadcast Mode — APPROVED** (see §8).

**OmniRoute Traffic Map — APPROVED** only when pulses are driven by observed events. Never animate expected routes.

**Founder Override / ClawX Council — APPROVED** only when every visible decision maps to a persisted event (actor, timestamp, subject, decision). Do not hard-code seven voters. Joshua remains final human authority.

---

## 10. 10% Floor Compliance Monitor

**Classification: STALE_OR_CONFLICTING (correctly rejected by packet)**

OpenAI’s rejection is correct against current root authority. The perpetual-wheel mission skill and historical briefings contain 10% / kids-bucket language; that is mission doctrine, not current date-app execution policy. No current canonical file re-establishes a “10% Floor Compliance Monitor” as an operating rule for the product surface under review.

Do not implement the widget. If Joshua later re-establishes the rule, the data source, scope, and tax-visible ledger must be defined first.

---

## 11. Knowledge classification

**Classification: RECOMMENDATION (adopt and enforce)**

The six labels are sufficient **if** they are actually applied to every retrievable artifact that agents, Pieces, Skill Brain, RAG, or Mission Control can surface:

- CURRENT_CANONICAL
- CURRENT_REFERENCE
- HISTORICAL
- SUPERSEDED
- ARCHIVE
- UNVERIFIED

Without enforcement, stale C:/E:/T5500 topology, old Paperclip heartbeats, and old percentage models will continue to be resurrected. Recommend a lightweight front-matter or sidecar metadata requirement for any document that enters the knowledge graph or skill index.

---

## 12. Crash recovery and idempotency

**Classification: RECOMMENDATION**

Required model:

- Every mutating task carries a stable `task_id` + `run_id` (or successor IDs).
- External side-effects (commits, posts, payments, deployments, tickets) use provider idempotency keys or deterministic detect-before-create keyed by those IDs.
- Durable completion marker tied to the same IDs.
- Recovery agent must distinguish: completed / partial / abandoned / externally-completed-but-not-locally-recorded.

Mission Control must render retry and duplicate state honestly. A second execution of the same task_id/run_id must be a no-op for consequential actions.

---

## 13. Correlation chain and required IDs

**Classification: RECOMMENDATION**

Because Paperclip is retired, replace the packet’s correlation chain with:

```
company/project (optional)
  -> Mission Control task_id
  -> run_id / heartbeat identity (if present)
  -> adapter / harness identity
  -> OmniRoute route / executor (when used)
  -> runtime / agent
  -> Git commit SHA on origin/main
  -> result / external side-effect IDs
```

Minimum event envelope fields (sanitized under Broadcast Mode):

- `event_id`, timestamp
- `task_id`, `run_id`
- adapter, OmniRoute route label (if any)
- runtime/agent
- event type, status
- Git SHA
- degraded / blocked reason
- retry / idempotency metadata

Missing telemetry is `UNAVAILABLE`, never invented.

---

## 14. Decorative dashboard features to defer

**Classification: RECOMMENDATION**

Defer until the core control plane (task ownership, OmniRoute restore, correlation, write coordination, Broadcast Mode) is proven:

- any animated traffic map that is not event-driven
- multi-voter council UI that fabricates seats
- 10% compliance widgets
- decorative “health” lights that probe the wrong process
- any UI that shows expected rather than observed state

Prefer five truthful operational views over twenty beautiful fake ones.

---

## 15. Stale files that mislead future agents

**Classification: STALE_OR_CONFLICTING + RECOMMENDATION**

| File / area | Problem | Recommended action |
|---|---|---|
| Root `AGENTS.md` | Still describes live Paperclip CEO loop and F: as canonical | Supersede or rewrite to match CLAUDE.md / agent-contracts; add explicit “Paperclip retired” header |
| `agent.md` | Old T5500 Paperclip paths, C:\antigravity lowercase, retired node roles | Mark SUPERSEDED or update to current C:\ANTIGRAVITY + Paperclip-retired doctrine |
| Packet itself | Assumes live Paperclip + F: | Requires supersession note or rewrite after Joshua decision |
| ROOT-MAP.md | Claims top-level `omniroute/`; implementation is inside MC-v5 | Correct the map |
| Multiple ops scripts / start-*.bat / Deploy-Everything.ps1 | Still start or reference Paperclip | Archive or guard with “Paperclip retired — do not run” |
| Old briefings under `briefings/` that reference E: / T5500 / 10% splits / Paperclip loops | Historical | Add SUPERSEDED / HISTORICAL front-matter; keep for provenance |
| CLAUDE.md path statements vs AGENTS.md | Direct conflict on canonical drive letter | Resolve once; both cannot be CURRENT_CANONICAL |

Do not mass-delete historical material. Classify it.

---

## Answers to the packet’s additional required questions

**What would you remove because it creates unnecessary complexity?**
- Any requirement that treats Paperclip as live without a re-activation decision.
- `UNIVERSAL_STATE.md` as a new competing lifecycle file.
- Dual mandatory skill models (full preload + load-on-demand). Pick one: minimal bootstrap + on-demand.
- Decorative dashboard features listed in §14.

**What is missing that could cause silent data loss, secret leakage, provider bypass, duplicate execution, or incorrect governance?**
- Explicit supersession of the Paperclip / path conflict.
- Enforceable OmniRoute-only routing once the gateway is restored.
- Server-side Broadcast Mode redaction covering the full channel list in §8.
- Idempotency keys on every consequential external action.
- Skill Brain path-escape and secret-sanitization (if Skill Brain is adopted).
- Atomic write coordination for the shared tree.

**Which current repo files conflict with this packet?**
- `CLAUDE.md`, `agent-contracts/AGENTS.md` (Paperclip retired, C: canonical).
- Root `AGENTS.md` and the packet itself conflict with each other and with CLAUDE.md.

**Is the proposed Paperclip → OmniRoute correlation sufficient?**
No — Paperclip is retired. Use the replacement chain in §13.

**Is the repo write lease necessary?**
Useful if enforced; otherwise prefer strict single-mutator assignment. See §6.

**Is Skill Brain security model sufficient after hardening?**
Only after the full list in §7 is implemented and tested. Remaining attack paths without hardening: path escape, secret dump via manifests, silent skill shadowing, unreviewed generated skills.

**Minimum viable Broadcast Mode security boundary?**
Server-side fail-closed redaction of every channel listed in §8 before transport. Frontend is secondary.

**Acceptance tests still missing?**
All of the packet’s §18 tests remain valid once the control-plane identity is settled. Highest priority negative tests: OmniRoute-down (no silent bypass), synthetic-secret leak, Skill Brain path-escape (if adopted), interruption/restart without duplicate side-effects.

**What should be done before Manus/Fable/next execution agent touches production?**
1. Joshua (or explicit commit) resolves the Paperclip / canonical-path conflict.
2. Packet and root AGENTS.md updated or clearly superseded.
3. OmniRoute reinstall plan and fail-closed invariant recorded.
4. Broadcast Mode redaction boundary specified and tested.
5. No decorative features built against an unresolved control plane.

**Any requirements you would veto?**
- Treating Paperclip as live without re-activation evidence.
- Adding UNIVERSAL_STATE.md merely because an earlier prompt asked for it.
- Implementing the 10% Floor Compliance Monitor from historical material.
- Any UI that fabricates voters, pulses, or $0.00 costs.

**Exact recommendations for the final execution prompt:**
- Resolve authority conflict first; all other work is subordinate.
- Restore OmniRoute only with fail-closed and no silent bypass.
- Keep judge lane as sole swarm push authority.
- Minimal skill bootstrap + on-demand from Git-controlled tree only.
- Server-side Iron Wall before any client payload.
- Idempotent external actions keyed by task/run identity.
- Classify every historical document before it can be retrieved as current doctrine.

---

## FINAL STATUS SUMMARY

| Item | Classification |
|---|---|
| Paperclip as live control plane | STALE_OR_CONFLICTING + **BLOCKER** |
| Canonical path F: vs C: | STALE_OR_CONFLICTING + **BLOCKER** |
| OmniRoute code (MC-v5) | VERIFIED_FROM_REPO |
| OmniRoute installed/runtime | SUPPORTED_BUT_NOT_RUNTIME_VERIFIED (reinstall pending) |
| Mission Control as board | SUPPORTED_BUT_NOT_RUNTIME_VERIFIED |
| UNIVERSAL_STATE.md | OPTIONAL — do not add |
| Repo write lease | RECOMMENDATION |
| Skill Brain implementation | Not present; concept only |
| Skill Brain hardening requirements | RECOMMENDATION (mandatory if adopted) |
| Broadcast Mode server-side redaction | RECOMMENDATION |
| Burn Ledger confidence classes | RECOMMENDATION |
| 10% Floor Compliance Monitor | Correctly rejected |
| Knowledge classification labels | RECOMMENDATION |
| Idempotency / correlation model | RECOMMENDATION |
| Decorative dashboard features | Defer |
| Stale authority files | STALE_OR_CONFLICTING |

---

## ONE-LINE VERDICT FOR JOSHUA

**BLOCKER BEFORE NEXT HANDOFF** — resolve Paperclip-retired vs packet-live and C:\ vs F:\ canonical path conflict before any synthesis or execution agent proceeds.

#ForTheKids
