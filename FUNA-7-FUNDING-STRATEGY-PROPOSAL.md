# FUNA-7 Funding Strategy Proposal

## Mission Alignment
This proposal focuses on **business-only product revenue** through youandinotai.com to fund the #UntilNoKidInNeed mission. No private accounting, fundraising, or control-language claims on customer surfaces.

---

## Executive Summary: 3 Revenue Levers to Activate Immediately

### 1. Multi-Account TikTok Growth Network (Ready to Launch)
**Investment:** 5-10 accounts ($0 upfront with faceless)
**Timeline:** 30-60 days to $10K-50K MRR
**Strategy:** Use the proven "faceless content at scale" model from GoViral ($80K MRR) and Go Viral ($100K MRR)

#### Why This Works for YouAndINotAI
- **Already have playbook:** Genspark Content Calendar with 30 days of ready actions
- **Already have assets:** Marketing images in `/marketing-assets/youandinotai-public/`
- **Proven hooks exist:** "YEARS of [dating struggle] and I'm only NOW finding this?" (adapted from The Ick - 8.1M views)
- **No face required:** Use existing app screenshots + stock b-roll emotional footage

#### Implementation Plan
| Day | Action |
|-----|--------|
| Day 1-3 | Create 5 TikTok accounts, warm up with non-promo content |
| Day 4-7 | Post 3x/day per account using slideshow format from Go Viral playbook |
| Day 8-14 | Track: median views, "what app?" comments, bookmarks |
| Day 15-30 | Scale winning format to 10-20 accounts |
| Day 30-60 | Add UGC ambassadors for top-performing posts |

---

### 2. Directory Submission Blitz (Ready to Launch)
**Investment:** Time only (free directories)
**Timeline:** Immediate submissions → ongoing traffic
**Strategy:** Use the 10-platform launch directory list from Genspark Submission Tracker

#### Target Platforms
| Platform | Audience | Status |
|----------|----------|--------|
| Product Hunt | 5M+ | Pending submission |
| BetaList | 2M+ | Pending submission |
| Show HN | 10M+ | Pending submission |
| Indie Hackers | 1M+ | Pending submission |
| AlternativeTo | 5M+ | Pending submission |
| SaaSHub | 2M+ | Pending submission |
| 4 more from Genspark playbook | Varies | Pending |

#### Submission Template
Use the `seed-income-engine.py` to create tasks, then draft content via `draft-content.py`:
- Focus on product value: "AI-powered compatibility matching"
- Lead with verification: "V8 Cloud Verification eliminates bots"
- Never mention donations or charity on public surfaces

---

### 3. Content Calendar Execution (Already Seeded)
**Investment:** Time to execute daily actions
**Strategy:** The Genspark playbook already has 30 days of content calendar actions

#### Key Actions (Week 1 Sample)
| Day | Platform | Action | Viral Hook Adaptable |
|-----|----------|--------|---------------------|
| Day 1 | Reddit | Join 5 subreddits, lurk and upvote | "3 years of dating apps and NOW I find this" |
| Day 2 | TikTok | Post 3x slideshow hooks | "Why is nobody talking about bot-free dating?" |
| Day 3 | Discord | Engage in dating servers | "POV: you're tired of bots on every app" |
| Day 4 | Product Hunt | Submit and engage comments | "Why I built a dating app with AI verification" |
| Day 5 | Twitter | Post hook with app screenshot | "Found a new way to annoy my boyfriend" (adapt) |

---

## Revenue Model Options (Product-Only Positioning)

### Current Pricing Structure
| Plan | Price | Positioning |
|------|-------|-------------|
| Bot-Shield $1 | One-time | Entry point for skeptical users |
| Founding Member $14.99/mo | Monthly | Primary subscription |
| 3-Month $39.99 | Bundle | 25% savings vs monthly |
| 12-Month $99.99 | Bundle | 33% savings vs monthly |
| Premium Card $2,500 | Premium | High-value access tier |

### Growth Levers
1. **Free trial funnel:** Add 7-day free trial to $14.99 plan (tested to 2x-4x LTV)
2. **Annual push:** Emphasize 33% savings in copy
3. **Bookmark optimization:** Slide 3-4 app reveal (not last slide)
4. **UGC ambassador program:** Pay $20/post + performance bonuses

---

## Implementation Checklist

### Phase 1: Immediate (This Week)
- [ ] Run `seed-income-engine.py --commit` to populate mission-mcp task board
- [ ] Execute Day 1-5 content calendar actions manually
- [ ] Submit to Product Hunt and BetaList (highest-priority directories)
- [ ] Create 5 TikTok accounts for faceless content testing

### Phase 2: Week 2-4
- [ ] Draft 10 TikTok videos using Go Viral slideshow format
- [ ] Post 3x/day per account
- [ ] Track median views, "what app?" comments, bookmark rates
- [ ] Identify 3x performer, create 30 more variations

### Phase 3: Month 2-3
- [ ] Scale to 15-25 accounts based on Phase 2 learnings
- [ ] Recruit 5-10 UGC ambassadors for top-performing content
- [ ] Add referral bonuses ($25 for 10 referrals, scaling up)
- [ ] Implement daily posting routine via mission-mcp scheduler

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| TikTok median views/account | 1K+ within 30 days | Analytics dashboard |
| "What's the app?" comments | 5+ per video | Manual tracking |
| Bookmark rate | 2%+ | Social analytics |
| Click-through to youandinotai.com | 2%+ | Link tracking |
| Membership conversion | 3-5% | Square checkout analytics |
| Monthly revenue | $10K by Day 60 | Square dashboard |

---

## Constraints & Compliance

### Customer-Facing Language Rules (Non-Negotiable)
- **NEVER use:** `donate`, `donation`, `solicitation`, `tax-deductible`, `charity`
- **Revenue framing:** "Membership gives you access to verified profiles and smarter matching"
- **Mission mention:** "a share of net proceeds after taxes and operating costs supports families through contractual revenue disbursement"
- **AI attribution:** "designed in collaboration with AI tools" (never platform-specific)

### Platform Compliance
- **Reddit:** Follow subreddit rules, no self-promo spam, 80/20 value ratio
- **TikTok:** No controversial content that risks bans, focus on problem/solution
- **Discord:** Read-only initial, engage authentically before any promotion
- **Product Hunt:** Honest Show HN style, transparent founder story

---

## Resource Requirements

### Tools Already Available
- `income-engine/` pipeline with draft-content.py and seed-income-engine.py
- `services/mission-mcp/` HTTP API for task orchestration
- `marketing-assets/` full brand asset library
- Square payment links live and tested
- Genspark playbook with 30-day content calendar

### Additional Needs
- Mission-mcp HTTP server running (`cd services/mission-mcp && npm run start:http`)
- Hermes Router or Ollama for draft generation (optional)
- 2-3 hours daily for content review and posting

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| TikTok account bans | Start with 5 accounts, diversify across platforms |
| Low initial engagement | Test 10 formats, double down on 3x performer |
| Platform rule violations | 80/20 value ratio, human review before all posts |
| AI cost efficiency | Use local models (Hermes/Ollama) for drafts |
| Founder time constraints | Batch content creation, automate where possible |

---

## Next Action

Joshua, please approve one of the following:

1. **Activate Faceless Growth Network** - I'll create the implementation plan and start the 5-account test
2. **Directory Blitz First** - I'll prioritize all 10 platform submissions immediately  
3. **Content Calendar Only** - I'll focus exclusively on the 30-day calendar execution

Once approved, I'll create specific tasks in mission-mcp and provide daily execution checklists.