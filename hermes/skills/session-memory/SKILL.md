---
name: session-memory
description: "Session start/end memory management with Obsidian integration."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [session, memory, obsidian, persistence, preload]
    related_skills: [obsidian, weekly-review-planning]
---

# Session Memory Skill

## When to Use

- Every session start — preload context from memory.md
- Every session end — persist useful data to memory.md
- When the user explicitly asks to save or recall session context

## How to Run

### Session Start (Auto-trigger)

1. Read `~/.hermes/skills/productivity/session-memory/memory.md`
2. Parse the YAML frontmatter for session metadata
3. Load the latest session context block
4. Inject into working memory silently (don't narrate unless asked)
5. Check for stale entries older than 7 days and note them

### Session End (Auto-trigger)

1. Re-read current `memory.md`
2. Append a new session block with:
   - Session date (ISO 8601)
   - Key decisions made
   - Files modified
   - Lessons learned
   - TODOs carried forward
   - Model/provider changes
3. Update the metadata block at the top
4. If significant data changed, write an Obsidian note

### Obsidian Integration

If `~/.obsidian-notes/` exists, write a daily note when:
- Model/provider config changes
- New skills installed
- Non-trivial code changes completed
- User corrections or preferences stated

Note path: `~/.obsidian-notes/sessions/YYYY-MM-DD.md`

Format:
```markdown
# Session: YYYY-MM-DD

## Decisions
- ...

## Changes
- ...

## Lessons
- ...

## Carry-forward TODOs
- [ ] ...
```

## Memory File Structure

```markdown
---
last_session: 2026-09-07
total_sessions: 42
model: gemini-4-carbon
provider: omniroute
omniroute: http://192.168.0.15:20128/v1
node: 
tablet: true
primary_node: Alienware
---

# Session Memory Log

## 2026-09-07
- Configured active fleet routing (`Opus 5.5` / `Fable`, `Gemini 4 Carbon`, `GPT-6 Astra`, `GPT-6.1 Sol`)
- Connected T5500 OmniRoute (`192.168.0.15:20128/v1`) for sub-agents
- Installed caveman skills from skills.sh
- Created session-memory skill
- Cleaned up applet dashboard HTML
```

## Pitfalls

- Don't write secrets to memory.md
- Don't duplicate what's already in Hermes memory tool
- Keep session blocks concise (max 50 lines each)
- Prune entries older than 30 days
- Never overwrite — always append then prune

## Verification

After session start:
- [ ] memory.md loaded and parsed
- [ ] Context injected silently
- [ ] Stale entries noted

After session end:
- [ ] New session block appended
- [ ] Metadata updated
- [ ] Obsidian note written if needed
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
