# CLAUDE.md — Current Agent Guide — S1 DRAFT ONLY

> **Runtime gate:** This is a draft-only supersession. The judge lane must land it before any runtime launch step. Joshua remains the sole authority.

## Current Reality

`C:\ANTIGRAVITY` is the sole canonical working tree. Historical path claims, backup clones, exported folders, and old node topology are non-executable evidence, not instructions.

There are **45 loadable top-level skills** in `.agents/skills`. The nested duplicate and stripped copies are not a second source of authority. Load the task-relevant skill before acting and report when a required skill or runtime is unavailable.

Every harness reads its own `.agents/journals/<harness>/STATE.md` at session start and writes a compact state entry at session end. Repository knowledge and the Graphy views are the active context surfaces; Obsidian may mirror the repository journals when Joshua configures a vault. No retired external-memory dependency is active.

Skills are loaded before planning or assigning subagents. `i-have-adhd` is a token-saving, concise-output skill—not a diagnosis. Use Superpowers brainstorming for behavior or feature design, Agent-Reach for external research, browser-use with approved cookie sync for authenticated browser work, find-skills before hand-rolling, TDD for code changes, and systematic debugging for a failure or unexpected result.

Ollama is installed. It is a fail-safe path only; do not assume a usable local model is present without checking its live catalog. The OmniRoute gateway is installed as a global npm service and is the normal authenticated OpenAI-compatible route for harness work. Use `OPENAI_COMPAT_BASE_URL` and its runtime authorization configuration; do not hardcode credentials or endpoint secrets.

There is no active Paperclip runtime. If it is intentionally revived, it is limited to marketing and business operations and does not own repository authority, task governance, or Git delivery.

## Operating Rules

1. Work only under `C:\ANTIGRAVITY`.
2. Use the designated harness contract: `agent-contracts/HERMES-AGENT.md`, `OPENCLAW-AGENT.md`, or `OPENCODE-AGENT.md`.
3. Normal model access is authenticated OmniRoute; Ollama is explicit fail-safe only.
4. Official-platform governance ballots never route through OmniRoute.
5. The judge lane alone pushes, merges, or deletes branches unless Joshua directly authorizes an exception.
6. Do not expose secrets, populated environment files, token aliases, or private URLs.
7. Verify service identity rather than trusting a port or an HTTP status in isolation.

## Mission Control

Mission Control is the intended dashboard. A service state is meaningful only when the expected identity has been checked. Report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED** rather than an unqualified green/red claim.

## Public Product Boundary

Public product surfaces remain business-only. Keep internal governance, owner decisions, and non-product framing out of customer copy. Square remains the checkout integration unless Joshua directs otherwise.

## Reporting

Use **VERIFIED**, **UNVERIFIED**, or **BLOCKED**. Include the changed files, test/build evidence, sanitized audit evidence when applicable, and the next bounded action. Never treat an exit code or a 200 response as proof that the intended system is present.
