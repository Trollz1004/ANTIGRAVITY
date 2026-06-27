# FUNA-9 Task Assignment — 5 Tasks Per Agent

**Issue Status:** DONE ✅  
**Created:** 2026-06-27  
**Scope:** Assign minimum 5 tasks to each agent in the registry

## Agent Task Assignments

### CEO (ceo) — Role: Orchestrator
| Task | Description | Priority |
|------|-------------|----------|
| CEO-1 | Monitor mission progress board at `[IP_ADDRESS]:8787` | p1 |
| CEO-2 | Coordinate cross-agent task dependencies and blockers | p0 |
| CEO-3 | Generate weekly status summary for all active tasks | p1 |
| CEO-4 | Review and approve completed task deliverables | p1 |
| CEO-5 | Update AGENTS.md with any doctrine changes | p2 |

### CFO (cfo) — Role: Treasury · Runway · Margins
| Task | Description | Priority |
|------|-------------|----------|
| CFO-1 | Track daily operating costs across all services | p1 |
| CFO-2 | Monitor Square payment processing health | p0 |
| CFO-3 | Generate weekly revenue/status report | p1 |
| CFO-4 | Audit payment links for business-only compliance | p1 |
| CFO-5 | Calculate runway burn rate projections | p2 |

### CMO (cmo) — Role: Content · Social · Campaigns
| Task | Description | Priority |
|------|-------------|----------|
| CMO-1 | Execute Q3 content calendar for YouAndINotAI | p0 |
| CMO-2 | Generate social media content aligned with brand messaging | p1 |
| CMO-3 | Monitor and report on content performance metrics | p1 |
| CMO-4 | Review landing page copy for conversion optimization | p1 |
| CMO-5 | Draft newsletter signup and welcome sequence | p2 |

### CTO (cto) — Role: Infra · Deploys · Audits
| Task | Description | Priority |
|------|-------------|----------|
| CTO-1 | Resolve API container restart issue (TRO-18) | p0 |
| CTO-2 | Implement CI/CD pipeline with quality gates | p0 |
| CTO-3 | Harden security infrastructure and compliance | p1 |
| CTO-4 | Deploy Mission Control to T5500 production | p1 |
| CTO-5 | Configure Paperclip loopback adapter health checks | p1 |

### INTERN-1 (intern-1) — Role: Social groundwork (Gemma 1B)
| Task | Description | Priority |
|------|-------------|----------|
| INTERN1-1 | Like and engage with relevant dating app posts on X | p2 |
| INTERN1-2 | Follow back verified accounts in the dating community | p2 |
| INTERN1-3 | Join Twitter/X conversations about dating safety | p2 |
| INTERN1-4 | Monitor trending hashtags for engagement opportunities | p2 |
| INTERN1-5 | Submit daily engagement summary for approval | p2 |

### INTERN-2 (intern-2) — Role: Social groundwork (Gemma 1B)
| Task | Description | Priority |
|------|-------------|----------|
| INTERN2-1 | Like and engage with relevant posts on Reddit dating communities | p2 |
| INTERN2-2 | Follow back and engage on GitHub dating projects | p2 |
| INTERN2-3 | Monitor Hacker News for related discussions | p2 |
| INTERN2-4 | Track LinkedIn posts about dating safety and trust | p2 |
| INTERN2-5 | Compile weekly social sentiment report | p2 |

### OpenClaw (openclaw) — Role: Personal AI · 100+ skills
| Task | Description | Priority |
|------|-------------|----------|
| OPENCLAW-1 | Draft support responses for common customer questions | p1 |
| OPENCLAW-2 | Summarize recent support tickets for knowledge base | p1 |
| OPENCLAW-3 | Generate FAQ entries from support patterns | p2 |
| OPENCLAW-4 | Create troubleshooting guides for technical issues | p2 |
| OPENCLAW-5 | Review and classify incoming feature requests | p2 |

### Claude (claude) — Role: Opus Conductor
| Task | Description | Priority |
|------|-------------|----------|
| CLAUDE-1 | Review complex technical architecture decisions | p1 |
| CLAUDE-2 | Generate executive summaries from detailed reports | p1 |
| CLAUDE-3 | Draft policy boundary documentation updates | p1 |
| CLAUDE-4 | Analyze competitor landscape for AI tools | p2 |
| CLAUDE-5 | Create technical implementation plans for new features | p2 |

### Codex (codex) — Role: Repo Surgery · Qwen3-Coder
| Task | Description | Priority |
|------|-------------|----------|
| CODEX-1 | Audit repository for business-only public copy compliance | p0 |
| CODEX-2 | Fix any failing CI/CD checks in the repo | p1 |
| CODEX-3 | Optimize backend API performance and queries | p1 |
| CODEX-4 | Update TypeScript/Python type hints across codebase | p2 |
| CODEX-5 | Clean up stale or obsolete code patterns | p2 |

### OpenCode (opencode) — Role: Open-Source Coding Agent
| Task | Description | Priority |
|------|-------------|----------|
| OPENCODE-1 | Implement frontend components from design specs | p1 |
| OPENCODE-2 | Write unit tests for backend API endpoints | p1 |
| OPENCODE-3 | Fix accessibility issues in React components | p1 |
| OPENCODE-4 | Optimize mobile responsiveness for all views | p2 |
| OPENCODE-5 | Refactor component library for consistency | p2 |

### Droid (droid) — Role: Factory Agent Across IDEs
| Task | Description | Priority |
|------|-------------|----------|
| DROID-1 | Monitor cross-IDE consistency for agent prompts | p2 |
| DROID-2 | Generate IDE-specific configuration files | p2 |
| DROID-3 | Sync agent definitions across development tools | p2 |
| DROID-4 | Create documentation for IDE integrations | p2 |
| DROID-5 | Test agent behavior across different environments | p2 |

### Pi (pi) — Role: Minimal Toolkit
| Task | Description | Priority |
|------|-------------|----------|
| PI-1 | Provide contextual guidance for repo navigation | p2 |
| PI-2 | Summarize key documentation for agents | p2 |
| PI-3 | Verify task assignment completeness | p2 |
| PI-4 | Monitor repository drift and sync status | p2 |
| PI-5 | Generate daily context digest for team | p2 |

## Implementation Notes

1. All tasks are registered in the Mission Control API via `/api/tasks`
2. Tasks follow the 10-bucket revenue engine framework
3. Priority levels: p0 (critical), p1 (high), p2 (medium)
4. Each agent has task_cap in registry to prevent overload

## Verification

- [x] 12 agents identified in registry
- [x] 5 tasks assigned to each agent (60 total tasks)
- [x] Tasks documented with priority and purpose
- [x] Task distribution follows business-only doctrine