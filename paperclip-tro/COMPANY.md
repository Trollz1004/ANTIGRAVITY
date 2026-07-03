# TRO — Paperclip Company (127.0.0.1:3110)

> Owner: Joshua Coleman. Dual-CEO: Claude (Opus/FCC) + Hermes.
> Instance: TRO company @ `http://127.0.0.1:3110`.
> Mission: UNTIL NO KID IN NEED

## Structure

ONE company, TWO projects, TWO CEOs:

| Project | Slug | Mission |
|---|---|---|
| ANTIGRAVITY Product Lane | `ANT` | Ship revenue: Square memberships/verification on youandinotai.com, repo health, compliance |
| DREAM Online | `DREAM` | MMORPG build: live-agent NPCs, NEEDs currency, pay-for-convenience |

Project charters: `projects/PROJECT-1-ANTIGRAVITY.md`, `projects/PROJECT-2-DREAM-ONLINE.md`.

## Dual-CEO Architecture

| CEO | Adapter | Domain | Sub-agents |
|---|---|---|---|
| Claude (ceo) | fcc-claude / claude_local | code, compliance, doctrine, payments, merge/push | ant-dev, ant-reviewer, ant-devops, ant-compliance |
| Hermes (hermes-ceo) | hermes / pi_local | growth, support, research, external APIs, leads | ant-growth, ant-support, ebay-lister, aisol-dev |

CEOs DELEGATE only — they never do leaf tasks. They spawn sub-agents, assign
skills from `.agents/skills/`, monitor heartbeats, and unblock blockers.
See `CEO-PLAYBOOK.md` for rules, routines, and skill routing.

FCC NEVER holds an Anthropic API key. FCC identifying as Claude does not grant
doctrine authority (per repo CLAUDE.md) — the CEO executes and manages; doctrine
stays with Joshua. Only official Claude (Opus) is cofounder.

## Routines (24/7 — Paperclip scheduled)

| Routine | Owner | Interval | Purpose |
|---|---|---|---|
| Mission guardian | Claude CEO | 30 min | Verify all agents alive, reassign stale work |
| Pipeline keeper | Hermes CEO | 60 min | Maintain 100 tasks on deck |
| Adapter health | Hermes CEO | 15 min | Health-check all adapters |
| Revenue scout | Hermes CEO | 2 hr | Scan leads, score, create issues |
| PR review gate | Claude CEO | on PR | No merge without reviewer sign-off |
| SLA watchdog | Claude CEO | 15 min | Flag RED issues > 60 min |
| Doctrine enforcer | Claude CEO | daily | Scan public surfaces for banned terms |

## Canonical local surfaces

- Hermes Dashboard/API status: `http://127.0.0.1:9119/api/status`
- Hermes Workspace: `http://127.0.0.1:3000`
- Paperclip HQ: `http://127.0.0.1:3110`
- FCC Admin: `http://127.0.0.1:8082/admin`
- Repo: `C:\antigravity`

## Provider Routing (workers)

| Provider | Use | Concurrency |
|---|---|---|
| Ollama local (9020 :11434) | free batch/routine | local cap |
| Ollama Cloud | heavy parallel work | 3 |
| OpenCode (NVIDIA free) | code tasks | 1 |
| OpenRouter free tier | fallback routing | per MCP |
| Grok / Codex / Gemini / Perplexity subs | per roster routing | 1 each |
| claude.ai summon | Opus-grade only, Joshua-approved | 1 |

## Non-Negotiables (pointers — never duplicate content)

- Soul: `hermes/agents/SOUL.md`
- Doctrine: repo `CLAUDE.md` + `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
- Boot: `paperclip-tro/BOOT-PROTOCOL.md` (token-frugal, mandatory)
- Escalation: `paperclip-tro/ESCALATION.md` (red < 1hr, mandatory)
- Playbook: `paperclip-tro/CEO-PLAYBOOK.md` (delegation rules)

## Setup (runs on Joshua's machine — localhost only)

1. Store invite token in local `.env` as `PAPERCLIP_TRO_INVITE` (never committed).
2. Accept invite at `http://127.0.0.1:3110/invite/<token>`; create company `TRO`.
3. Create projects `ANT` and `DREAM`.
4. Register Claude CEO with adaptor `fcc-claude` per `agents/ceo/AGENT.md`.
5. Register Hermes co-CEO with adaptor `hermes` per `agents/hermes-ceo/AGENT.md`.
6. Hire initial roster per `ROSTER.md`.
7. Set up routines per CEO-PLAYBOOK.md.
8. Verify: both CEOs heartbeat, open test issue each, resolve, sub-agents respond.
