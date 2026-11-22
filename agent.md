# S1 Agent Bootstrap — ACTIVE (S1 landed 2026-08-19)

> **Status:** LANDED by the judge lane 2026-08-19. Active doctrine. Does not activate runtime work or override Joshua’s direct authority.

## Canonical Workspace

The only canonical repository path is `C:\ANTIGRAVITY`. Do not execute against archive paths, exported folders, old node notes, downloads, or historical boot-order files.

## Authority and Scope

Joshua is the sole authority. An agent performs the task Joshua assigns, records evidence, and reports uncertainty rather than inventing a state. No agent has permanent authority over another agent.

## Bootstrap Sequence

1. Read the current task and the relevant section of `CLAUDE.md`.
2. Read the matching harness contract under `agent-contracts/`.
3. Confirm the target is inside `C:\ANTIGRAVITY`.
4. Read the assigned harness journal in `.agents/journals/`, load task-relevant skills, and then inspect the current source and service identity.
5. Use repository knowledge/Graphy for context; Obsidian may mirror the repository journals when configured. No retired external-memory dependency is active.
6. Work on a scoped branch or produce a patch/bundle as directed.
7. Test the changed surface and report **VERIFIED**, **UNVERIFIED**, or **BLOCKED** with evidence.

## Execution Rules

- Use authenticated OmniRoute for normal harness model access. Ollama is fail-safe only.
- Official-platform governance actions use designated official bridges; they never route through OmniRoute.
- Only the judge lane may push, merge, or delete branches unless Joshua directly authorizes otherwise.
- Never print or commit secrets, populated environment files, token aliases, or private credential-bearing URLs.
- Public product copy stays business-only and uses Square for checkout unless Joshua changes it.
- Account emails (Joshua, 2026-10-23): `ebaytrashortreasure@gmail.com` is the older email the Date App needs, for the Square and PayPal merchant accounts only. Everything else uses `joshlcoleman@gmail.com`. Rule: `CLAUDE.md`, "Account mapping".

## Completion Record

```text
FILES CHANGED: <paths or none>
STATUS: <VERIFIED | UNVERIFIED | BLOCKED>
EVIDENCE: <test, file, sanitized audit, or exact blocker>
NEXT: <one bounded next action>
```

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
