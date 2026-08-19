# ClawX - Unified AI Command Center TODO

- [x] Database schema: conversations, messages, ai_providers, usage_logs tables
- [x] AI Provider integration: Claude API
- [x] AI Provider integration: Gemini API
- [x] AI Provider integration: Perplexity API
- [x] AI Provider integration: Grok API
- [x] AI Provider integration: Ollama (local)
- [x] AI Provider integration: Manus built-in LLM
- [x] tRPC routers: chat, providers, analytics
- [x] Single prompt broadcast to multiple AIs simultaneously
- [ ] Response streaming from each AI model
- [x] Dashboard layout with sidebar navigation
- [x] Chat interface with model selector (individual + broadcast mode)
- [x] Multi-panel response display for broadcast mode
- [x] Conversation history with timestamps and token tracking
- [x] API credential management via environment variables
- [x] Usage analytics dashboard: token usage, response times, costs per model
- [ ] Ollama priority mode for heavy tasks to preserve API tokens
- [x] Dark theme with clean functional design

## JoshuaCLAW Governance System

- [x] Database schema: governance_proposals and governance_votes tables
- [x] Backend: JoshuaCLAW voting logic (7 voters, 4/7 majority, odd tiebreaker)
- [x] Backend: Two-tier system (Tier 1 Critical / Tier 2 Operational)
- [x] Frontend: Red/Green light vote panel with visual vote board
- [x] Frontend: Governance page with proposal creation and vote tracking
- [x] Sidebar navigation: Add Governance page link
- [x] Tests: JoshuaCLAW voting logic tests (22 tests passing)

## YouAndINotAI Backend Critical Fixes (Pre-Launch)

- [x] Fix #3: /verify/confirm must check actual payment before marking verified
- [x] Fix #5: JWT secret must fail-fast on startup, no fallback default
- [x] Fix #1: Remove Stripe from verify.py, webhooks.py, models.py, config.py — wire Square
- [x] Fix #2: Build Square webhook handler for Bot-Shield $1 and subscriptions
- [x] Fix #4: Create tests/ directory with auth, verification, and webhook tests
- [x] Push all fixes to GitHub (commit be5eade)

## ClawX v1.1 — AI Board Upgrade & Secure API Keys

- [x] Replace Ollama with Codex (OpenAI) as 6th official AI Board member
- [x] Update all provider models to highest available: Claude Opus 4.6, Gemini 2.5 Pro, Grok-3, Perplexity Sonar Pro, Codex GPT-4.1, Manus built-in
- [x] Remove Ollama from governance voter list (keep as local utility only)
- [x] Implement secure server-side API key storage in database (encrypted, per-user)
- [x] Build Settings page: API key management UI (add/update/delete keys per provider)
- [x] API keys never exposed to frontend — all calls proxied through server
- [x] Update JoshuaCLAW governance board: replace Ollama voter with Codex voter
- [x] Update provider status cards on Home dashboard to reflect new board
- [x] Add Codex (OpenAI) API integration with GPT-4.1 model
- [x] Add sidebar nav entry for Settings page
- [x] Tests for secure key storage and Codex integration
- [x] Add user_api_keys table to database schema (encrypted, per-user, per-provider)
- [x] Build Settings/API Keys page: sign-in gated, add/update/delete keys per provider
- [x] Server-side key encryption using AES-256 before storing in DB
- [x] Auto-inject user API keys into all provider calls after login
- [x] Show provider status (Ready/No Key) based on stored keys on dashboard

## Mission Control Bridge and Runtime Health

- [x] Read and apply the canonical 2026-08-19 Claude synthesis before porting any completed work.
- [ ] Keep runtime execution and production readiness explicitly blocked until the synthesis S1 doctrine-supersession gate is landed by the authorized lane; limit this branch to code, tests, documentation, and non-production probes.
- [x] Define a server-side official-provider bridge contract for Claude, Gemini, GitHub Copilot, Meta AI, ChatGPT/OpenAI, and Manus without storing secrets in source, logs, or client code.
- [x] Route normal work through the best suitable OmniRoute cloud model, including free cloud options where appropriate; expose self-hosted Ollama only as an explicit fail-safe path, never as the default task route.
- [x] Use `http://localhost:20129/v1` as the configurable OpenAI-compatible OmniRoute bridge base; report the gateway and the optional `omniroute --mcp` process as separate health signals so an idle/offline MCP process is never misreported as a gateway outage.
- [x] Add a shared chat/broadcast surface that shows bridge availability, supported capabilities, and verified response state for each configured provider.
- [x] Add Hermes and OpenClaw as operational integrations in the ClawX dashboard, with explicit connection state and last-seen status rather than simulated activity.
- [x] Add a service-health contract for expected port, expected service identity, probe URL, timeout, and last verified response.
- [x] Implement runtime checks that distinguish a port being down from an unexpected legacy service responding on the expected port, including the Date App backend expected on port 3200.
- [x] Surface service health and mismatches in the ClawX command center and make active faults visible to the governance workflow.
- [x] Add tests for provider bridge configuration validation, provider-unavailable handling, port-down detection, and wrong-service-on-port detection.
- [x] Document implemented bridge boundaries, unavailable official APIs, configuration names only, and verified versus unverified integrations.
- [x] Evaluate OmniRoute's authenticated API-v1 root-status contract against its dedicated monitoring-health route; select one read-only probe for Mission Control and document configuration names only.
- [x] Require authenticated runtime configuration for every real-time OmniRoute bridge request, and report missing or rejected gateway authorization separately from down and wrong-service states.
- [x] Enforce official-governance isolation: official-platform votes must use their own designated bridge paths and must never be executed, impersonated, or substituted by OmniRoute; restrict OmniRoute routing to operational work for explicitly permitted integrations.

## Delivery, S1 Draft, and Post-Reinstall Alignment

- [x] Deliver `manus/call-layer` as a portable git bundle and plain patch fallback before any further implementation work; never push or commit to `main`.
- [x] Diagnose the Gemini ballot empty-payload path, reuse the known working request shape, and run one explicitly non-production validation ballot with a sanitized audit artifact.
- [x] Draft the S1 doctrine-supersession patch for stale root guidance and council-packet sections without landing the runtime gate.
- [x] Rewrite the Hermes, OpenClaw, and OpenCode harness contracts for the post-reinstall topology, and draft the FCC contract or a retirement note.
- [x] Add an identity-aware Mission Control health card for `onemin-shim` using its configured status URL and `NOT CONFIGURED` semantics.
- [x] Maintain a working-page delivery record that marks each requested item DELIVERED, DRAFTED, or BLOCKED with evidence and no secrets.
- [x] Ensure every S1 draft header and replacement contract states that `C:\ANTIGRAVITY` is the sole canonical working tree; label all F-drive claims as historical, superseded, and non-executable.
- [x] Remove Pieces LTM as an active Mission Control dependency and replace its dashboard/API contract with repository knowledge and Graphy/Obsidian-compatible status.
- [x] Give Hermes, OpenClaw, and OpenCode independent repository `STATE.md` journals that are read at session start and written at session end.
- [x] Require the skills-first readiness sequence in each harness contract: i-have-adhd token-saving discipline, Superpowers brainstorming, Agent-Reach, browser-use cookie-sync where authenticated browser work is needed, and find/create-skill discovery through skills.sh, ClawHub, and the Hermes skill hub.
- [x] Install the user-specified `i-have-adhd`, Agent-Reach, find-skills, TDD, browser-use, brainstorming, and systematic-debugging skills into the repository skill tree after reviewing their skill-installation instructions.
- [x] State that every harness must load the task-relevant skills before planning or assigning subagents, and record the loaded skills in its end-of-session journal entry.
- [x] Audit active root instructions, agent contracts, Mission Control runtime scripts, and configuration examples for executable stale paths, retired services, old profiles, and conflicting authority rules; replace or explicitly supersede every confirmed hit.
- [x] Reconcile `ops/skills/skills-hub-reference.md` with the installed skills and add the user-specified skills to its authoritative catalog.
- [x] Provide Hermes a documented, verified skill-authoring workflow so it can create or update repository skill/configuration artifacts without a recurring permission-warning loop.

## Reusable Safety Workflow and Presentation

- [x] Create and validate a reusable repository skill for branch delivery, active-instruction drift audits, runtime-gate verification, and sanitized evidence reporting.
- [x] Verify the S1 runtime gate remains blocked and that the Hermes, OpenClaw, and OpenCode repository journals are independent and readable in the canonical workspace.
- [x] Inspect the installed i-have-adhd and Hermes authoring skill configuration and run their token-discipline and authoring-boundary tests.
- [x] Reframe the installed i-have-adhd skill as neutral token-saving output discipline, with no user diagnosis or persistent diagnostic mode.
- [x] Prepare and generate an editable presentation summarizing the complete `manus/call-layer` delivery and Hermes authoring boundaries.

## Skills Doctrine Reconciliation

- [x] Extract the attached skills-doctrine task categories and identify the non-negotiable expectations for planning, testing, browser work, UI work, marketing, and mobile work.
- [x] Compare the extracted skills doctrine with active Hermes, OpenClaw, and OpenCode preflight contracts; separate valid task-aware requirements from conflicts with branch, authority, secrecy, and runtime boundaries.
- [x] Draft a task-aware skills preflight matrix that loads all relevant skills for a task category without indiscriminately loading unrelated skills.
- [ ] Obtain approval before changing shared harness contracts or installing additional third-party skills from the doctrine.

## Human-Facing Mission Control Tools

- [x] Inspect current Supabase and Obsidian integration readiness, data boundaries, and existing Mission Control surfaces without enabling runtime execution.
- [x] Design Supabase as a human-facing Mission Control tool for operational records, task views, and controlled data access rather than hidden agent-only memory.
- [x] Design Obsidian as an optional human-facing knowledge and journal viewer/editor with repository ownership and safe mirror semantics.
- [ ] Obtain approval before adding new integration credentials, modifying schemas, enabling runtime services, or changing the S1 gate.
- [x] Map the current Mission Control service roles—frontend, backend, mission-mcp, and onemin-shim—and decide whether OmniRoute, Supabase, Obsidian, or Hermes require a distinct service, a mounted tool panel, or an external connector.
- [x] Prevent duplicate MCP, gateway, and storage services by documenting a single owning component and health signal for each integration.
- [x] Replace residual Pieces UI and polling in the Mission Control Brain panel with human-facing repository, Graphy, journals, Supabase-readiness, and Obsidian-readiness surfaces.
- [x] Add a read-only Mission Control integration-status contract that reports configured, unavailable, and not-configured states without exposing credentials.
- [x] Add focused verification for the human-facing integration-status contract and the removal of residual Pieces client wiring.
- [x] Inventory the August 16 vault manifest and handoff artifacts without opening certificates, environment files, passwords, tokens, or credential-bearing backups.
- [x] Classify each non-secret vault artifact as safe historical context, current integration evidence, or excluded sensitive material before using it in Mission Control planning.
- [x] Inventory archive, duplicate-service, and retired-source candidates against the active Mission Control topology without modifying any item during discovery.
- [x] Remove only artifacts verified as duplicated or retired, retaining a sanitized removal record and preserving all uncertain, active, or security-sensitive material.
- [x] Verify the remaining source tree, focused tests, and branch status after cleanup; preserve the unrelated pre-existing script modification as excluded work.
- [x] Replace static governance bridge labels with verified bridge availability state and surface identity-aware service faults in the governance workflow.
- [x] Remove retired allocation-language placeholder text from the governance proposal form and replace it with neutral business-change guidance.
- [x] Prepare a bounded GitHub Copilot repository-agent brief that requires skills-first preflight, branch-only work, no runtime execution, no secrets, and evidence-backed tests.
- [x] Run a read-only Copilot drift audit for stale drive paths, retired skill and agent references, legacy Python scripts, batch files, launch scripts, and obsolete automation configuration.
- [x] Classify Copilot audit findings as active, historical, generated, security-sensitive, or uncertain before approving any deletion or rewrite.
- [x] Preserve Copilot's sanitized drift-audit state file as GitHub-side repository memory on a dedicated non-main audit branch, then reconcile it with manus/call-layer.
- [x] Reconcile Copilot's published main-branch audit findings against the controlled manus/call-layer branch and record active, historical, remediated, sensitive, and uncertain classifications.
- [x] Inventory the post-cleanup assets area, retain non-secret domain topology metadata, and identify any remaining unreferenced marketing payloads without opening sensitive files.
- [x] Complete final static verification for Mission Control and ClawX without enabling runtime execution, then prepare a user-inspectable testing handoff.
- [x] Replace the confirmed legacy root autostart scheduler registration script with a fail-closed S1 runtime-gate block and remove its stale E-drive execution guidance.
- [x] Replace the confirmed dead Hermes watchdog path filters with current repository-owned Hermes contract and configuration paths, preserving its flag-only behavior.
- [x] Publish a concise read-only Supabase and Obsidian readiness report for human-facing Mission Control use, including connection blockers and no-change boundaries.
- [x] Publish a task-aware skills preflight matrix that compares the attached doctrine with active Hermes, OpenClaw, and OpenCode contracts.
- [x] Create an editable presentation covering Mission Control human tools, Supabase/Obsidian readiness, task-aware skill selection, built-in secret redaction, and safe human-visible agentic operations.
- [x] Refresh the portable branch bundle and patch after the final safety commit, then prepare a user-testing handoff with runtime still blocked.
- [x] Verify the final portable bundle and patch hashes, compare manus/call-layer with current origin/main including onemin-shim, and record any clean rebase or merge result before Fable lands the delivery.
- [x] Run an isolated rebase-probe of manus/call-layer onto origin/main, resolve only controlled conflicts, and preserve the unrelated script modification outside the probe.

## Public-Readiness Sweep

- [x] Establish a branch-only public-readiness baseline, document the missing prior controlled worktree, and preserve the two unrelated script modifications outside this work.
- [x] Replace unverified README availability and payment-provider claims with product-only, provider-neutral wording; preserve the required meme, Team credits, Contributing section, and AI-commit statement.
- [x] Remove audited prohibited taglines, financial-allocation UI, payment-provider assertions, exposed local configuration paths, development authentication bypasses, and remote-command controls from public frontend source.
- [x] Record a non-sensitive internal-posture inventory and keep/redact/move recommendations without opening environment files or credential-bearing records.
- [ ] Obtain owner confirmation of credential rotation before the judge lane executes any history purge plan for the tracked root configuration file.
- [ ] Diagnose Cloudflare custom-domain ownership/attachment through a working read-only access path; obtain a separate confirmation before any DNS, Pages, Worker, or domain change.
- [ ] Rebuild the remediated frontend in a trusted dependency environment; this sandbox clone lacks installed dependencies and no lockfile-backed install was used.
