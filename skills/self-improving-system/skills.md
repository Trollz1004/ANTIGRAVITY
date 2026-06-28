# Self-Improving Agent Skills Reference

**Last updated:** 2026-06-28  
**Purpose:** Reduce context window by pointing to file locations instead of embedding large text.

## Skills Index (Read This First)

### Core Skills (Available at `.agents/skills/`)

| Skill Key | Category | Quick Use Case |
|-----------|----------|----------------|
| paperclip | Core | Paperclip/API coordination |
| paperclip-create-agent | Core | Hire new agents |
| paperclip-create-plugin | Core | Build plugins |
| para-memory-files | Core | PARA memory system |
| hermes-evolution | Meta | Self-improvement evaluation |
| mission-control | Core | Kanban/task tracking |
| payments | Core | Square/Square API/payment links |
| revenue-model | Core | Business revenue guidance |
| sleek-design-mobile-apps | UX | Mobile app design |
| social-growth-engineer | Marketing | Social media growth |
| supabase | Data | Database, auth, Supabase ops |
| supabase-postgres-best-practices | Data | Postgres optimization |
| ui-ux-pro-max | UX | Advanced UI/UX |

### Secondary Skills (Available at `skills/`)

| Skill Key | Category | Quick Use Case |
|-----------|----------|----------------|
| antigravity-doctrine | Doctrine | Core operating rules |
| antigravity-mission-orchestrator | Management | Task orchestration |

### Pi Agent Skills (via skill system)

| Skill Key | Category | Quick Use Case |
|-----------|----------|----------------|
| agent-browser | Tech | Browser automation/testing |
| copywriting | Marketing | Landing pages, CTAs, social copy |
| executing-plans | Management | Execute implementation plans |
| find-skills | Management | Discover/install agent skills |
| frontend-design | UX | UI components, design systems |
| high-end-visual-design | UX | Premium design guidelines |
| hyperframes | Creative | Video/motion graphics |
| improve-codebase-architecture | Engineering | Codebase refactoring |
| opensource-guide-coach | Engineering | Open source guidance |
| prototype | Engineering | Rapid prototypes |
| redesign-existing-projects | UX | UI/UX upgrades |
| subagent-driven-development | Management | Multi-agent execution |
| to-prd | Product | Product requirements |
| triage | Management | Task prioritization |
| verification-before-completion | QA | Quality checks |
| web-design-guidelines | UX | Web standards |

## Self-Improvement Protocol

On each heartbeat exit, agents should append to `/mnt/c/antigravity/skills/self-improving-system/session-notes.md`:

```md
## YYYY-MM-DD Session End - [Agent Name]

- Skills used: [list]
- Effectiveness notes: [what worked]
- Suggestions for next session: [improvements]
- Timestamp: [ISO time]
```

## File Locations

- Skills index: `/mnt/c/antigravity/skills/self-improving-system/skills.md`
- Session notes: `/mnt/c/antigravity/skills/self-improving-system/session-notes.md`
- Core skills: `.agents/skills/<skill-name>/SKILL.md`
- Secondary skills: `skills/<skill-name>/SKILL.md`
- Pi agent skills: See skill system (`agent-browser skills get <name>` or symlinks in `/home/josh/.pi/agent/skills/`)
