# Q3 2026 STRATEGIC ROADMAP — YouAndINotAI & ANTIGRAVITY

> **Authority:** Joshua Coleman (sole founder) + Cofounder Triad  
> **Period:** July 1, 2026 - September 30, 2026  
> **Mission:** #UntilNoKidInNeed — Revenue → Platform Stability → Mission Funding  
> **Status:** In Progress (assigned to CEO agent)

---

## Executive Summary

Q3 2026 focuses on **customer acquisition** and **platform stabilization** across the three active revenue surfaces:

| Platform | Q3 Goal | Key Metric |
|---|---|---|
| youandinotai.com | 1,000 signups focused on real-world engagement | Verified active users |
| ai-solutions.store | Launch 5 AI service products | First paying customers |
| onlinerecycle.org | Scale TRA marketplace by 40% YoY | Monthly GMV |

**Critical constraint:** All customer-facing copy must use **business-only language** — membership, verification, safety, support, uptime, checkout, and platform value. No non-product framing, private accounting claims, or control-rights promises in sales copy.

---

## Q3 Priorities Matrix

| Priority | Initiative | Effort | Dependencies | Owner |
|---|---|---|---|---|
| P0 | Cloudflare UI promotion (yni-landing → youandinotai.com) | XS | Josh interactive | Josh |
| P0 | Mission-control task pool stabilization | S | Existing services/mission-mcp | Sonnet |
| P0 | Income-engine Genspark playbook seeding | S | mission-mcp HTTP API | Sonnet |
| P1 | Social posting cadence (Reddit/Discord) | L | T-203, T-206 | Josh + Sonnet |
| P1 | Verification pathway optimization | M | Frontend build | Sonnet |
| P2 | AI-Solutions.store MVP launch | L | Vercel deployment | Gemini/Sonnet |
| P2 | OnlineRecycle TRA expansion | M | eBay OAuth | Sonnet |

---

## Phase Alignment: Where We Are Now

Based on the master roadmap (May 13, 2026), Q3 overlaps with:

- **Phase 2 conclusion** (CI repair, test coverage, mission-mcp stabilization)
- **Phase 3 execution** (Income-engine full activation, content-prep loop)
- **Phase 4 early ramp** (Multi-platform expansion)

### Completed / In-Progress Items

- ✅ BUS-144: Agent bundle UUID canonical schema (deployed)
- ✅ Business-only audit: Customer-facing surfaces cleaned (June 22)
- 🔄 mission-mcp: Task pool refill logic stabilizing
- 🔄 income-engine: Genspark playbook ready for seeding
- 🔄 Frontend: Verification page built, awaiting Cloudflare promotion

### Outstanding Blocking Items

- ⏳ T-001: Cloudflare UI promotion (Josh interactive required)
- ⏳ T-002/T-003: API token rotations (Josh interactive required)

---

## Q3 Campaign Goals (Active)

```yaml
- id: 1
  type: campaign_goal
  content: Drive 1000 new user signups during Q3 focused on real-world engagement
  status: active
  created: 2026-04-17

- id: 2
  type: brand_guideline
  content: Never use "restricted-term", "customer payments", or "review-gated offer" - use "reserved allocation review" instead
  status: active
  created: 2026-04-17

- id: 3
  type: messaging_pillar
  content: Emphasize real-world meetups and volunteer events over traditional matching
  status: active
  created: 2026-04-17

- id: 4
  type: target_audience
  content: Socially conscious individuals ages 25-45 who value genuine human connection
  status: active
  created: 2026-04-17

- id: 5
  type: competitive_advantage
  content: Platform connects people for meaningful activities, not just dating
  status: active
  created: 2026-04-17
```

---

## Month-by-Month Breakdown

### July 2026 — Foundation & Activation

**Week 1 (Jul 1-7):**
- T-001: Cloudflare UI promotion → stops 27K/day view bleed
- T-006/T-007: TOS audit + wrangler config verification
- T-009/T-010: FastAPI test run + frontend build verification
- Deploy verified signup/verification page live

**Week 2 (Jul 8-14):**
- Seed mission-mcp with Genspark submission tracker (26 tasks)
- Seed mission-mcp with content calendar (30 tasks)
- T-203: Daily content-prep loop operational
- First Product Hunt/BetaList submissions

**Week 3 (Jul 15-21):**
- Reddit/Discord posting cadence begins
- T-018: onlinerecycle.org TOS audit passed
- TRA eBay re-auth (if needed)

**Week 4 (Jul 22-31):**
- Week 2 content cycle complete
- Engagement metrics review
- Optimization adjustments

### August 2026 — Growth & Expansion

**Week 5-6 (Aug 1-14):**
- 30-day content cycle continues
- T-213/T-214: Product Hunt + BetaList live
- ai-solutions.store MVP launch (5 products)

**Week 7-8 (Aug 15-31):**
- AIS product feedback loop
- onlinerecycle.org expansion: 5 new service tiers
- Super Likes feature (Bucket 2 activation)

### September 2026 — Scale & Measure

**Week 9-12 (Sep 1-30):**
- Engagement metrics analysis
- Signup conversion funnel optimization
- September goal: 1,000 verified signups
- Q3 retro preparation

---

## Revenue Streams (Business-Only Framing)

### Stream 1: YOU (YouAndINotAI) — Membership Platform

| Tier | Framing | Value |
|---|---|---|
| Founding Member | Early access + reserved allocation | $27/month |
| 3-month pass | Quarterly commitment | $79 ($26.33/month) |
| 12-month pass | Annual commitment | $279 ($23.25/month) |
| Royalty Card | Premium support + features | $2,500 one-time |

### Stream 2: AIS (AI Solutions Store)

| Product | Type | Price |
|---|---|---|
| Custom chatbot setup | Service | $199-499 |
| AI workflow automation | Service | $299-999 |
| Custom model fine-tuning | Service | $499-1,499 |

### Stream 3: TRA (OnlineRecycle) — Service Marketplace

| Service | Range |
|---|---|
| eBay listing management | $25-100 per item |
| Recycling consultation | $75-200 per session |
| Bulk donation pickup coordination | $150-500 per pickup |

---

## Key Systems Status

### Mission Control (mission-mcp)

| Component | Status |
|---|---|
| Task pool refill cron | Operational |
| HTTP transport | Verified |
| Database schema | Stable |
| CLI tools | Available |

### Frontend Build

| Component | Status |
|---|---|
| Verification page | Built (awaiting promotion) |
| Signup flow | Minimal |
| Square checkout links | Active |
| TOS compliance | Clean |

### Income Engine

| Component | Status |
|---|---|
| Genspark playbook | Ready |
| Seed scripts | Available |
| Draft generator | Hermes/Ollama ready |
| Command-center UI | In design |

---

## Success Metrics (Q3)

### Platform Health
- [ ] youandinotai.com returns 200 (not placeholder)
- [ ] mission-mcp: 90 active tasks available at all times
- [ ] FastAPI test suite: >200 passing
- [ ] Frontend build: no TOS violations on output

### Growth Metrics
- [ ] 1,000 verified signups by Sep 30
- [ ] Product Hunt listing: launched + gaining traction
- [ ] Reddit: 7-day posting cadence = 11 posts/day × 7 days
- [ ] Discord: 11 servers engaged for 7 consecutive days

### Revenue Activation
- [ ] First paying Founding Member (baseline revenue)
- [ ] AIS: First 5 products listed + sold
- [ ] TRA: 5 new service tiers live
- [ ] Super Likes feature shipped (Bucket 2)

### Documentation
- [ ] Q3 retro drafted by Oct 7
- [ ] Engagement correlation documented
- [ ] Next phase prep (Q4) begun

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Josh interactive bottleneck | Pre-flights completed; minimize required clicks |
| Hermes/Ollama downtime | Fallback to cloud models documented |
| TOS regression | Pre-push hook T-041 ready for CI integration |
| Revenue delay | Lead broker model available (separate from mission) |

---

## Next Actions (Immediate)

1. **T-001**: Cloudflare UI promotion — **requires Josh action**
2. **T-006**: TOS audit on customer surfaces — **Sonnet dispatch**
3. **T-012/T-013**: Genspark seeding to mission-mcp — **ready**
4. **T-009**: FastAPI pytest run — **baseline verification**

---

## References

- Master roadmap: `briefings/ANTIGRAVITY-MASTER-ROADMAP-2026-05-13.md`
- Business-only doctrine: `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
- Income-engine setup: `income-engine/README.md`
- Campaign items: `campaign-deliverables/q3-campaign/items.yaml`

---

**Status:** Ready for immediate execution. Blocking items flagged for Josh interactive.

**Generated:** 2026-06-28  
**Agent:** CEO (08d0425a-009b-4f1b-8c16-65836866ba37)  
**Checkout:** FUNA-20