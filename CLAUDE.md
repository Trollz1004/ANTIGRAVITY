# CLAUDE.md — Current Agent Guide — ACTIVE (S1 landed 2026-08-19)

> **Status:** S1 supersession LANDED by the judge lane 2026-08-19. Joshua remains the sole authority. Runtime service launch is a separate, deliberate, Joshua-authorized action; the Paperclip runtime was so authorized on 2026-08-23.

## Current Reality

`C:\ANTIGRAVITY` is the sole canonical working tree. Historical path claims, backup clones, exported folders, and old node topology are non-executable evidence, not instructions.

`.agents/skills` holds **96 loadable top-level skills** as of 2026-08-26 — 104 directories, 8 of which are Paperclip-materialized `<name>--<hash>` clones of a skill already present and are not separate skills. Count it rather than trusting this number, which goes stale the moment anyone installs one:

```bash
tot=$(ls -d .agents/skills/*/ | wc -l); dup=$(ls -d .agents/skills/*--[0-9a-f]*/ 2>/dev/null | wc -l); echo $((tot-dup))
```

The nested duplicate and stripped copies are not a second source of authority. Load the task-relevant skill before acting, and report when a required skill or runtime is unavailable.

**A stale count here is not cosmetic.** `.agents/skills/README.md` advertised "144+ agency-* skills" long after the directory held none, which cost a session's work and produced a confident, wrong "there are no Unreal skills" — while 184 of them, four Unreal among them, sat in the laptop vault at `OneDrive\Personal Vault-Laptop\ANTIGRAVITY\.agents\skills\`. Eleven game-development skills were folded into this tree on 2026-08-26; the rest stay in the vault deliberately. When an inventory and a directory disagree, believe the directory.

Every harness reads its own `.agents/journals/<harness>/STATE.md` at session start and writes a compact state entry at session end. Repository knowledge and the Graphy views are the active context surfaces; Obsidian may mirror the repository journals when Joshua configures a vault. No retired external-memory dependency is active.

**The Claude judge lane loads `judge-house` at session start, before planning or touching code.** It reads what previous sessions landed and left blocked, and it writes the record another judge — or the next Claude session, which will remember none of this — needs to act on the work. It also carries the judge-routing rule: Claude is reserved for DREAM Online and the final merge gate, while routine marketing and Date App verdicts go to Codex and Grok.

Skills are loaded before planning or assigning subagents. `i-have-adhd` is a token-saving, concise-output skill—not a diagnosis. Use Superpowers brainstorming for behavior or feature design, Agent-Reach for external research, browser-use with approved cookie sync for authenticated browser work, find-skills before hand-rolling, TDD for code changes, and systematic debugging for a failure or unexpected result.

Ollama is installed. It is a fail-safe path only; do not assume a usable local model is present without checking its live catalog. The OmniRoute gateway is installed as a global npm service and is the normal authenticated OpenAI-compatible route for harness work. Use `OPENAI_COMPAT_BASE_URL` and its runtime authorization configuration; do not hardcode credentials or endpoint secrets.

Paperclip is an active runtime on the Sabretooth node: `paperclipai@2026.824.0` at `http://127.0.0.1:3100`, company `ANTIGRAVITY Marketing Co` (`ANT`). Joshua designated it Mission Control on 2026-08-25. That supersedes two earlier rulings, both kept here as history: the S1 statement of 2026-08-19 that no Paperclip runtime was active, and the 2026-08-23 revival scope that limited it to marketing and business operations with no repository authority or task governance. Paperclip now holds task governance and runs the judge lanes. It does not hold Git delivery — Rule 5 is unchanged, and only official first-party judges push, merge, or delete. Runtime, connector, and judge-lane state is evidenced in `agent-contracts/PAPERCLIP-MCP-CONNECTOR-EVIDENCE.md`.

Harness lanes are assigned under Paperclip: Hermes to YouTube automation, OpenClaw to marketing, OpenCode to eBay and recycling automation. X.com work is Grok-only through the grok.com path, not the X Developer API.

There is no working-hours restriction on any lane. A `403 Access denied outside allowed hours` from OmniRoute is a per-API-key schedule, not governance — Joshua never set that rule.

**One was found live and cleared on 2026-08-26.** The API key named `FABLE` carried `{"enabled":true,"from":"08:00","until":"18:00","days":[0,1,2,3,4,5,6],"tz":"America/New_York"}`. It was gating OpenCode as recently as 23:30 that night. Cleared to `NULL`; OpenCode then completed a heartbeat at 23:46 with no error, which is the proof the gate is gone.

**Where to look, exactly** — an earlier sweep declared "no schedule exists" and was wrong twice over, so use these coordinates rather than a keyword search:

- Database: `~/.omniroute/data/storage.sqlite` — note the `data/` subdirectory. A stale `~/.omniroute/storage.sqlite` also exists and is **not** the live one.
- Table `api_keys`, column **`access_schedule`** — snake_case. Searching the file for the string `accessSchedule` finds nothing, because the column name never appears inside its own JSON value. That false negative is what produced the wrong all-clear.

Clear it by setting the column to `NULL` (back the database up first). Do not write the restriction back into doctrine, and do not report a schedule as absent unless that exact column has been read.

## Operating Rules

1. Work only under `C:\ANTIGRAVITY`.
2. Use the designated harness contract: `agent-contracts/HERMES-AGENT.md`, `OPENCLAW-AGENT.md`, or `OPENCODE-AGENT.md`.
3. Normal model access is authenticated OmniRoute; Ollama is explicit fail-safe only.
4. Official-platform governance ballots never route through OmniRoute.
5. The judge lane alone pushes, merges, or deletes branches unless Joshua directly authorizes an exception.
6. Do not expose secrets, populated environment files, token aliases, or private URLs.
7. Verify service identity rather than trusting a port or an HTTP status in isolation.

## Mission Control

Mission Control is Paperclip on the Sabretooth node at `http://127.0.0.1:3100`. A service state is meaningful only when the expected identity has been checked. Report **UP**, **DOWN**, **WRONG SERVICE**, **AUTH MISSING**, **AUTH REJECTED**, or **NOT CONFIGURED** rather than an unqualified green/red claim.

## Public Product Boundary

Public product surfaces remain business-only. Keep internal governance, owner decisions, and non-product framing out of customer copy. Square remains the checkout integration unless Joshua directs otherwise.

## Reporting

Use **VERIFIED**, **UNVERIFIED**, or **BLOCKED**. Include the changed files, test/build evidence, sanitized audit evidence when applicable, and the next bounded action. Never treat an exit code or a 200 response as proof that the intended system is present.
