---
tags:
  - agent-workflow
  - skills
  - antigravity
  - hermes
  - orchestration
aliases:
  - Agent Skills Matrix
  - Skills Dashboard
  - Agent Workflow Graph
date: 2026-09-07
updated: 2026-09-07
author: Joshua (Trollz1004)
version: 2.0.0
---

# Agent Workflow Graph — Hermes Tablet

> Agent Workflow Graph - Shows agents what skills to load, tools available, and daily research targets

## Universal Skills

### Mandatory (Every Session)

These load on EVERY session start via [[AGENTS.md]] preload:

- [[caveman]] — Ultra-compressed communication (65% token reduction)
- [[brainstorm]] — Structured ideation with scoring
- [[session-memory]] — Session start/end persistence with Obsidian integration
- [[verification-before-completion]] — Verify before marking done
- [[find-skills]] — Discover new skills from hub
- [[create-skills]] — Author new skills from workflows
- [[self-improving-agent]] — Learn from every interaction
- [[self-improving-system]] — Multi-memory architecture

### Core Skills

- [[systematic-debugging]] — 4-phase root cause debugging
- [[test-driven-development]] — RED-GREEN-REFACTOR
- [[frontend-react]] — React 19 patterns
- [[nextjs]] — App Router, RSC, caching
- [[database]] — PostgreSQL, Supabase, RLS
- [[agent-workflow]] — Multi-agent orchestration

### Daily Research

> Each agent must research and load ONE new skill per day based on their role.

---

## Memory Layer

### Rule

> Every bot writes what it learns. A bot that only consumes memory is a bot whose work dies with its session.

### Authoritative (Git)

- **Where**: Obsidian vault in-repo (plain markdown, committed)
- **Why**: Markdown in git is diffable and `git log -S` can trace a false claim to the commit that invented it. A vector store cannot be bisected.

### Recall (Fast)

- **Where**: Hermes session memory + [[session-memory]] skill
- **Why**: Fast cross-session recall. NEVER authoritative — when it disagrees with git, git wins.

### Vaults

- `C:\ANTIGRAVITY\Antigravity` (Obsidian Sync, shared by ANT/AIS/YOU companies, root note `00 HOME.md`)
- `D:\DREAM ONLINE` (game only, root note `00 HOME.md`)

---

## Agent Profiles

### Hermes (Orchestrator)

- **Role**: Default orchestrator, non-judge agent
- **Model**: stepfun/step-3.7-flash (Nous Portal free)
- **Sub-agents**: Sabertooth Omniroute (3145 models)
- **Skills**: All universal + [[systematic-debugging]], [[agent-workflow]], [[youtube-automation]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: orchestration patterns, context optimization, delegation

### CEO (Chief of Staff)

- **Role**: Governance, delegation, verification
- **Heartbeat**: `.agents/journals/freebuff-ceo/STATE.md`
- **Skills**: [[brainstorm]], [[agent-workflow]], [[planning-with-files]], [[dispatching-parallel-agents]], [[executing-plans]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: governance, delegation, verification patterns

### Judge (Judge Lane)

- **Role**: Code review, testing, release management
- **Heartbeat**: `.agents/journals/paperclip-judge/STATE.md`
- **Skills**: [[requesting-code-review]], [[test-driven-development]], [[using-git-worktrees]], [[finishing-a-development-branch]]
- **Tools**: ALL (push/merge authority)
- **Daily Research**: code review, testing, release management

### Coder (Engineer)

- **Role**: Engineering and coding
- **Skills**: [[claude-code]], [[test-driven-development]], [[requesting-code-review]], [[github-pr-workflow]], [[architecture-diagram]], [[frontend-react]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: React patterns, testing, architecture

### Growth (Marketing)

- **Role**: Growth and marketing analytics
- **Skills**: [[marketing]], [[youtube-automation]], [[social-growth-engineer]], [[revenue-model]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: SEO, A/B testing, conversion optimization

### YouTube (Content Creator)

- **Role**: YouTube content creation
- **Skills**: [[youtube-automation]], [[design-md]], [[comfyui]], [[manim-video]], [[humanizer]], [[motion-design]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: content trends, thumbnail design, algorithm updates

### Support (Customer Support)

- **Role**: Customer support and ops
- **Skills**: [[humanizer]], [[systematic-debugging]], [[requesting-code-review]], [[dateapp-support-desk]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: support patterns, troubleshooting, UX

### Buzz (Messenger)

- **Role**: Internal messaging, reporting, Slack-like communication
- **Model**: claude-haiku-4-5-20251001
- **Skills**: [[himalaya]], [[email-inbox-triage]], [[caveman]], [[brainstorm]]
- **Tools**: Messaging platforms
- **Daily Research**: communication patterns, email automation

### OpenClaw (Marketing)

- **Role**: Marketing analytics and growth
- **Heartbeat**: `.agents/journals/openclaw/STATE.md`
- **Skills**: [[growth-marketer]], [[social-growth-engineer]], [[devrel-content]], [[revenue-model]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: marketing analytics, A/B testing, conversion

### OpenCode (eBay & Recycling)

- **Role**: eBay and recycling automation
- **Heartbeat**: `.agents/journals/opencode/STATE.md`
- **Skills**: [[tdd]], [[test-driven-development]], [[improve-codebase-architecture]], [[maintainer-clarity]]
- **Tools**: ALL (unlimited access)
- **Daily Research**: eBay API, recycling automation, testing patterns

---

## Daily Routine

### 5 Daily Improvements (Mission 2026-08-26)

**Execution**: Daily after first message, before task work: run items 1-5, append evidence to vault notes, then proceed with role tasks.

| # | Task | Owner | Skills | Time |
|---|------|-------|--------|------|
| 1 | SEO keyword-gap + on-page audit | memory/system | [[agent-reach]], [[growth-marketer]] | 10m |
| 2 | Hermes faceless short pipeline | hermes | [[youtube-automation]], [[social-growth-engineer]] | 15m |
| 3 | Animated avatar live-stream readiness | hermes/ops | [[system-connector]] | 10m |
| 4 | AARRR funnel metric + ICE experiment | openclaw | [[growth-marketer]], [[supabase]] | 10m |
| 5 | Daily skill research + context-bloat trim | all agents | [[self-improving-system]], [[find-skills]] | 10m |

### SEO Keyword Queue

- youandinotai human connection
- bot-free dating app
- ai companion no bots
- recycled electronics
- avatar youtube live

---

## MCP Connections

- [[omniroute]] — Multi-model routing (Sabertooth 192.168.0.8:20128)
- [[supabase]] — Database and auth
- [[playwright]] — Browser automation
- [[openviking]] — L0/L1/L2 hierarchical context
- [[mission-mcp]] — Mission control
- [[brain-mcp]] — Brain MCP
- [[antigravity-files]] — File management

---

## Tools Available

### Always Available

- [[find-skills]] — Discover new skills
- [[create-skills]] — Author new skills
- [[skills.sh]] — Skills directory
- [[clawhub]] — Community skills
- [[hermes-skill-hub]] — Official skill hub

### Per Role

Refer to agent skillsToLoad above.

---

## Context Optimization

### Heartbeat Format

> LOCATIONS ONLY - never content

### Example

```markdown
# .agents/journals/freebuff-ceo/STATE.md
- skills: .agents/skills/
- memory: .agents/memory/
- vault: C:\ANTIGRAVITY\Antigravity\
```

### OpenViking

- **Role**: L0/L1/L2 hierarchical context
- **Server**: http://127.0.0.1:1933
- **Recall**: `ov find '<topic>'` before loading large files
- **Commit**: `ov session commit` at end of meaningful work
- **Anti-hallucination**: verify against knowledge base instead of pattern-matching

---

## Skill Groups

### Mandatory

[[caveman]] · [[brainstorm]] · [[session-memory]] · [[verification-before-completion]] · [[find-skills]] · [[create-skills]] · [[self-improving-agent]] · [[self-improving-system]]

### Orchestration

[[agent-workflow]] · [[mission-control]] · [[orchestrator-preflight]] · [[systematic-debugging]] · [[dispatching-parallel-agents]] · [[executing-plans]]

### Code & Dev

[[claude-code]] · [[test-driven-development]] · [[requesting-code-review]] · [[github-pr-workflow]] · [[architecture-diagram]] · [[frontend-react]] · [[nextjs]]

### Content & Creative

[[design-md]] · [[comfyui]] · [[manim-video]] · [[humanizer]] · [[motion-design]] · [[youtube-automation]]

### Marketing & Growth

[[marketing]] · [[growth-marketer]] · [[social-growth-engineer]] · [[revenue-model]] · [[dateapp-growth-agent]]

### Systems & Ops

[[systematic-debugging]] · [[database]] · [[sabretooth-ops]] · [[system-connector]]

---

## Dashboard Integration

This file maps to the [[Hermes Ultimate Dashboard]]:

- **Overview Panel** — Bridge status for all agents
- **Buzz Panel** — Slack-like agent communication
- **Obsidian Panel** — Vault notes and search
- **Hermes Panel** — Session memory + active skills
- **Claude Code Panel** — Headless CLI bridge
- **Copilot Panel** — BYOK endpoint configuration
- **Browser Panel** — Chrome CDP control
- **Skills Panel** — All 12 custom + 7 caveman skills

---

## Related

- [[AGENTS.md]] — Session preload configuration
- [[session-memory]] — Memory management skill
- [[caveman]] — Token compression skill
- [[brainstorm]] — Ideation skill
- [[Trollz1004/hermes]] — GitHub repo
