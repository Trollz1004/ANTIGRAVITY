---
last_session: 2026-09-11
total_sessions: 3
model: stepfun/step-3.7-flash
provider: nous
omniroute: http://192.168.0.8:20128/v1
node: sabertooth
tablet: true
primary_node: sabertooth
applets: 14
custom_skills: 12
caveman_skills: 7
---

# Session Memory Log

## 2026-09-07

### Decisions
- Set Nous free models as primary provider (stepfun/step-3.7-flash)
- Connected Sabertooth Omniroute for sub-agents/auxiliary
- Removed ollama-launch provider (already in Omniroute endpoint)
- Created session-memory skill with Obsidian integration
- Created 12 custom topic-based skills from skills.sh categories
- Installed caveman skills from skills.sh (caveman, caveman-commit, caveman-review, caveman-compress, caveman-stats, caveman-help, cavecrew)
- Installed interface-kit, grill-me, context-canary from JuliusBrussee/skills
- Created brainstorm skill (structured ideation)
- Created youtube-automation skill
- Updated dashboard HTML with skills + applets

### Custom Skills Created
- `brainstorm` — Structured brainstorming with scoring
- `frontend-react` — React 19 patterns, hooks, performance
- `nextjs` — App Router, RSC, caching, middleware
- `design-ui` — Design systems, shadcn, accessibility
- `mobile` — React Native, Expo, iOS/Android
- `agent-workflow` — Multi-agent orchestration, delegation
- `database` — PostgreSQL, Supabase, RLS, migrations
- `testing` — TDD, Playwright, unit/integration/e2e
- `marketing` — SEO, copywriting, CRO, growth
- `youtube-automation` — Upload, SEO, thumbnails, analytics
- `session-memory` — Session start/end with Obsidian

### Caveman Skills Installed
- caveman, caveman-commit, caveman-review, caveman-compress, caveman-stats, caveman-help, cavecrew

### Changes
- `model.provider` → `nous`
- `model.default` → `stepfun/step-3.7-flash`
- `model.base_url` → cleared (Nous Portal)
- `delegation.base_url` → `http://192.168.0.8:20128/v1`
- `auxiliary.*.base_url` → `http://192.168.0.8:20128/v1`
- Removed `providers.ollama-launch` section

### Carry-forward TODOs
- [ ] Add more skills.sh topic skills as needed
- [ ] Update Obsidian vault path when configured
- [ ] Monitor Nous free model availability

## 2026-09-11 (Claude Code, Alienware node 192.168.0.40)

### Decisions
- Added `CLAUDE.md` (repo guide and session protocol) and a global `~/.claude/CLAUDE.md`.
- Every session: read memory at start, then activate caveman, brainstorm and test-driven-development. Write memory at end.
- Claude and Codex are the only judge lanes with push and merge permission. Claude pushes and merges its own work.
- 90% pass rule: merge only when at least 90% of the affected tests pass.
- This machine is the Alienware node (192.168.0.40), host of the Dream Online MMO and the dashboard. OmniRoute (:20128/v1) is on Sabertooth (192.168.0.8), not here.

### Changes
- `CLAUDE.md` (new), `skills/session-memory/memory.md` (this block)
- Outside the repo: `~/.claude/CLAUDE.md`, and Claude project memory (session-protocol, git-authority, pass-rule-90, node-alienware)

### Lessons
- The jarvis test suite on master passes 32/35. `tests/crosslisting.test.js` hardcodes a stale temp `pkgRoot`. Set `CROSSLISTING_ROOT` and the suite passes 35/35.
- `gh`, `pnpm` and `python` are not installed on this node.

### Carry-forward TODOs
- [ ] Change the `pkgRoot` default in `dashboard/jarvis/tests/crosslisting.test.js` to a repo-relative path
- [ ] Install pnpm (`corepack enable`) and get a crosslisting test baseline
- [ ] Change the `NODE_LAN_IP` default for this node (192.168.0.40) or document the env var in a launcher
