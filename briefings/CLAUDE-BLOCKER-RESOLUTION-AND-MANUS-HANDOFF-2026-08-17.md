# CLAUDE BLOCKER RESOLUTION + MANUS HANDOFF — 2026-08-17

**Purpose:** force explicit authority resolution before any Fable/Opus/Manus synthesis or runtime execution.

**Inputs:**

- `briefings/COUNCIL-FINAL-ARCHITECTURE-PACKET-2026-08-17.md`
- `briefings/GROK-FINAL-REVIEW-2026-08-17.md`
- root `AGENTS.md`
- root `CLAUDE.md`
- `agent-contracts/AGENTS.md`
- `ROOT-MAP.md`

**Grok review commit:** `65c77039017a71176cb2840b9aa7efdad1939c61`

**Status:** `BLOCKER BEFORE NEXT HANDOFF`

---

## 0. CLAUDE / FABLE — DO NOT PAPER OVER THIS CONFLICT

The final Grok adversarial review is correct that the repository currently contains two mutually incompatible operating worlds.

### World A — root `AGENTS.md` + earlier council packet

- canonical working path: `F:\ANTIGRAVITY`
- Paperclip treated as live/authoritative control plane
- Paperclip task/run correlation assumed by the council packet
- F: used in Git commands and operational examples

### World B — `CLAUDE.md` (updated 2026-08-16) + `agent-contracts/AGENTS.md`

- canonical working path: `C:\ANTIGRAVITY` on every node
- `F:\ANTIGRAVITY` explicitly marked archive/read-only history
- Paperclip explicitly retired
- Mission Control `:3151` is the board
- Hermes/OpenClaw/FCC/OpenCode/Ollama/OmniRoute gateway recorded as not installed after the Windows reinstall unless subsequently restored and proven

Both worlds cannot be `CURRENT_CANONICAL` simultaneously.

**Do not choose a world merely because an AI document is newer, older, longer, or more confident. Joshua is the human authority.**

If Joshua has explicitly resolved either item in the active conversation after 2026-08-16, preserve that explicit decision and create the supersession patch around it. Otherwise stop and obtain the two decisions below before Manus receives an execution prompt.

---

# 1. TWO REQUIRED HUMAN AUTHORITY DECISIONS

Claude/Fable must resolve these two questions with Joshua, or cite an explicit current Joshua instruction that already resolves them.

## Decision A — canonical working path

Choose exactly one:

### A1 — `C:\ANTIGRAVITY` is canonical

Then:

- `F:\ANTIGRAVITY` is archive/recovery only
- update/supersede root `AGENTS.md`
- update/supersede the council packet's F: assumptions
- update stale scripts/config/docs only where they can still drive active automation
- Broadcast Mode tokenization examples use `CANONICAL_REPO/...`, not a hard-coded drive
- Skill Brain canonical repo root becomes `C:\ANTIGRAVITY\.agents\skills` and `/mnt/c/ANTIGRAVITY/.agents/skills` where WSL is intentionally used

### A2 — `F:\ANTIGRAVITY` is canonical

Then:

- explicitly supersede the 2026-08-16 C: directives in `CLAUDE.md` and `agent-contracts/AGENTS.md`
- explain why the prior "F is archive" instruction is no longer true
- update all active scripts/configs/contracts to F: in one bounded doctrine-alignment pass
- prevent C: from remaining an apparently-current second working copy

Do not leave C: and F: both advertised as canonical.

---

## Decision B — task/control plane

Choose exactly one:

### B1 — Paperclip remains retired; Mission Control is the board

Then:

- root `AGENTS.md` must stop saying agents continuously run the company through Paperclip
- earlier Paperclip-live council requirements become `SUPERSEDED`
- historical Paperclip scripts/startup docs must be archived, guarded, or clearly marked non-runnable current doctrine
- task correlation becomes:

```
Joshua assignment / Mission Control task
  -> run / heartbeat identity where present
  -> adapter or harness
  -> OmniRoute route/executor when restored and required
  -> runtime/agent
  -> Git commit SHA on origin/main
  -> result / external side-effect IDs
```

- Mission Control may own task UI/event state; Git `main` remains code/version truth
- do not create `UNIVERSAL_STATE.md` as a new competing lifecycle unless Joshua later explicitly chooses it

### B2 — Paperclip is being deliberately reactivated as the real control plane

Then do **not** merely change prose to say Paperclip is live.

Before it becomes canonical, prove:

- current Paperclip runtime actually exists
- current adapter registration actually exists
- tasks become genuine Paperclip task records
- real Paperclip run/heartbeat lifecycle exists
- Mission Control's role is reconciled so there is one board/control plane, not two
- Paperclip does not spawn unauthorized Claude Max execution
- skill loading is not the old empty/3-entry catalog failure mode
- Paperclip -> adapter/launcher -> OmniRoute -> runtime route is observed end-to-end
- no custom queue/shim becomes a parallel authoritative lifecycle

Only after that evidence may Paperclip be promoted back to `CURRENT_CANONICAL`.

---

# 2. REQUIRED SUPERSESSION COMMIT BEFORE MANUS EXECUTION

Once Decisions A and B are resolved, Claude/Fable must produce one doctrine-alignment commit on `main` before runtime execution.

Minimum targets to inspect/update/classify:

- `AGENTS.md`
- `CLAUDE.md`
- `agent.md`
- `agent-contracts/AGENTS.md`
- `ROOT-MAP.md`
- `briefings/COUNCIL-FINAL-ARCHITECTURE-PACKET-2026-08-17.md`
- relevant active Paperclip/OmniRoute startup scripts and scheduled-task docs
- relevant skill/bootstrap documentation

Do not mass-delete history. Use clear metadata/headers such as:

- `CURRENT_CANONICAL`
- `CURRENT_REFERENCE`
- `HISTORICAL`
- `SUPERSEDED`
- `ARCHIVE`
- `UNVERIFIED`

Every superseded authority document should point at the replacement authority.

After the alignment commit, verify the commit exists on `origin/main` and record its SHA in the Manus handoff.

---

# 3. INVARIANTS THAT SURVIVE EITHER AUTHORITY CHOICE

The following recommendations from OpenAI + Grok remain approved regardless of whether C/F or Paperclip/Mission Control wins.

## 3.1 Evidence over prose

- build success is not runtime proof
- HTTP 200 is not functional proof
- a running process is not end-to-end proof
- a dashboard green light is not proof if the probe is wrong
- a task marked done is incomplete if expected artifact/commit/result evidence is absent
- missing telemetry is `UNAVAILABLE`, never invented

## 3.2 Git

- `main` is the only long-lived branch
- no force push
- stage only intended files
- never sweep unrelated shared-tree changes with `git add -A`
- synchronize before push where needed
- verify the final commit exists on `origin/main`
- swarm-originated push authority follows the currently-approved judge policy unless Joshua directly overrides it

## 3.3 OmniRoute

Once restored/selected as required routing policy:

- no silent provider bypass
- fail closed if required routing is unavailable
- use an explicit blocked/degraded reason
- direct-provider exceptions require explicit Joshua approval
- observed correlation events, not decorative expected-state animation

Recommended blocked reason:

`BLOCKED_OMNIROUTE_UNAVAILABLE`

## 3.4 Broadcast Mode / Iron Wall

Canonical name:

`BROADCAST_MODE`

Sanitize **server-side before transport** to browser/WebSocket/SSE/API consumer.

Frontend masking is only defense-in-depth.

Fail closed on uncertain content.

Cover at minimum:

- API keys/tokens/JWTs
- cookies/authorization headers
- `.env` / vault values
- webhook URLs/secrets
- private query parameters
- credentials in command lines
- private IPs/hostnames when public display does not require them
- Windows and WSL/Unix local paths
- credential-bearing Git remotes
- MCP/tool configuration secrets
- raw prompts/tool I/O
- stack traces/errors/log lines
- graph labels generated from sensitive source data

Synthetic leak tests must prove the original secret string never reaches the client payload.

## 3.5 Cost telemetry / Burn Ledger

Approved only with confidence classes:

- `MEASURED`
- `CALCULATED_FROM_VERIFIED_USAGE`
- `ESTIMATED`
- `SUBSCRIPTION_INCLUDED`
- `LOCAL_NO_METERED_API_COST`
- `UNAVAILABLE`

Missing telemetry must never render `$0.00`.

Local/no-metered-API cost does not mean electricity/compute is literally free.

## 3.6 Traffic graph

Approved only when pulses derive from observed routing events.

No fake activity.

Broadcast Mode uses logical labels rather than private IP/path details.

## 3.7 Founder/council UI

Joshua remains final human authority.

Display council participants only when configured/real.

Every visible decision must map to a persisted decision event containing at least actor, subject, timestamp, and decision.

Do not fabricate seven voters for presentation aesthetics.

## 3.8 Historical 10% widget

Do not implement a `10% Floor Compliance Monitor` from historical material.

A historical proposal, mission file, percentage, split, cap, or accounting rule does not become current product execution policy by retrieval alone.

Only an explicit current Joshua decision plus an authoritative data source may create a current compliance widget.

## 3.9 Knowledge authority

Apply the six authority labels to retrievable artifacts, not merely to docs humans happen to open.

Pieces/RAG/Mission Control/Skill Brain retrieval must carry authority metadata so stale topology and policies cannot silently outrank current doctrine.

## 3.10 Idempotency

Every consequential mutating operation must be retry-safe.

Use stable task/run identity plus provider idempotency key or detect-before-create/durable completion markers for:

- deployments
- posts/messages
- generated assets
- external tickets
- purchases/payments
- other consequential side effects

Recovery must distinguish completed / partial / abandoned / externally-completed-but-not-locally-recorded.

---

# 4. SKILL BRAIN — KEEP AS CANDIDATE UNTIL HARDENED

The supplied `skillbrain_mcp.py` concept is approved as a short-context capability librarian, but Grok correctly found it is not currently present/registered in the repo.

Do not call Skill Brain production infrastructure until all of these are implemented and tested:

1. canonical repo skill root derived from the resolved path decision
2. arbitrary path reads blocked outside approved roots
3. `resolve()`/canonical path membership enforcement
4. symlink/junction/reparse escape protection
5. raw MCP/plugin manifests sanitized before entering model context
6. deterministic duplicate/conflict handling
7. repo-controlled skill precedence over stale local caches
8. generated skills created in staging/quarantine, not silently activated
9. schema/frontmatter validation
10. secret scan before promotion
11. provenance including creator + task/run identity
12. content hash/version/source in catalog results
13. registration proven from every intended client/runtime
14. path-escape negative test
15. synthetic-secret negative test
16. duplicate-skill conflict test

Recommended fleet model:

`tiny bootstrap instructions/capabilities + on-demand load of the one task skill from the canonical Git-controlled tree`

Do not make both a large mandatory preload bundle and on-demand loading simultaneously mandatory.

Runtime-specific minimal bootstrap exceptions are allowed when technically required.

---

# 5. WRITE COORDINATION

The shared-tree concurrency risk is real.

Claude/Fable must choose one enforced model for the resolved canonical working tree:

## Model 1 — single mutator at a time

Mission Control/current task owner grants one active mutation slot.

Simplest choice while the fleet is small.

## Model 2 — scoped write lease

Use atomic DB transaction or atomic file replacement.

Recommended fields:

- `lease_id`
- `owner`
- `task_id`
- `run_id`
- `acquired_at`
- `expires_at`
- heartbeat interval
- explicit path/file scope
- starting Git SHA

Stale lease reclamation must log previous owner + claimant + timestamp.

Do not build a decorative lease system that agents can ignore.

---

# 6. WHAT TO DEFER UNTIL THE CONTROL PLANE IS TRUE

Do not spend implementation time on these until authority, routing, correlation, and Broadcast Mode are proven:

- decorative animated traffic graph
- cosmetic multi-seat council presentation
- broad cost dashboards with incomplete telemetry
- complex self-healing choreography
- historical percentage/compliance widgets
- any green/red health UI that is not tied to functional probes

Prefer five truthful operational views over twenty visually impressive false ones.

---

# 7. CLAUDE/FABLE REQUIRED SYNTHESIS OUTPUT

After the two authority decisions are resolved and doctrine alignment is committed, produce one final Manus execution document.

It must contain:

1. resolved canonical path
2. resolved task/control-plane owner
3. supersession commit SHA
4. exact current runtime inventory: `VERIFIED_NOW` vs `CONFIGURED_NOT_VERIFIED` vs `NOT_INSTALLED`
5. architecture chain using only components that are current or explicitly being restored
6. OmniRoute restore/enforcement plan if OmniRoute remains required
7. Mission Control authority/projection boundary
8. Git mutation/judge/write-coordination policy
9. Skill Brain status and hardening scope
10. Broadcast Mode server-side redaction contract
11. correlation/event envelope
12. idempotency/recovery contract
13. Burn Ledger confidence rules
14. UI features accepted now vs deferred
15. stale artifacts to mark historical/superseded
16. exact end-to-end positive acceptance test
17. exact negative tests
18. rollback/stop conditions
19. final `GO` / `NO-GO` gate

Do not ask Manus to reinterpret the council history from scratch. Give Manus the resolved facts and explicit execution order.

---

# 8. MANUS EXECUTION PROMPT TEMPLATE — USE ONLY AFTER BLOCKERS ARE RESOLVED

Claude/Fable should hand Manus a prompt with this structure after the doctrine-alignment commit exists:

```text
MANUS — FINAL ANTIGRAVITY MISSION CONTROL SYNTHESIS / EXECUTION

You are receiving a RESOLVED authority packet. Do not reopen historical conflicts unless repository evidence contradicts the supplied supersession commit.

Read first:
1. [resolved canonical authority files]
2. briefings/GROK-FINAL-REVIEW-2026-08-17.md
3. the final Claude/Fable synthesis file
4. the doctrine-alignment commit [SHA]

Resolved canonical repo path: [C:\ANTIGRAVITY OR F:\ANTIGRAVITY]
Resolved control plane: [MISSION CONTROL OR REACTIVATED PAPERCLIP]
Git branch rule: main only
Supersession commit: [SHA]

Execution law:
- no fake green
- evidence over prose
- no silent provider bypass
- server-side Broadcast Mode redaction before client transport
- no invented cost/health/routing telemetry
- idempotent consequential actions
- preserve main-only Git and current judge/push policy
- historical artifacts are not current authority
- do not implement the 10% historical widget
- do not add UNIVERSAL_STATE.md unless explicitly re-approved in the resolved synthesis
- Skill Brain is production only if its security acceptance tests pass

Execute in the exact order provided by the final synthesis.

For every stage classify:
VERIFIED_NOW
CONFIGURED_NOT_VERIFIED
OPTIONAL
DEPRECATED_OR_SUPERSEDED
BLOCKED

Stop rather than guessing when a required authority/runtime fact contradicts the resolved packet.

Before final GO, run the specified positive and negative acceptance suite and provide machine evidence.
```

---

# 9. CURRENT GO/NO-GO

**NO-GO for Manus runtime execution until Decisions A and B are explicitly resolved and committed.**

The next useful action is authority alignment, not another dashboard feature.

Once the two decisions are explicit, the rest of the council recommendations can be synthesized cleanly without preserving contradictory topology/control-plane assumptions.
