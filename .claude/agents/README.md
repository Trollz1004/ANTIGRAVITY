# ANTIGRAVITY Skill Pool (Claude Code subagent format)

Skill pool for the ANTIGRAVITY workspace, in Claude Code subagent format.
Vendored from the open-source Contains Studio collection, with an ANTIGRAVITY
doctrine section injected into every file and mission-specific entries added
on top.

**These files are not autonomous workers.** The operating model (set by
Joshua, encoded in `harnesses.ts` in the standalone
[`Trollz1004/mission-control-v5`](https://github.com/Trollz1004/mission-control-v5)
repo — note the `mission-control-v5/` snapshot vendored *inside this repo*
predates that refactor: its `agents.ts` still lists a four-orchestrator
roster including retired Ornith, and is not the contract):

- **The three harnesses do the work** — Hermes (research/outreach/revenue/
  content), OpenClaw (engineering/verification), OpenCode (CEO). A harness
  spins up sub-agents and loads entries from the skill pool as their skill
  set (minimum 5 skills per sub-agent). The pool spans ~148 skills across
  the trees: the 42 files here, the active entries under `.agents/skills/`,
  and the node-local trees (Hermes preload set, OpenCode's
  `~/.agents/skills`) — counts per tree live in `CLAUDE.md`.
- **High-reasoning judgment gates the output.** Before a non-trivial change
  lands, the judge panel (`testing/judge-panel.md` — Opus/Fable, Grok, Gemini
  at max reasoning via OmniRoute) reviews the diff and reports an advisory
  verdict to the active lead.
- **Mission Control v5 on `:3151` is the board** where this work is
  coordinated. Mission Control v6 on `:8787` is a *health monitor only* — a
  different program; never treat it as the board.

Claude Code sessions also discover these files automatically (recursively)
and can delegate directly when a task matches a description — that's the
same pool, driven by a different harness.

This pool complements `.agents/skills/` (the SKILL.md library, a different
format). Don't duplicate content between them.

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
