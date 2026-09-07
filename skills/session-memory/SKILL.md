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
model: stepfun/step-3.7-flash
provider: nous
omniroute: http://192.168.0.8:20128/v1
node: sabertooth
tablet: true
primary_node: sabertooth
---

# Session Memory Log

## 2026-09-07
- Set Nous free models as primary
- Connected Sabertooth Omniroute for sub-agents
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
