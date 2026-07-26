# MAR-8 Hire Plan — Agent Hiring & Skill Rotation System

**Date:** 2026-07-26
**Issue:** MAR-8
**Status:** Implementation

## Objective

Build a 24/7 agent hiring and skill rotation system that:
- Hires agents regularly with appropriate skills
- Rotates marketing building tasks hourly
- Creates 50+ new tasks/goals/issues per hour
- Updates memory continuously
- Audits and manages skill quality

## Agent Hiring Framework

### Agent Categories

1. **Core Operations**
   - `ceo` — Strategic direction, hiring decisions
   - `chief-of-staff` — Coordination, process management
   - `project-shepherd` — Task execution, delivery

2. **Marketing & Growth**
   - `growth-hacker` — Acquisition, viral loops
   - `content-creator` — Content production
   - `social-media-strategist` — Platform engagement
   - `seo-specialist` — Organic visibility

3. **Technical**
   - `frontend-developer` — UI implementation
   - `backend-architect` — API & infrastructure
   - `devops-automator` — Deployment & operations

4. **Support**
   - `customer-service` — User assistance
   - `support-responder` — Issue resolution

### Hiring Criteria

| Factor | Weight | Threshold |
|--------|--------|-----------|
| Skill Match | 40% | Must cover primary task |
| Token Cost | 20% | < 50K tokens/heartbeat |
| Maintenance Status | 20% | Updated within 30 days |
| Proven Track Record | 20% | Success rate > 80% |

## Skill Rotation Schedule

### Hourly Marketing Building Rotation

| Hour | Focus Area | Skills Required | Output Target |
|------|------------|-----------------|---------------|
| 00 | Content Audit | content-creator, seo-specialist | Audit report |
| 01 | Social Planning | social-media-strategist | 7-day calendar |
| 02 | Technical SEO | seo-specialist, frontend-developer | Optimization list |
| 03 | Email Campaigns | content-creator, growth-hacker | 3 email drafts |
| 04 | Analytics Review | analytics-reporter | KPI dashboard |
| 05 | Competitor Analysis | trend-researcher, competitive-intel | Intel report |
| 06 | Community Engagement | reddit-community-builder, twitter-engager | Engagement log |
| 07 | Ad Creative | ad-creative-strategist, paid-social-strategist | 5 ad concepts |
| 08 | Landing Page | ui-designer, frontend-developer | Wireframe |
| 09 | A/B Test Design | experiment-tracker, growth-hacker | Test plan |
| 10 | Outreach | outbound-strategist, sales-outreach | 20 prospects |
| 11 | Partnership Dev | deal-strategist, proposal-strategist | Partnership brief |
| 12 | Video Content | video-optimization-specialist | Script outline |
| 13 | Podcast Planning | podcast-strategist | Episode outline |
| 14 | Case Study | content-creator, case-study-writer | Draft case study |
| 15 | Webinar Prep | event-producer, content-creator | Webinar deck |
| 16 | SEO Content | seo-specialist, content-creator | 3 blog outlines |
| 17 | Social Execution | social-media-strategist | 10 posts drafted |
| 18 | Paid Media | paid-media-auditor, ppc-campaign-strategist | Campaign audit |
| 19 | Email Optimization | email-intelligence-engineer | 3 email variants |
| 20 | Conversion Rate | growth-hacker, ui-designer | CRO recommendations |
| 21 | Influencer Outreach | influencer-strategist | 10 influencer targets |
| 22 | PR & Media | pr-strategist, content-creator | Press release draft |
| 23 | Daily Review | analytics-reporter, chief-of-staff | Daily summary |

## Task Generation System

### Task Categories (50+ per hour)

1. **Content Tasks** (15/hour)
   - Blog post drafts
   - Social media copy
   - Email templates
   - Ad copy variants

2. **Technical Tasks** (10/hour)
   - SEO optimizations
   - UI improvements
   - Performance audits
   - Security checks

3. **Outreach Tasks** (10/hour)
   - Prospect identification
   - Partnership outreach
   - Influencer contacts
   - Media pitches

4. **Analysis Tasks** (10/hour)
   - Competitor monitoring
   - Market research
   - User feedback analysis
   - Conversion funnel review

5. **Process Tasks** (5/hour)
   - Workflow automation
   - Documentation updates
   - Training material creation
   - Quality audits

### Task Creation Workflow

```
1. Identify focus area from rotation schedule
2. Select appropriate agent with matching skills
3. Generate task list (50+ items)
4. Prioritize by impact and effort
5. Assign to agent queue
6. Set completion criteria
7. Track progress in memory
```

## Memory Update Protocol

### Continuous Memory Updates

| Trigger | Action | Location |
|---------|--------|----------|
| Task Completed | Log success/failure | memory/tasks-completed.md |
| Skill Used | Record effectiveness | memory/skill-performance.md |
| Agent Hired | Track capability match | memory/agent-roster.md |
| Hourly Summary | Update metrics | memory/hourly-metrics.md |
| Issue Created | Log in issue tracker | paperclip issues |

### Memory Structure

```
memory/
├── agent-roster.md          # Active agents and skills
├── skill-performance.md     # Skill effectiveness metrics
├── tasks-completed.md       # Task completion log
├── hourly-metrics.md        # Performance by hour
├── hiring-decisions.md      # Hiring audit trail
└── market-intelligence.md   # Competitor/market data
```

## Audit & Quality Control

### Skill Audit (Daily)

- [ ] Review skill effectiveness ratings
- [ ] Identify underperforming skills
- [ ] Research replacement skills
- [ ] Test new skills in sandbox

### Agent Performance (Weekly)

- [ ] Task completion rate
- [ ] Quality score (1-10)
- [ ] Token efficiency
- [ ] Skill utilization

### Hiring Decisions (As Needed)

- [ ] Match skill gaps to agent capabilities
- [ ] Test agent with sample task
- [ ] Evaluate performance
- [ ] Onboard or reject

## Implementation Steps

### Phase 1: Foundation (Today)

1. Create memory directory structure
2. Document current agent roster
3. Establish skill performance baseline
4. Set up task generation templates

### Phase 2: Rotation System (Tomorrow)

1. Implement hourly rotation schedule
2. Create task generation workflows
3. Set up memory update automation
4. Test with 1-hour cycle

### Phase 3: Scale (Next 3 Days)

1. Expand to 24/7 operation
2. Optimize token usage
3. Refine skill matching
4. Document best practices

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Tasks/Hour | 50+ | 0 |
| Agent Utilization | 80% | 0% |
| Skill Match Rate | 90% | 0% |
| Memory Update Frequency | Real-time | Manual |
| Hiring Decision Speed | < 5 min | N/A |

## Next Actions

1. **Immediate:** Create memory directory structure
2. **Today:** Document current agent capabilities
3. **Today:** Set up task generation templates
4. **Tomorrow:** Test 1-hour rotation cycle
5. **This Week:** Achieve 50 tasks/hour target

---

**Assigned:** CEO
**Status:** In Progress
**Last Updated:** 2026-07-26
