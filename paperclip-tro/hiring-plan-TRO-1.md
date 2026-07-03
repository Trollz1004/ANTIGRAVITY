# TRO-1 Hiring Plan: First Engineer (Founding)

**Status**: Draft for review (created 2026-07-02 by Grok CEO agent)
**Objective**: Hire/provision the first engineer seat to execute roadmap. Break ANT/DREAM charters into delegated concrete tasks. Use agency skill model.

## Context from prior heartbeat (acknowledged)
- Prior "done" summary: Hermes activated as Phase 1 founding. Roadmap split to 5 areas. Pending board confirmation.
- Failure: pi_local adapter "command line too long" (see TRO-41 for hermes/cmdline via env fix). This run avoids shell adapters for payload; uses direct execution + API.
- Reassignment note treated Hermes as the "founding engineer" role to bootstrap.

## First Hire Target
**Role**: Founding Engineer (ant-dev)
- Skill: `.agents/skills/agency-senior-developer/SKILL.md`
- Project: ANT (revenue lane first)
- Why first: Unblocks Square checkout lane, repo health, public surfaces. Highest priority per PROJECT-1-ANTIGRAVITY.md.
- Reports to: tro-ceo
- Adapter: Use working one (grok_local / opencode / hermes per STATE learnings). Avoid pi_local until cmdline fixed.
- Heartbeat: 60 min

Alternative first if Joshua prefers: dream-mcp (live NPC bridge) for DREAM moat.

## Hiring / Provisioning Steps (for agents; human hires follow same seat + ROSTER pattern)
1. Clone seat: `cp -r agents/_template agents/ant-dev` (or use paperclip create-agent skill when available).
2. Customize files:
   - agents/ant-dev/README.md : fill mission (ANT senior dev for checkout/onboarding), pointers to skill, project.
   - agents/ant-dev/AGENT.md : set adapter, model, skills: agency-senior-developer ; title "ant-dev — ANT"
   - agents/ant-dev/HEARTBEAT.md : use template + any skill-specific.
   - agents/ant-dev/STATE.md : fresh.
3. Update ROSTER.md : add row under Project ANT.
4. Register adapter if new: ensure manifest in adapters/ or use existing.
5. Seed initial task: assign concrete child issue (see below) to the new seat.
6. Verify: run one heartbeat via harness; check STATE written, board status.
7. Budget: start $0 (local), escalate for paid providers only after first ship.
8. Fire fast: if no ship in first assigned task cycle, delete seat + log.

For human founding engineer later: post JD to Upwork/LinkedIn/X with budget $X, skills match agency-senior-developer scope + Square/FastAPI/React/Cloudflare. Use same onboarding to give seat + board access.

## Compensation / Sourcing (placeholder until Joshua sets)
- Agent lanes: free local + OpenRouter free tier first.
- Human: TBD (Square revenue gated). Target first 3 months runway from product sales.

## Roadmap Broken Into Concrete Delegable Tasks
From PROJECT-1-ANTIGRAVITY.md + PROJECT-2 priorities + ROSTER gaps.

### ANT (Revenue - Phase 1 immediate)
- T-ANT-01 (TRO-55, e8661846...): Make Square checkout end-to-end green on youandinotai.com (membership + verification flows). Owner: ant-dev (first hire). Evidence: live purchase receipt + no errors on T5500. (Created as child in this heartbeat.)
- T-ANT-02: Public copy compliance sweep + ant-compliance agent gate (banned terms scan in CI or pre-merge). Owner: ant-compliance.
- T-ANT-03: Founding-member onboarding funnel v1 (first 50 signups tracked). Owner: ant-growth (after ant-dev).
- T-ANT-04: Bot-shield verification integration (basic profile flags). Owner: ant-dev.
- T-ANT-05: Deploy health + CI no-red for youandinotai frontend/backend. Owner: ant-devops.

### DREAM (Foundation - after ANT green or parallel if capacity)
- T-DREAM-01: Design docs complete (core loop, NEEDs economy, NPC persona, world bible). Owner: dream-design.
- T-DREAM-02: Live-NPC bridge prototype (1 NPC, trigger, memory writeback <2s roundtrip via mcp). Owner: dream-mcp + dream-proto.
- T-DREAM-03: Write missing skill: .agents/skills/dream-live-npc/SKILL.md (persona state, cost-tier routing). Owner: ceo or delegated.
- T-DREAM-04: Engine decision record (Unity/Unreal/Godot) + spike. Owner: Joshua + dream-proto.

### Cross / Hiring Infrastructure
- T-HIRE-01 (this): Provision ant-dev seat + first assignment. Owner: ceo. (self)
- T-HIRE-02: Fix adapter cmdline length (env or stdin payload) for hermes/pi/etc. Owner: ceo (see TRO-41).
- T-HIRE-03: Create 2 more seats (ant-reviewer, ant-support) after first ship.

## Delegation Plan
- CEO creates child issues on board with assignee tags + skill hints.
- Use POST /api/companies/.../issues for new children (with parent link if supported).
- Agents pick via heartbeat PICK ONE.
- All work: durable output (files, PRs, board comments with evidence).
- Weekly: CEO wheel reviews shipped vs plan.

## Next Concrete Actions (this heartbeat)
- [x] Acknowledge comments + failure root cause.
- [ ] Write this hiring-plan-TRO-1.md (durable).
- [ ] Update ROSTER.md with first hire entry.
- [ ] Create 1-2 child issues for immediate delegation (T-ANT-01 etc).
- [ ] Provision initial seat stub for ant-dev (create dir + basic files from template).
- [ ] Update issue status + post summary comment with links to plan + children.
- Disposition: in_review (request Joshua confirmation on first hire choice + plan) or done if self-contained.

## Evidence / Artifacts
- This file: paperclip-tro/hiring-plan-TRO-1.md (supplemental; see canonical status in briefings/TRO-1-HIRING-PLAN-STATUS.md)
- Canonical status/prior execution: briefings/TRO-1-HIRING-PLAN-STATUS.md (updated in this run)
- ROSTER.md
- PROJECT-*.md
- Prior comments (fbda369b..., b8e2ac27..., 7227e7a6...)
- New comments (099fc640... ack, 3a1e9887... progress, final)
- Seat: paperclip-tro/agents/ant-dev/
- Child: TRO-55 (e8661846...) linked to TRO-1
- Issue now in_review (this run)

## Risks / Blockers
- Cmdline adapter failures block delegated agent runs (unblock owner: fix in paperclip core / adapter manifests + TRO-41).
- No human budget yet.
- Engine choice blocks DREAM deep hires.

## Approval Path
Post this plan, create interaction or comment requesting confirmation from Joshua / board for "hire ant-dev first" and child task creation. Then mark in_review.

(End of plan - will be updated in session)
