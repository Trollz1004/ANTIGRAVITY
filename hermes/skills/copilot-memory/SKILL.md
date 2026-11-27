---
name: copilot-memory
description: "Copilot-only session memory: read on start, write on end."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [copilot, session, memory, persistence, preload]
    related_skills: [session-memory, caveman]
---

# Copilot Memory Skill

> This skill and its `memory.md` log belong to the GitHub Copilot CLI.
> Other agents must read-only at most and never edit. The user enforces this.

## When to Use

- Every Copilot CLI session start — read `skills/copilot-memory/memory.md` first, silently
- Every Copilot CLI session end — append a session block, update frontmatter
- When the user asks Copilot to recall what it did in past sessions

## Procedure

### Session Start

1. Read `skills/copilot-memory/memory.md` (this repo, Copilot's own log)
2. Parse the YAML frontmatter (`last_session`, `total_sessions`, machine facts)
3. Load the latest session block silently; do not narrate unless asked
4. Mark entries older than 7 days as stale; re-verify facts before trusting them
5. The Claude/Hermes log `skills/session-memory/memory.md` stays the judge-lane log: read-only reference for Copilot, not its write target

### Session End

1. Re-read `memory.md`
2. Append a new session block at the end with: session date (ISO 8601), key decisions, files changed, lessons learned, carry-forward TODOs
3. Update frontmatter: `last_session`, bump `total_sessions`
4. Append, then prune: keep the log under ~120 lines by trimming the oldest block's detail (keep its headline decisions). Never overwrite history.

## Pitfalls

- Never write secrets, tokens, `.env` contents, or absolute user paths into the log (repo privacy rule, commit `b758d49`)
- Do not duplicate the judge-lane log; if a fact already lives in `skills/session-memory/memory.md`, reference it instead of copying
- Windows paths in this repo use backslashes; keep log entries copy-pasteable
- One block per session; if a session spans multiple turns, consolidate into one block at the end

## Verification

- Frontmatter `total_sessions` equals the number of `## <date>` session blocks
- Newest block sits at the bottom of the file (append-only order)
- No secret-shaped strings in the log (`grep -iE "key|token|secret"` returns only rule text)
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
