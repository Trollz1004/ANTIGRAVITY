# Founding Engineer Role Specification + Interview Loop
**TRO-43**  
**Company:** Antigravity (Trollz1004/ANTIGRAVITY)  
**Date:** 2026-07-02  
**Status:** Draft for board / CEO review  
**Tag:** ANT hiring

## Executive Summary
Hire a **Founding Engineer (Fullstack + AI Infrastructure)** as the first technical hire. This role owns product engineering, agentic systems, and operational reliability for youandinotai.com (Square-powered memberships + verification), DREAM Online, and the broader ANTIGRAVITY stack under the #untilnokidinneed mission.

The role is explicitly **survival-floor aligned**: low cash burn, high equity ownership, extreme autonomy, and strict adherence to business-only public surfaces (no charity/fundraising language on customer paths per current doctrine).

## Role Details

**Title:** Founding Engineer (Fullstack + AI Infra)  
**Reports to:** CEO (Joshua Coleman) / active lead on Paperclip TRO board  
**Type:** Full-time founding role (or high-ownership contract-to-full)  
**Location:** Distributed (primary nodes: Sabretooth for brain/agent work, T5500 for front-door/production, 9020 dev/support)  
**Start:** Immediate upon hire + paid trial completion

### Core Responsibilities
- **Product surfaces:** Build/own youandinotai.com (React/Vite frontend, FastAPI backend), Square checkout flows, verification, matching/events, account flows. Maintain business-only copy discipline.
- **AI / Agent systems:** Develop and operate Paperclip + Hermes-style agents, MCP servers/tools, skills, orchestration (live NPC for DREAM if scoped), local model routing (Ollama, Grok, OpenCode, etc.). Token-frugal patterns, .agent-core style context reduction.
- **Infrastructure & Ops:** Multi-node self-host (T5500/Tunnel, Sabretooth, 9020), Cloudflare Pages/Workers, deploys, Docker, database (Postgres/Supabase/Neon where used), reliability, cost controls. Prefer deterministic execution.
- **Repo & Process:** Git hygiene (feature branches claude/<slug> or equivalent → PR → merge), durable artifacts (comments, briefings, work products), execution contract adherence (smallest verification, no polling for liveness).
- **Revenue & Growth alignment:** Support Square membership/verification sales, uptime, safety, support paths. No dilution of product value with non-product claims.
- **Delegation & Scaling:** As founding, help break work, create child issues, operate the "Wheel" (task buffer), hire/evolve next agents or humans per Paperclip patterns.

### Must-Have Experience
- Production fullstack: React + TypeScript + modern frontend tooling; Python (FastAPI/Starlette preferred) + async DB.
- AI/agent production work: tool calling, structured output, memory/context engineering, evaluation loops, cost control.
- Real infra: self-hosting, tunnels, CI/CD, node ops, observability basics. Comfortable with local-first + cloud hybrid.
- Startup / founder-mode: high autonomy, small teams, ambiguous requirements turned into shipped durable work.
- Alignment with ANTIGRAVITY doctrine: AGENTS.md / CLAUDE.md / business-only surfaces, survival prioritization, evidence-based execution.

### Nice-to-Have
- Prior Paperclip / multi-agent board experience or equivalent (Jira + agent orchestration).
- Dating/social product, payments (Square), moderation/safety systems.
- Game systems (for DREAM Online MMORPG elements: live NPCs, triggers).
- China ops awareness (for future localization) but not required.

## 4-Stage Interview Loop

**Goal:** Rigorously validate technical breadth, systems depth, mission/culture fit, and delivery under real constraints in minimal time/cost. All stages produce evidence.

### Stage 1: Tech Screen (45-60 min live or strong async submission)
- Live pair or take-home: implement or fix a narrow fullstack slice (e.g., a profile component + FastAPI endpoint + basic validation that matches existing patterns in the repo).
- AI tooling probe: "Build a minimal MCP-style tool or agent skill that reads a constrained context file and produces a structured patch proposal."
- Scoring: correctness + minimal diff discipline + understanding of token / context frugality + testability.
- Pass bar: Can ship working, reviewable code quickly without hand-holding. Red flags: over-engineering, no tests/artifacts, fantasy solutions.

### Stage 2: Systems + Infra Deep Dive (60 min)
- System design: "Design the agent runtime + deployment for our 3-node setup (brain, front-door, dev) given survival cash constraints, existing tunnels, Cloudflare, self-hosted models, and Paperclip execution model. Include failure modes, cost envelope, sync strategy."
- Tradeoff discussion: local vs managed (Neon/Supabase), when to add services, how to keep deterministic execution and easy rollback.
- Evidence: whiteboard / doc + follow-up small spike if needed.
- Pass bar: Realistic survival-aware design, not "throw money at Vercel + OpenAI". Understands the current stack (FastAPI, React, Paperclip 3110, FCC 8082, etc.).

### Stage 3: Culture + Mission Fit (45 min)
- Deep discussion of current doctrine: business-only customer surfaces, Square-only for youandinotai, founder $50k post-tax cap, survival bills first, no non-product claims on checkout or marketing.
- Behavioral (STAR-style):
  - Tell me about a time you shipped under extreme resource constraints (low runway, small team, high ambiguity).
  - Example of leaving durable handoff (docs, issues, artifacts) so others could continue without you.
  - How do you handle "the board says X but the real constraint is Y"?
- Red lines: any inclination to add fundraising/charity language to product, resistance to evidence-based process, low autonomy ("tell me exactly what to build").
- Pass bar: Strong ownership + alignment with #untilnokidinneed internal mission and strict product value selling externally.

### Stage 4: Paid Trial (1-2 weeks, scoped + paid)
- Paid at survival-aligned rate (see compensation).
- Deliverable: 1-2 high-signal, real items from current board (chosen at start of trial, e.g., a feature slice, agent skill + MCP, compliance hook, or deploy improvement).
- Requirements during trial:
  - Follow execution contract: pull before edit, smallest verification that proves change, leave comments + work products + update issues.
  - Daily/heartbeat style durable updates (not status theater).
  - End with reviewable PR(s) + briefing doc + status on relevant issue(s).
- Evaluation: Did the work move launch/revenue forward? Quality of artifacts and process adherence? Low drama, high signal.
- Outcome: Strong pass → offer. Marginal → extend or no. Fail → paid for value delivered, no offer.

**Total loop time to decision:** ~2-3 weeks including trial.

## Compensation Band (Per Survival Floor)

**Core principle:** Everything is calibrated to platform + founder survival first. Revenue (Square memberships/verification) is the only fuel. Founder total post-tax cap is $50,000/year. The company runs extremely lean with heavy agent leverage.

**Proposed band for Founding Engineer:**

- **Cash / Stipend:** $40,000 – $65,000 USD annualized (or equivalent contract day rate during early phase). Lower end preferred until consistent revenue >$8-10k MRR. Prioritize runway extension.
- **Equity:** 5–12% (founding-level stake). 4-year vest, 1-year cliff, standard acceleration on change of control / good leaver provisions to be defined in counsel docs. Significant ownership reflects the risk and impact.
- **Alternative structures:** 
  - Contract-to-hire with higher effective rate + equity grant at conversion.
  - "Survival + success": base survival cash + milestone bonuses tied to revenue (e.g., first $10k MRR, first 1000 verified users) + equity.
- **Other:** AI/tooling budget, access to the node resources, no traditional benefits package (self-funded health etc. until scale). Mission-aligned upside.
- **Review triggers:** 6 months or at revenue milestones ($10k / $25k MRR). Cap discipline remains; increases require explicit founder + (future) board alignment.

**Why this band?**
- Matches the survival math documented in DAO-FINALIZATION and related briefings.
- Keeps total human burn sustainable while revenue is being built.
- Equity is the primary incentive for a true founding role in a mission-driven company.
- Any candidate expecting "market" SF/NY fullstack + AI comp will self-select out — this is a survival-stage founding role.

## Onboarding & Success Metrics (First 90 Days)
- Own at least 2-3 shipped increments that directly support membership/verification flows or agent reliability.
- Establish or improve one durable process (e.g., improved agent heartbeat, pre-push guard, work-product standard).
- Produce clear documentation + issue handoffs so CEO / next hires can continue.
- Demonstrate Paperclip-native execution: issues updated with disposition, artifacts left, no silent work.

## How to Apply / Next
- Apply via [current channel set by board/CEO].
- Include: 1-2 links to prior shipped fullstack + AI/agent work (code + outcome), short note on why survival-stage founding role + this mission resonates.
- Process starts with Stage 1 upon screening.

---

**Durable artifacts for this spec:**
- This file: `docs/hiring/founding-engineer-role-spec.md`
- Posted to TRO-43
- Will be referenced from parent TRO-1 and any future hiring children

**Next actions after approval:**
- Post / promote the spec (board channels, targeted outreach)
- Run the interview loop on qualified candidates
- Create child issue(s) for "Run founding engineer search" or "Schedule first interviews" once spec accepted

Tag: ANT hiring | Priority: high | Owner: CEO / active lead

(End of spec)