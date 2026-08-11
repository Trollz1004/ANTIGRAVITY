# ANTIGRAVITY Claude Code Agents

Claude Code subagent roster for the ANTIGRAVITY workspace. Vendored from the
open-source Contains Studio agents collection, with an ANTIGRAVITY doctrine
section injected into every agent and mission-specific agents added on top.

Claude Code discovers these automatically (recursively) and delegates when a
task matches an agent's description. Invoke explicitly by asking for an agent
by name, e.g. "use the tiktok-strategist agent".

This roster is separate from `.agents/skills/` (the SKILL.md library, a
different format). Agents are *who does the work*; skills are *reference
loaded into a session*. Don't duplicate content between them.

## Departments

### engineering/
| Agent | Purpose |
|---|---|
| frontend-developer | Build and fix UI (React/Next.js) |
| backend-architect | API and service design |
| mobile-app-builder | Native/mobile surfaces |
| ai-engineer | LLM features and pipelines |
| devops-automator | Deploys, CI, infra automation |
| rapid-prototyper | MVP in days, not weeks |
| test-writer-fixer | Write and repair tests after changes |

### product/
| Agent | Purpose |
|---|---|
| trend-researcher | Spot viral/product opportunities |
| feedback-synthesizer | Turn user feedback into ranked actions |
| sprint-prioritizer | Pick next work by revenue-per-effort |

### marketing/
| Agent | Purpose |
|---|---|
| tiktok-strategist | FUNA-7 Lever 1: faceless TikTok network, 3x/day |
| instagram-curator | Visual content strategy |
| twitter-engager | X/Twitter engagement |
| reddit-community-builder | Reddit presence without getting banned |
| app-store-optimizer | Store listing/keyword optimization |
| content-creator | FUNA-7 30-day calendar, cross-platform |
| growth-hacker | Funnel/CRO on the live Square links |
| directory-submitter | FUNA-7 Lever 2: Product Hunt, BetaList, Show HN, etc. |
| news-droid-producer | Operates Yesterday's News Today (Claude Droid SKU) |

### design/
| Agent | Purpose |
|---|---|
| ui-designer | Interface design |
| ux-researcher | User research and journey mapping |
| brand-guardian | Visual identity consistency |
| visual-storyteller | Visuals that convert |
| whimsy-injector | Delight details |

### project-management/
| Agent | Purpose |
|---|---|
| experiment-tracker | A/B tests and feature-flag experiments |
| project-shipper | Launch coordination |
| studio-producer | Cross-team throughput |

### studio-operations/
| Agent | Purpose |
|---|---|
| support-responder | Customer support handling |
| analytics-reporter | Metrics into decisions |
| infrastructure-maintainer | Service health and scaling |
| legal-compliance-checker | Terms, privacy, regulatory |
| finance-tracker | Budget and spend |
| revenue-tracker | Square sales vs catalog; 24h no-funds post-mortem rule |
| compliance-guardian | Read-only pre-publish doctrine gate |

### testing/
| Agent | Purpose |
|---|---|
| tool-evaluator | Evaluate tools/frameworks fast |
| api-tester | API correctness and load |
| workflow-optimizer | Human-agent workflow efficiency |
| performance-benchmarker | Speed profiling and fixes |
| test-results-analyzer | Failure patterns and quality metrics |
| judge-panel | Multi-model pre-merge review (Claude + Grok/Gemini via OmniRouter) |

### bonus/
| Agent | Purpose |
|---|---|
| studio-coach | Coordinates other agents on complex work |
| joker | Morale |

## Doctrine (applies to every agent)

- Customer-facing copy is business-only: membership, verification, safety,
  support, uptime, platform access — only that product framing, in copy and in
  prompts. The banned-language list lives in CLAUDE.md (Public Copy Boundary)
  and the current doctrine briefing.
- Dating surfaces are Square-only (Stripe AUP bars dating apps; CI enforces).
  Other product lines may use Stripe with Joshua's approval.
- No secrets in output, files, or commits — names only, never values.
- Pricing, payments, doctrine, public brand copy, launch gates, node roles:
  founder (Joshua) approval required.
- Write state back at session end per AGENTS.md.
