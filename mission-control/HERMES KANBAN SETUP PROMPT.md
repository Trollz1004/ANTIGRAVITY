# HERMES KANBAN SETUP PROMPT
## From: Manus Agent (Meta/Key to Mission)
## To: Joshua Coleman (CEO) + Claude Code (Orchestrator)
## Re: Task Management + Financial Tracking for Mission-Funded Ecosystem
## Date: 2026-05-07 | Status: OPERATIONAL

---

## PURPOSE

Hermes Kanban is the operational nerve center for the entire ecosystem. It tracks:
- Active development tasks (income-engine, YouAndINotAI, Business Exchange, DAO)
- Revenue flows (real-time, real-or-zero only)
- Founder compensation cap ($50k across all platforms)
- Bucket allocations (public sale 10%, staking 10%, operating costs, reserves)
- Mission progress (#ForTheKids, #UntilNoKidInNeed)

**This is not a generic task board. This is the financial + operational truth system.**

---

## BOARD STRUCTURE

### Column 1: BACKLOG
Tasks not yet started. Includes:
- Feature development (income-engine lead marketplace, YouAndINotAI enhancements, Business Exchange routing)
- Public copy updates (landing page, README, DAO positioning)
- Infrastructure (Paperclip setup, Hermes integration, Ollama optimization)
- Revenue optimization (buyer acquisition, lead quality improvements)

### Column 2: IN PROGRESS
Active work. Includes:
- Lead marketplace build (ManusClaw + Stripe integration)
- Public site copy audit (YouAndINotAI positioning, DAO visibility, support integration)
- Buyer acquisition (LinkedIn outreach, Reddit targeting, email campaigns)
- Financial tracking setup (real-time revenue monitoring)

### Column 3: REVIEW
Ready for validation. Includes:
- Public copy (before publishing)
- Revenue calculations (before reporting)
- Lead quality metrics (before scaling)
- Founder compensation tracking (before payout)

### Column 4: DONE
Completed and live. Includes:
- Deployed features
- Published copy
- Live revenue streams
- Documented processes

---

## CARD STRUCTURE & REQUIRED FIELDS

Every Kanban card must include:

### Title
Clear, actionable, one-line description.
Examples:
- "Build lead marketplace UI in ManusClaw"
- "Update landing page hero copy (YouAndINotAI + DAO)"
- "Validate buyer acquisition strategy with 5 agencies"
- "Set up real-time revenue tracking dashboard"

### Priority
- **CRITICAL**: Blocks revenue or mission (income-engine launch, public copy, founder cap tracking)
- **HIGH**: Accelerates revenue or improves positioning (lead quality, buyer outreach, DAO visibility)
- **MEDIUM**: Improves operations or user experience (UI polish, documentation, analytics)
- **LOW**: Nice-to-have or future enhancement (advanced features, experimental ideas)

### Owner
Who's responsible for completion.
Examples: Joshua, Claude Code, Claude Opus, Manus

### Category
- **REVENUE**: Income-engine, lead generation, marketplace
- **POSITIONING**: Public copy, landing page, README, DAO launch
- **INFRASTRUCTURE**: Paperclip, Hermes, Ollama, database
- **MISSION**: #ForTheKids tracking, impact measurement, payment routing
- **FINANCIAL**: Founder cap, bucket allocation, tax planning

### Effort Estimate
- **1 HOUR**: Quick task, minimal dependencies
- **4 HOURS**: Half-day task, some complexity
- **1 DAY**: Full-day task, moderate complexity
- **3 DAYS**: Multi-day task, significant work
- **1 WEEK+**: Major initiative, multiple blockers

### Dependencies
What must be done first.
Examples:
- "Requires Stripe integration complete"
- "Requires public copy audit done"
- "Requires buyer list of 20+ agencies"

### Success Criteria
How you know it's done. Must be specific and measurable.
Examples:
- "Lead marketplace live with 5+ test buyers"
- "Landing page hero mentions YouAndINotAI, DAO, support, Business Exchange"
- "Real-time revenue dashboard shows $0 or live numbers only (no projections)"
- "Founder cap tracking shows $0-50k spend across all platforms"

### Notes
Context, links, decisions, blockers.
Examples:
- "Using Stripe for payments (no PayPal)"
- "Real-or-zero only: no projected numbers"
- "Separate public sale bucket from staking bucket in UI"
- "Blocked by Paperclip setup (waiting for Claude Code)"

---

## CRITICAL TRACKING CARDS (MUST EXIST)

### REVENUE TRACKING
**Title:** Real-time revenue dashboard (income-engine)
**Priority:** CRITICAL
**Owner:** Claude Code + Manus
**Category:** REVENUE + FINANCIAL
**Success Criteria:**
- Dashboard shows leads found, leads qualified, leads sold
- Revenue shows real numbers only (no projections)
- Separate tracking: public sale vs staking proceeds
- Updates every 15 minutes
- Shows YTD total and 30-day rolling average

### FOUNDER CAP TRACKING
**Title:** Founder compensation cap monitor ($50k ecosystem-wide)
**Priority:** CRITICAL
**Owner:** Joshua + Manus
**Category:** FINANCIAL
**Success Criteria:**
- Tracks total founder draws across YouAndINotAI, income-engine, Business Exchange, DAO
- Shows current spend vs $50k cap
- Flags when approaching 80%, 90%, 100%
- Shows what happens to excess (staking, reserves, reinvestment)
- Updated weekly

### BUCKET ALLOCATION TRACKING
**Title:** Kids bucket allocation monitor (public sale 10% + staking 10%)
**Priority:** CRITICAL
**Owner:** Manus + Joshua
**Category:** FINANCIAL + MISSION
**Success Criteria:**
- Public sale bucket: tracks 10% minimum allocation to kids
- Staking bucket: tracks 10% minimum allocation to kids (separate)
- Shows these as distinct rails (never merged)
- Shows YTD total paymentd to kids
- Updated weekly

### PUBLIC COPY AUDIT
**Title:** Audit + update public copy (YouAndINotAI, DAO, support, Business Exchange)
**Priority:** CRITICAL
**Owner:** Claude Opus
**Category:** POSITIONING
**Success Criteria:**
- Landing page hero mentions all 4 products
- DAO launch is visible (not buried)
- Support is in nav or prominent section
- Business Exchange is explained as marketplace layer
- README matches landing page logic
- No fake partnerships or invented numbers
- Real-or-zero only

### LEAD MARKETPLACE LAUNCH
**Title:** Build + launch lead marketplace (ManusClaw + Stripe)
**Priority:** CRITICAL
**Owner:** Claude Code + Claude Opus
**Category:** REVENUE
**Success Criteria:**
- Lead marketplace UI live in ManusClaw
- Stripe integration working
- Lead packages (bronze/silver/gold) configured
- Auto-notify buyers of new matches
- First 5 buyers acquired
- 100+ leads sold in first 30 days
- Revenue tracking live

### BUYER ACQUISITION
**Title:** Acquire first 20 buyers (agencies, consultants, service providers)
**Priority:** CRITICAL
**Owner:** Joshua + Claude Code
**Category:** REVENUE
**Success Criteria:**
- 20 buyers identified and contacted
- Pricing validated ($25-200 per lead depending on tier)
- Feedback collected on lead quality
- Repeat buyers identified
- Conversion rate tracked

---

## OPERATIONAL RULES FOR KANBAN

### Rule 1: Real-or-Zero Only
Any card tracking revenue, users, or impact must show real numbers only. No projections, no estimates, no "potential." If it's not live and wired, show zero with honest labeling.

### Rule 2: Separate Buckets
Public sale bucket and staking bucket are always tracked separately. Never merge them in card descriptions or success criteria.

### Rule 3: Founder Cap Discipline
Any card involving founder compensation must reference the $50k ecosystem-wide cap, not per-platform.

### Rule 4: Mission Alignment
Every card should connect to the mission. If it doesn't, question whether it belongs in the backlog.

### Rule 5: No Blocking Perfection
Cards should not stall waiting for perfect backend completion. "Good enough to ship" is acceptable if it's honest and documented.

### Rule 6: Dependencies Clear
Every card must list blockers and dependencies. If a card is blocked, move it to a "BLOCKED" section with the reason.

### Rule 7: Weekly Review
Every Friday, review all cards:
- Move completed work to DONE
- Update revenue/financial cards with real numbers
- Identify new blockers
- Reprioritize based on revenue impact

---

## SAMPLE CARDS TO CREATE NOW

### Card 1: Lead Marketplace MVP
**Title:** Build lead marketplace MVP (ManusClaw + Stripe)
**Priority:** CRITICAL
**Owner:** Claude Code
**Category:** REVENUE
**Effort:** 3 DAYS
**Dependencies:** ManusClaw v7 complete, Stripe account setup
**Success Criteria:**
- Lead marketplace UI live
- Stripe integration working
- Bronze/silver/gold tiers configured
- First test buyer can purchase leads
- Real-time revenue tracking live
**Notes:** Use ManusClaw existing chat UI as base. Add marketplace tab. Real-or-zero only.

### Card 2: Buyer Acquisition Sprint
**Title:** Acquire first 5 buyers (manual outreach)
**Priority:** CRITICAL
**Owner:** Joshua
**Category:** REVENUE
**Effort:** 1 DAY
**Dependencies:** Lead marketplace MVP complete, pricing validated
**Success Criteria:**
- 5 agencies contacted with lead samples
- Feedback collected on pricing and lead quality
- First buyer signed up
- First leads sold
**Notes:** Manual outreach only. Get feedback before scaling.

### Card 3: Public Copy Audit
**Title:** Audit + update landing page and README
**Priority:** CRITICAL
**Owner:** Claude Opus
**Category:** POSITIONING
**Effort:** 1 DAY
**Dependencies:** Opus briefing document (provided)
**Success Criteria:**
- Landing page hero mentions YouAndINotAI, DAO, support, Business Exchange
- DAO launch is visible (not buried)
- Support is in nav
- Business Exchange is explained as marketplace
- README matches landing page
- No invented numbers or partnerships
**Notes:** Follow Opus briefing exactly. Real-or-zero only.

### Card 4: Founder Cap Tracking Dashboard
**Title:** Build founder cap monitor ($50k ecosystem-wide)
**Priority:** CRITICAL
**Owner:** Manus
**Category:** FINANCIAL
**Effort:** 4 HOURS
**Dependencies:** Access to all platform revenue streams
**Success Criteria:**
- Dashboard shows total founder draws across all platforms
- Shows current spend vs $50k cap
- Flags at 80%, 90%, 100%
- Shows what happens to excess
- Updated weekly
**Notes:** This is not optional. Discipline is the point.

### Card 5: Kids Bucket Allocation Tracker
**Title:** Build kids bucket tracker (public sale 10% + staking 10%)
**Priority:** CRITICAL
**Owner:** Manus
**Category:** FINANCIAL + MISSION
**Effort:** 4 HOURS
**Dependencies:** Revenue tracking live, staking logic defined
**Success Criteria:**
- Separate tracking for public sale bucket (10% to kids)
- Separate tracking for staking bucket (10% to kids)
- Never merged in UI or copy
- Shows YTD total paymentd
- Updated weekly
**Notes:** These are distinct rails. Show them separately.

---

## WEEKLY STANDUP FORMAT

Every Friday 5pm (or your preferred time):

**What shipped this week?**
- List all cards moved to DONE
- Include real revenue numbers (real-or-zero only)
- Include real user/buyer numbers

**What's blocked?**
- List all cards in BLOCKED section
- State the reason and what's needed to unblock

**What's next (top 3)?**
- Prioritize next week's work
- Focus on revenue impact first
- Then positioning
- Then infrastructure

**Financial update:**
- Current revenue (real numbers)
- Founder cap status ($X of $50k)
- Kids bucket total paymentd
- Burn rate vs breakeven

---

## INTEGRATION WITH INCOME-ENGINE

Hermes Kanban is the source of truth for income-engine progress. Every revenue card should link to:
- ManusClaw dashboard (real-time lead metrics)
- Stripe integration (real-time payment tracking)
- Buyer list (who's buying, how often, average deal size)
- Lead quality metrics (conversion rate, feedback, repeat buyers)

---

## INTEGRATION WITH MISSION TRACKING

Hermes Kanban is also the source of truth for mission progress. Every mission card should track:
- Kids bucket total paymentd (updated weekly)
- Impact metrics (if available, real-or-zero only)
- Platform stability (uptime, user retention)
- Founder discipline (cap compliance)

---

## FINAL RULE

**This Kanban board is not a decoration. It is the operational truth system.**

Every card is a commitment. Every success criterion is measurable. Every number is real or zero. Every decision is documented. Every blocker is visible.

If a card is vague, make it specific. If a number is invented, replace it with zero. If a blocker is hidden, surface it. If a decision is unclear, document it.

The mission depends on this discipline.

---

**From Manus Agent | Meta/Key to Mission | 2026-05-07 | #ForTheKids Always 💚**

**P.S.** — Joshua, this Kanban board is your operational dashboard. Check it every morning. Update it every Friday. Use it to make decisions. Use it to stay on mission. Use it to protect the $50k cap. Use it to track the kids bucket. Everything else flows from here.
