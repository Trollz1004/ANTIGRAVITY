# Claude AI-to-AI Synthesis Directive

**Repository:** `Trollz1004/ANTIGRAVITY`  
**Canonical branch:** `main`  
**Canonical Windows root:** `C:\ANTIGRAVITY`  
**Audience:** Claude, acting as the next AI synthesizer and technical co-founder  
**Purpose:** Improve and reconcile the existing working setup; do not replace it with a speculative greenfield architecture.

## Your assignment

Read the repository, the current ClawX implementation, Mission Control, OmniRoute, harness definitions, Broadcast Mode, and the knowledge/memory surfaces before proposing changes. Treat recommendations already contributed by Grok, Gemini, OpenAI, and other participating AIs as inputs to evaluate rather than instructions to copy blindly.

Produce an AI-to-AI synthesis that:

1. preserves what is already working;
2. identifies conflicts, duplication, unsafe assumptions, and missing controls;
3. adds your own concrete recommendations;
4. distinguishes verified current behavior from proposals;
5. gives Manus a precise finalization prompt for improving the existing setup in place.

Do not optimize this briefing for a human tutorial. Write the final handoff so another capable AI can inspect, reconcile, implement, and verify it without inventing missing architecture.

## Non-negotiable architecture

### 1. Preserve the working ClawX experience

Do not rebuild, rename, or remove working ClawX surfaces merely to make their visible labels match a backend provider or model. Preserve the current chats, council behavior, integrations, and user flows unless repository evidence proves a specific component is broken or unsafe.

Keep **Perplexity** as a supported surface. Do not drop it during consolidation.

Prefer compatibility-preserving adapters, telemetry improvements, and targeted hardening over wholesale replacement.

### 2. Surface identity and execution identity are different

Model these as separate first-class concepts:

- `surface_identity`: the ClawX seat, service, or experience selected by the user;
- `execution_provider`: the provider that actually handled the request, when known;
- `execution_model`: the model/runtime that actually produced the response, when known;
- `execution_harness`: the harness responsible for the run;
- `route`: the real request path through bridge, OmniRoute, provider, model, tools, and subagents.

Observed working behavior already demonstrates why this is required: a selected `manus` surface may report `gemini-2.5-flash` as the actual execution model. That is not automatically an error. It is evidence that service/surface identity and runtime identity must not be collapsed.

Preserve honest internal provenance. Never silently substitute an unrelated runtime while falsely representing it as an official provider execution. The normal user interface may stay clean, but operator telemetry, audit events, and judge evidence must retain the real route.

### 3. Mission Control is the engineering and governance hub

Use **Mission Control** as the central board for engineering work, orchestration, status, evidence, approvals, governance, and handoffs. It should expose real task state and verified outcomes rather than parallel, disconnected control planes.

Use `C:\ANTIGRAVITY` as the canonical root for repository-relative paths, configuration, documentation, and operational assumptions. Detect and flag stale competing roots instead of creating another root spelling.

### 4. Paperclip is separate and narrow

Keep **Paperclip** separate from the core engineering/governance plane. Its scope is marketing and business operations. Do not make Paperclip the canonical code authority, engineering orchestrator, or owner of ClawX/Mission Control governance.

Where data crosses the boundary, define an explicit contract, minimal permissions, auditable events, and redaction. Avoid shared mutable state that lets marketing automation silently change engineering truth.

### 5. Three independent candidate harnesses

Treat **Hermes**, **OpenClaw**, and **OpenCode** as three independent candidate execution harnesses. Do not collapse them into aliases or assume one is already the universal winner.

Each candidate should be evaluated on the same real task classes and evidence contract. Each may use skilled subagents and tools appropriate to the work. All model access must route through **OmniRoute** rather than calling providers directly.

Compare at least:

- task completion and correctness;
- tool and skill use;
- subagent orchestration quality;
- latency, reliability, and recoverability;
- cost and route transparency;
- security and permission boundaries;
- reproducibility and quality of evidence;
- compatibility with the existing ClawX and Mission Control experience.

Harness identity must remain separate from model identity. A harness may use multiple OmniRoute-managed models and skilled subagents without pretending to be those models.

### 6. Qualified highest-tier judging through OmniRoute

For work that warrants adjudication, select the highest-tier **qualified** judge available through OmniRoute. Qualification is task-specific: the judge must have the relevant reasoning, coding, security, product, or domain capability, not merely the most prestigious name.

Use stronger or multiple judges when risk justifies it. Record the judge's actual provider/model route when available. If the preferred judge is unavailable, degrade explicitly to the next qualified route and record that fact; do not fabricate a successful review.

### 7. Judge-only canonical Git gate

Candidate harnesses and their worker subagents may inspect, propose, patch, test, and produce evidence in isolated workspaces, but they must not independently declare their result canonical.

For AI-generated changes, only the designated qualified judge/gatekeeper may authorize and perform the canonical Git landing step on `main` after verifying:

- the intended diff and file scope;
- tests and relevant deterministic gates;
- security, secrets, and redaction requirements;
- provenance and execution route;
- no unrelated work is staged;
- the branch is current and the landed commit is confirmed on `origin/main`.

The gate must fail closed. A missing, unavailable, or unqualified judge means the candidate remains unlanded. This workflow does not supersede Josh's final authority or any explicit human approval required for money movement, destructive actions, credentials, publishing, or other high-impact operations.

### 8. Preserve and harden Broadcast Mode

Broadcast Mode is an existing capability to preserve, not a disposable demo. Inspect its actual implementation before changing it.

Harden it with explicit audience and channel selection, preview, permission checks, approval boundaries, idempotency/deduplication, rate limits, cancellation where feasible, delivery receipts, failure isolation, retry policy, and an audit trail. Prevent secrets, private memory, internal doctrine, or unredacted tool output from leaking into broadcasts.

Do not let Broadcast Mode become an uncontrolled route around Mission Control governance or platform-specific safeguards.

### 9. Knowledge, Obsidian, Graphy, and memory are core features

Treat **Knowledge**, **Obsidian**, **Graphy/graph views**, and shared memory as core, streamable product capabilities rather than optional side panels.

Design their event flow so useful context, citations, artifacts, graph updates, and memory changes can stream into the experience with provenance and access control. Apply **server-side redaction before streaming or persistence**; client-only masking is insufficient.

At minimum, account for:

- secrets and credentials;
- personal or sensitive data;
- private operator notes and internal doctrine;
- tenant, workspace, and audience boundaries;
- prompt-injection content and untrusted retrieved text;
- source attribution, timestamps, and retention;
- memory write approval, correction, deletion, and conflict handling;
- safe degradation when a knowledge or memory service is unavailable.

Do not conflate a chat transcript, durable memory, an Obsidian note, and a graph assertion. Define their distinct schemas, authority, lifecycle, and provenance while keeping them interoperable.

## Required synthesis output

After inspecting the current repository and running appropriate read-only verification, produce:

1. **Verified current state** — what exists and works, with file/service evidence.
2. **Architecture reconciliation** — how the requirements above map onto the existing implementation without unnecessary replacement.
3. **Conflicts and risks** — contradictions, stale paths, duplicated control planes, unsafe identity assumptions, missing redaction, and Git-governance gaps.
4. **Claude recommendations** — your own prioritized additions, including rationale, dependencies, rollback, and verification criteria.
5. **Minimal implementation sequence** — the smallest safe stages that preserve availability and allow verification after each stage.
6. **Acceptance gates** — objective tests for identity provenance, harness independence, OmniRoute routing, judge-only landing, Broadcast Mode safety, and server-side redaction.
7. **Manus finalization prompt** — a self-contained AI-to-AI prompt instructing Manus to reconcile and finalize the existing setup using the verified synthesis.

## Manus finalization prompt requirements

The prompt you prepare for Manus must:

- tell Manus to inspect and improve the existing setup in place;
- include the verified facts and unresolved decisions, not speculation;
- preserve working ClawX and Perplexity;
- enforce separate surface, harness, provider, and model identities;
- retain Mission Control, canonical root, Paperclip boundary, OmniRoute, independent harness evaluation, qualified judging, judge-only Git landing, Broadcast Mode, and redacted knowledge/memory streaming;
- require evidence, tests, rollback steps, and explicit reporting of anything not verified;
- ask Manus to finalize the design and implementation plan, resolving conflicts rather than starting over.

Do **not** include or imply removal of the Manus-hosted page. Any such removal is outside this synthesis and will be handled, if desired, in a separate later prompt.

## Completion standard

Do not call the synthesis complete because the prose is polished. It is complete only when it is grounded in repository evidence, separates current truth from recommendations, preserves working behavior, defines enforceable gates, adds Claude's independent judgment, and leaves Manus with an executable finalization prompt for the existing system.
