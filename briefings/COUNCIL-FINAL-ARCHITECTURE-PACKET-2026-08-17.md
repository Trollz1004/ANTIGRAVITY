# COUNCIL FINAL ARCHITECTURE PACKET — 2026-08-17

> **SUPERSEDED FOR EXECUTION:** The old-drive and Paperclip-runtime assertions in this historical packet are non-executable. The S1 draft names `C:\ANTIGRAVITY` as the sole canonical working tree and states that no Paperclip runtime is active. See `briefings/S1-DOCTRINE-SUPERSESSION-DRAFT-2026-08-19.md`.

**Purpose:** historical adversarial-review packet retained for provenance.

**Repository:** `Trollz1004/ANTIGRAVITY`

**Canonical working tree:** `F:\ANTIGRAVITY`

**Git operating rule:** `main` is the only long-lived branch.

**Human authority:** Joshua Coleman retains final approval authority.

**Review rule:** machine/repository evidence outranks prose claims. Older briefings, migration notes, ZIP handoffs, proposals, generated docs, and AI messages are historical evidence unless they agree with current root authority and current runtime state.

---

## 0. GROK — THIS IS YOUR FINAL ADVERSARIAL PASS

You are the last reviewer before this goes onward. Do not save objections, missing requirements, simplifications, or security concerns for a later round.

Read the current repo authority files first, especially `AGENTS.md`, `ROOT-MAP.md`, the relevant Paperclip/OmniRoute/Mission Control implementation, and this packet.

Your response must classify findings as:

- `VERIFIED_FROM_REPO`
- `SUPPORTED_BUT_NOT_RUNTIME_VERIFIED`
- `RECOMMENDATION`
- `STALE_OR_CONFLICTING`
- `BLOCKER`
- `OPTIONAL`

Do not reply with generic approval. For every material issue you see, give the exact fix or exact wording you want added.

When finished, push your complete review to:

`briefings/GROK-FINAL-REVIEW-2026-08-17.md`

on `main`, then return the GitHub file URL and commit SHA to Joshua. Do not leave an alternate branch behind.

Your review is the final opportunity in this pass to challenge assumptions before the next reviewer consumes the merged packet.

---

# 1. SUPERSEDED HISTORICAL AUTHORITY CLAIMS — DO NOT EXECUTE

For this review, the current root repo instructions establish these working truths:

1. `F:\ANTIGRAVITY` is the canonical repo path on the current Sabretooth node.
2. Older `E:\...`, `C:\ANTIGRAVITY`, and old T5500-only topology notes are historical unless explicitly revalidated.
3. `main` is the only long-lived branch.
4. Work is not done until it is committed, synchronized, pushed, and confirmed on `origin/main`.
5. Never sweep-stage unrelated agent work. Stage only intended files.
6. Never force-push.
7. Verify by content/state/IDs/commits, not merely exit code 0, HTTP 200, successful build, or a green dashboard light.
8. OmniRoute is the single model-routing surface; agents must not silently choose providers behind the control plane.
9. `.agents/skills/` is the canonical repo skill tree, while Hermes also has its own separate skill tree. Skill counts are diagnostics, not immutable architecture.
10. Existing Mission Control generations and ClawX must be reconciled intentionally rather than creating another competing dashboard/state authority.

Do not silently rewrite old docs merely to make them look current. Classify them, supersede them explicitly, and keep provenance where useful.

---

# 2. SUPERSEDED PAPERCLIP RUNTIME REQUIREMENTS — DO NOT EXECUTE

The final stack must prove that submitted work becomes a **real Paperclip task**, is associated with a **real Paperclip agent/run/heartbeat**, traverses a registered Paperclip adapter/boundary, and ends with authoritative status visible through Paperclip.

A custom ingress such as `paperclip_server.py`, webhook, intake service, or compatibility bridge is allowed only if it is a thin boundary into genuine Paperclip ownership.

Every such bridge must expose/correlate the resulting Paperclip identifiers.

Minimum acceptance evidence:

- Paperclip task ID
- Paperclip run/heartbeat ID where supported
- selected Paperclip agent
- adapter/launcher identity
- start/end lifecycle evidence
- final Paperclip state
- downstream OmniRoute correlation
- final repo/result reference

If a custom service maintains a separate authoritative queue/status lifecycle that Paperclip does not own, classify it as competing infrastructure and remove/quarantine it from the canonical path.

---

# 3. HISTORICAL OMNIROUTE MODEL — SEE CURRENT S1 DRAFT

Required conceptual chain:

`Paperclip -> registered adapter/launcher -> OmniRoute -> selected runtime/agent -> work/result`

Do not allow Paperclip, OpenCode, Hermes, OpenClaw, Codex, Claude wrappers, Ollama, or another harness to silently create an undocumented direct-provider bypass.

Local runtimes are fine when OmniRoute intentionally dispatches to them. The point is control-plane truth, not forcing every runtime to be remote.

If OmniRoute is required for the selected route and unavailable, fail closed rather than silently changing provider/governance path.

Recommended reason code:

`BLOCKED_OMNIROUTE_UNAVAILABLE`

Any bypass exception must be explicit and approved by Joshua, not inherited from stale config.

---

# 4. SUPERSEDED GIT / REPO COORDINATION — DO NOT EXECUTE

The canonical repository is `Trollz1004/ANTIGRAVITY`, working root `F:\ANTIGRAVITY`.

Rules:

- `main` is the only long-lived branch.
- no feature branch solely because a generic agent workflow recommends one
- if a tool temporarily requires a branch, merge and delete it in the same bounded operation
- no force push
- no `git add -A` in a shared working tree
- commit only intended files
- synchronize/rebase before push when necessary
- verify the pushed commit exists on `origin/main`
- record the final commit SHA in task/run evidence

## Repo write lease

Because multiple agents can work concurrently, formalize a write lease for canonical-tree mutation.

Suggested fields:

- lease owner/agent
- Paperclip task ID
- Paperclip run ID
- acquired timestamp
- heartbeat/expiry
- intended file scope
- starting Git SHA

Other agents may read while a lease is held. They must not mutate overlapping files. Stale lease recovery must be deterministic and auditable.

The lease is coordination; Git remains code/version authority.

---

# 5. AUTHORITY MODEL — NO COMPETING MEMORIES

Recommended hierarchy:

- **Paperclip:** task ownership, assignment, execution lifecycle/run identity.
- **Git `main`:** code, versioned config, durable instructions, versioned docs.
- **Current root authority files:** current human-readable repo doctrine, subject to explicit Joshua updates.
- **Mission Control:** observer/control projection over authoritative sources, not an independent shadow truth database.
- **Pieces/retrieval memory:** context/retrieval assistance only; never silently overrides Paperclip/Git/current authority.
- **Skill Brain:** capability librarian only; never policy/task authority.

## `UNIVERSAL_STATE.md`

Treat a `UNIVERSAL_STATE.md` coordination file as **proposed unless current canonical implementation is found and verified**.

If used, it should reference real Paperclip IDs, current Git SHA, lease/checkpoint state, and other authoritative identifiers. It must not create a competing lifecycle.

Do not add it merely because an older AI prompt said it should exist if the current stack already has a better durable coordination primitive.

---

# 6. SESSION, INTERRUPTION, AND CRASH RECOVERY CONTRACT

A mutating session should establish enough state for deterministic recovery.

At start resolve/read:

- assignment/task ID
- run/heartbeat identity
- canonical repo root
- current Git HEAD/status
- current operating instructions
- relevant task-specific state
- required skill/capability
- repo write lease state
- permitted retrieval/Pieces context when useful

At completion record:

- task/run status
- files changed
- verification performed
- commit SHA
- push confirmation
- external side-effect IDs
- coordination checkpoint update if used
- write lease release

For interrupted work preserve:

- active task/run ID
- agent identity
- starting/last Git SHA
- intended/dirty file scope
- last successful checkpoint
- lease owner + expiry/heartbeat
- external action/idempotency IDs

A recovery agent must distinguish completed, partial, abandoned, and externally-completed-but-not-locally-recorded actions.

---

# 7. IDEMPOTENCY — REQUIRED

Retries and duplicated events must not silently duplicate:

- commits
- deployments
- generated assets
- outbound posts/messages
- tickets/tasks
- purchases/payments
- other consequential external effects

Use stable task/run identity plus one or more of:

- provider-supported idempotency keys
- detect-before-create
- deterministic artifact naming/versioning
- durable completion markers tied to authoritative task/run identity

Mission Control must render retry/duplicate state honestly.

---

# 8. MISSION CONTROL — OBSERVABILITY FIRST

Mission Control must visualize observed reality, not expected reality.

Do not animate a routing pulse because routing *should* have occurred. Animate after an observed event proves it.

Recommended sanitized correlation envelope:

- `event_id`
- timestamp
- company/project ID where applicable
- `paperclip_task_id`
- `paperclip_run_id`
- adapter
- OmniRoute route/run label/ID if available
- runtime/agent
- event type
- status
- sanitized action summary
- Git reference/commit when applicable
- sanitized result summary
- degraded/block reason
- retry/idempotency metadata

Desired trace:

`company/project -> Paperclip task -> Paperclip run -> adapter -> OmniRoute route -> runtime/agent -> repo commit/result`

Missing telemetry is `UNAVAILABLE`, never invented.

---

# 9. BROADCAST MODE / IRON WALL — APPROVED, SERVER-SIDE FIRST

Gemini's Broadcast Mode concept is approved with stronger enforcement.

Canonical control name:

`BROADCAST_MODE`

Legacy `Stream Mode` labels may alias to the same security state, not create a second implementation.

Redaction/tokenization must occur **before transport to the client/browser/WebSocket/SSE consumer**.

At minimum suppress or safely tokenize:

- API keys/tokens
- authorization headers
- cookies/session secrets
- `.env` values
- webhook URLs/secrets
- credential-bearing query strings
- repo credentials
- private provider credentials
- private IP addresses when not needed publicly
- local usernames/hostnames when not needed publicly
- local paths such as `F:\ANTIGRAVITY`
- Discord/Telegram webhook endpoints
- raw prompts/tool payloads likely to contain private information

Frontend masking is defense-in-depth only.

Fail closed: uncertain content is omitted or replaced with a logical label.

Examples:

`127.0.0.1:20128` -> `OMNIROUTE_GATEWAY`

`F:\ANTIGRAVITY\frontend\react-app` -> `CANONICAL_REPO/frontend/react-app`

Required synthetic leak tests:

- API key
- JWT
- webhook
- private IP
- Windows path
- WSL/Unix path
- query-string secret
- command-line secret
- nested JSON/tool-output secret

A test passes only if the sensitive source value never reaches the client payload.

---

# 10. BURN LEDGER — APPROVED WITH COST TRUTH

Gemini's cost telemetry is useful if accounting confidence is explicit.

Cost classes should distinguish:

- `MEASURED`
- `CALCULATED_FROM_VERIFIED_USAGE`
- `ESTIMATED`
- `SUBSCRIPTION_INCLUDED`
- `LOCAL_NO_METERED_API_COST`
- `UNAVAILABLE`

Do not show `$0.00` merely because data is missing.

Local inference may show `LOCAL_NO_METERED_API_COST` where appropriate; that does not mean compute/electricity is literally free.

Subscription-backed reasoning must not be falsely converted into exact per-request spend unless a defensible allocation method exists and is labeled estimate.

If prices are used, store/display source/version timestamp so outdated model pricing cannot masquerade as current accounting.

Useful grouping:

- Paperclip task/run
- agent/runtime
- model/provider route
- local vs metered
- time window

---

# 11. OMNIROUTE TRAFFIC MAP — APPROVED

Live graph is approved, but pulses follow observed routing events.

Recommended logical nodes:

- user/input
- Paperclip
- adapter/launcher
- OmniRoute
- selected runtime/agent
- repo/external result

Broadcast Mode uses logical names, not private infrastructure addresses.

Visual states should distinguish:

- active
- completed
- degraded
- blocked
- retrying
- telemetry unavailable

A running process is not automatically a healthy end-to-end path.

D3.js is optional implementation detail, not an architectural invariant.

---

# 12. FOUNDER OVERRIDE / CLAWX COUNCIL — APPROVED WITH REAL DECISION EVENTS

A Founder Override / council panel is useful if it maps to actual decision state.

Suggested states:

- `DRAFT`
- `UNDER_REVIEW`
- `WAITING_FOR_FOUNDER_OVERRIDE`
- `APPROVED`
- `REJECTED`
- `EXECUTING`
- `BLOCKED`
- `COMPLETED`

Joshua holds final human authority for actions requiring his approval.

Do not hard-code seven active seats unless seven configured participants actually exist.

A visible vote/decision must map to a stored event containing actor, timestamp, subject, and decision. Never fabricate consensus for aesthetics.

---

# 13. SKILL BRAIN — APPROVED CONCEPT, HARDEN BEFORE FLEET AUTHORITY

The supplied `skillbrain_mcp.py` has a strong short-context goal: search lightweight metadata, load one capability body on demand, and avoid stuffing the entire skill shelf into each agent context.

Before treating it as production fleet infrastructure, address these issues:

## 13.1 Canonical root configuration

Its current defaults include older C: paths and local user skill directories. Final active config must explicitly include the canonical `F:\ANTIGRAVITY\.agents\skills` path and its WSL equivalent `/mnt/f/ANTIGRAVITY/.agents/skills` where relevant.

Do not claim a Windows path literal is automatically cross-platform under WSL.

Prefer one canonical configuration/environment mapping over scattered hard-coded roots.

## 13.2 Block arbitrary path reads

`skillbrain_get` must not be allowed to read an arbitrary existing filesystem path just because the caller supplies it.

Resolve/canonicalize requested paths and require membership inside approved Skill Brain roots.

Protect against:

- `..` traversal
- symlink escapes
- junction/reparse-point escapes where applicable
- alternate path spellings/case tricks

Return an explicit denial such as:

`ACCESS_DENIED_OUTSIDE_SKILL_ROOTS`

## 13.3 Sanitize plugin/MCP manifests

Tool/plugin manifests may contain environment values, arguments, URLs, headers, or credentials.

Do not dump raw secret-bearing manifests into model context.

Return a sanitized representation with secret-bearing fields omitted/tokenized unless a specifically authorized trusted admin path requires more.

## 13.4 Deterministic duplicate handling

Same-name skills across multiple roots must not silently shadow each other.

Expose:

- canonical path
- source/root
- version/hash
- provenance
- authority tier

If multiple active copies conflict, surface `CONFLICT` and require deterministic precedence/resolution.

Canonical Git-controlled repo skills should outrank stale local cache copies unless Joshua configures otherwise.

## 13.5 Govern create-skill

Do not silently generate permanent untracked capabilities into whichever root appears first.

Preferred lifecycle:

`create -> staging/quarantine -> validate frontmatter/schema -> secret scan -> provenance/task/run metadata -> review -> promote through normal Git main-only workflow`

Never auto-activate an unreviewed generated skill.

## 13.6 Version the catalog

Expose at least:

- content hash
- modification time
- source/root
- status/authority

Counts such as `200+`, `228`, `229`, or `282` are runtime diagnostics, not timeless facts.

## 13.7 Prove registration

Verify Skill Brain from every intended client/runtime rather than assuming its MCP registration exists.

Acceptance flow:

`roots -> search -> load exactly one skill -> use it -> release/drop context`

Also prove:

- outside-root path denied
- duplicate conflict detected
- synthetic secret sanitized
- canonical F: skill root discovered

---

# 14. SKILL SYSTEM RECONCILIATION

Current repo material contains multiple skill-management models:

- a canonical repo `.agents/skills/` tree
- a separate Hermes skill tree
- preloading guidance in current repo docs
- the newer Skill Brain concept proposing load-on-demand short context

Do not simply stack all of them together.

Grok must recommend one coherent rule for:

- what is mandatory at session/bootstrap level
- what is discovered on demand
- which tree is canonical
- how Hermes-local copies coexist with repo skills
- how duplicates are detected
- how updates are promoted/versioned

The preferred direction is minimal bootstrap + on-demand capability retrieval, but it must remain compatible with runtimes that require a small fixed bootstrap instruction set.

---

# 15. KNOWLEDGE AUTHORITY / STALE-DOCUMENT QUARANTINE

Historical material in the ecosystem contains old paths, old node topology, old branch workflows, old agent roles, and old business/mission rules.

Every retrievable artifact should be classifiable as one of:

- `CURRENT_CANONICAL`
- `CURRENT_REFERENCE`
- `HISTORICAL`
- `SUPERSEDED`
- `ARCHIVE`
- `UNVERIFIED`

Historical documents may remain searchable for provenance. They must not silently become current operating requirements.

This is especially important for:

- drive/node topology
- provider routing
- branches/worktrees
- agent authority
- marketing/compliance language
- revenue/split/cap/percentage rules
- old mission/charity integration concepts

A numeric policy appearing in an old proposal or old briefing does not authorize a current dashboard compliance widget.

---

# 16. GEMINI ADDENDUM — DECISIONS

## APPROVED WITH HARDENING

1. **Burn Ledger** — yes, with measured/estimated/unavailable distinction.
2. **Iron Wall / Broadcast Mode** — yes, server-side fail-closed redaction before transport.
3. **OmniRoute Traffic Map** — yes, driven by observed events, not decorative fake activity.
4. **Founder Override / Council UI** — yes, driven by real configured participants and persisted decision events.

## NOT CURRENTLY APPROVED

**"10% Floor Compliance Monitor"** is not accepted into current architecture merely because it appears in historical material.

Do not implement it unless Joshua explicitly re-establishes a current operating policy requiring it and defines the authoritative data source and scope.

This packet intentionally prevents historical percentage/split doctrine from silently re-entering current execution policy.

---

# 17. HEALTH, SELF-HEALING, AND CIRCUIT BREAKERS

A full system health view should distinguish process health from functional health.

Health checks should independently evaluate, as applicable:

- Paperclip
- OmniRoute
- Mission Control API/event stream
- Pieces/retrieval components
- Skill Brain
- required MCP servers
- selected runtime adapters
- canonical repo/Git state
- write lease state
- external dependencies explicitly needed by the active task

Circuit breakers should prevent repeated failing calls from creating spend/noise/storms.

Auto-recovery actions must be bounded, logged, idempotent, and visible.

Do not auto-recover by switching to a different paid provider or bypassing governance unless that behavior is explicitly approved.

A health dashboard must support honest `DEGRADED` / `ISOLATED` / `BLOCKED` states rather than forcing everything into green/red.

---

# 18. STREAM-READINESS ACCEPTANCE TEST

Before calling the setup complete, run one harmless representative end-to-end task and retain sanitized evidence proving:

1. Paperclip created/owned the task.
2. A real Paperclip agent/run/heartbeat occurred.
3. The registered adapter/launcher was used.
4. OmniRoute observed/routed the execution.
5. The intended runtime/agent executed.
6. Session/bootstrap authority was read.
7. Skill retrieval used the intended current capability model.
8. Repo write coordination was respected.
9. The intended files changed.
10. Relevant tests/checks passed.
11. The change was committed to `main`.
12. The commit was pushed and confirmed on `origin/main`.
13. Final authoritative task status matched reality.
14. Mission Control displayed the actual event chain.
15. Broadcast Mode displayed the sanitized event chain.
16. No source secret reached the client payload.
17. No alternate branch remained.
18. Correlation IDs/commit SHA let an operator audit the entire path later.

Also perform deliberate negative tests:

- **OmniRoute-down test:** expected result is blocked/degraded with no silent provider bypass.
- **Interruption/restart test:** prove recovery resumes from recorded state without duplicating the external side effect.
- **synthetic-secret test:** prove server-side sanitization catches nested/common secret forms.
- **Skill Brain path-escape test:** prove outside-root reads are denied.
- **duplicate-skill test:** prove conflicting active copies are surfaced rather than silently shadowed.

---

# 19. FINAL STATUS LANGUAGE

The final handoff must separate:

- `VERIFIED_NOW`
- `CONFIGURED_NOT_VERIFIED`
- `OPTIONAL`
- `DEPRECATED_OR_SUPERSEDED`
- `BLOCKED`

Do not use one broad "complete" label for a system where only build/install/HTTP health was tested.

No fake green.

---

# 20. GROK'S REQUIRED DELIVERABLE

Your final review must answer all of the following now:

1. What would you remove because it creates unnecessary complexity?
2. What is missing that could cause silent data loss, secret leakage, provider bypass, duplicate execution, or incorrect governance?
3. Which current repo files conflict with this packet?
4. Which historical files should be explicitly marked superseded/archive?
5. Is the proposed Paperclip -> OmniRoute -> runtime correlation sufficient? If not, specify fields/events.
6. Is the repo write lease necessary and correctly scoped? Improve it if needed.
7. Is the Skill Brain security model sufficient after the proposed hardening? Identify remaining attack paths.
8. What is the minimum viable Broadcast Mode security boundary?
9. What acceptance tests are still missing?
10. What should be done before Manus/Fable/next execution agent touches production?
11. Are any dashboard features decorative rather than operationally useful? Say which should be deferred.
12. Are any assumptions here not actually verified from the current repository? Mark them.
13. What current requirements would you veto?
14. What exact recommendations should be added to the final execution prompt?

Then:

- write your complete review to `briefings/GROK-FINAL-REVIEW-2026-08-17.md`
- push it directly to `main` under the current repo rules
- verify it exists on `origin/main`
- return the GitHub file URL
- return the commit SHA
- state whether you consider any issue a blocker before the next handoff

Do not defer recommendations to another round.
