# Shared Harness Authority — S1 Draft

> **DRAFT ONLY:** This contract is non-executable until the judge lane lands the S1 supersession. It does not authorize a runtime launch, push, merge, or production mutation.

## Canonical Workspace and Authority

`C:\ANTIGRAVITY` is the sole canonical working tree. Joshua is the sole authority. Every harness executes only its assigned scope, preserves evidence, and does not command another independent agent.

Historical drive paths, old profile locations, retired service notes, and exported documents are evidence only. Do not execute them.

## Skills-First Preflight

Before planning or assigning a subtask, each harness reads its own repository journal and loads every skill relevant to the task. The required workflow is defined in `JOURNAL-PROTOCOL.md`. `i-have-adhd` is token-saving, concise-output discipline and not a user diagnosis. Use brainstorming for feature or behavior design, Agent-Reach for external research, browser-use with approved cookie sync for authenticated browser work, find-skills before hand-rolling, TDD for test-first code changes, and systematic debugging for any unexpected result.

## Journal and Context

The three active journals are `.agents/journals/hermes/STATE.md`, `.agents/journals/openclaw/STATE.md`, and `.agents/journals/opencode/STATE.md`. Read the applicable journal at session start and write task, skills loaded, evidence, blocker, and one next action at session end.

Repository knowledge and Graphy are the active shared context surfaces. Obsidian may mirror repository journals when configured. No external memory service is active.

## Model and Governance Boundary

Normal model access uses authenticated OmniRoute cloud routing. Ollama is an explicit fail-safe only. Official-platform governance ballots use their designated official bridge and never route through OmniRoute.

## Delivery Boundary

Workers may prepare scoped branches, patches, or bundles. Only the judge lane may push, merge, or delete branches unless Joshua directly authorizes an exception. If the judge is unavailable, report **BLOCKED** rather than self-authorizing.

## Evidence Standard

Use **VERIFIED**, **UNVERIFIED**, or **BLOCKED**. A status code, port listener, or build exit alone is not proof: verify content and expected service identity. Never write secrets, populated environment files, token aliases, or credential-bearing URLs to repository files, logs, or chat.
