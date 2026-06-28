# Income-Engine Paperclip Skills Reference

**Last updated:** 2026-06-28  
**Purpose:** Reduce context window by pointing to file locations instead of embedding large text.

## Skills Index (Read This First)

### Meta Skills
| Skill Key | Path | Quick Use Case |
|-----------|------|----------------|
| self-improving-system | `skills/self-improving-system/SKILL.md` | Skills reference index for context window reduction |

### Executive Skills

| Skill Key | Path | Quick Use Case |
|-----------|------|----------------|
| ceo-income | `skills/ceo/SKILL.md` | Lead pipeline orchestration, model fleet routing |
| cfo-income | `skills/cfo/SKILL.md` | Treasury, runway, profit/loss tracking |
| cmo-income | `skills/cmo/SKILL.md` | Demand generation, outbound marketing, funnel tracking |
| cto-income | `skills/cto/SKILL.md` | Infrastructure, code review, FETCHER management |

### Operating Skills

| Skill Key | Path | Quick Use Case |
|-----------|------|----------------|
| fetcher | `skills/fetcher/SKILL.md` | Scan Reddit/Upwork/Fiverr for qualified leads |
| shared-rules | `skills/shared/SKILL.md` | Hard rules embedded in every agent |

### Tool Skills

| Tool | Path | Quick Use Case |
|------|------|----------------|
| cost-tracker | `skills/cfo/tools/cost-tracker/SKILL.md` | Pull Square revenue + API spend for P&L |
| buyer-outreach | `skills/cmo/tools/buyer-outreach/SKILL.md` | Draft personalized outbound messages |
| code-review | `skills/cto/tools/code-review/SKILL.md` | Review PRs for typecheck, tests, wall check |
| lead-scanner | `skills/ceo/tools/lead-scanner/SKILL.md` | Trigger FETCHER scans and surface leads |
| model-router | `skills/ceo/tools/model-router/SKILL.md` | Route tasks to appropriate models |
| fetcher-trigger | `skills/ceo/tools/fetcher-trigger/SKILL.md` | Schedule/manual FETCHER scans |

## Heartbeat Skills

| Agent | Schedule | Path |
|-------|----------|------|
| CEO | Every 5 minutes | `skills/ceo/heartbeat/SKILL.md` |
| CFO | Every 60 minutes | `skills/cfo/heartbeat/SKILL.md` |
| CMO | Every 120 minutes | `skills/cmo/heartbeat/SKILL.md` |
| CTO | Every 30 minutes | `skills/cto/heartbeat/SKILL.md` |
| FETCHER | Every 5 minutes | `skills/fetcher/heartbeat/SKILL.md` |

## Soul Files

| Agent | Path |
|-------|------|
| CEO | `skills/ceo/SOL.md` |
| CFO | `skills/cfo/SOL.md` |
| CMO | `skills/cmo/SOL.md` |
| CTO | `skills/cto/SOL.md` |
| FETCHER | `skills/fetcher/SOL.md` |

## Agent Configs

| Agent | Path |
|-------|------|
| CEO | `skills/ceo/AGENT.md` |
| CFO | `skills/cfo/AGENT.md` |
| CMO | `skills/cmo/AGENT.md` |
| CTO | `skills/cto/AGENT.md` |
| FETCHER | `skills/fetcher/AGENT.md` |

## Usage

When agents need to reference skills in prompts or documentation, point to this skills.md index instead of embedding large skill descriptions. This reduces context window waste and ensures skill references are resolvable.

**Example reference:**
```
For cost tracking, see skills/cfo/tools/cost-tracker/SKILL.md
```

## File Locations Summary

- **Skills index:** `skills/skills.md` (this file)
- **Meta skills:** `skills/self-improving-system/SKILL.md`
- **Executive skills:** `skills/{ceo,cfo,cmo,cto}/SKILL.md`
- **Operating skills:** `skills/{fetcher,shared}/SKILL.md`
- **Tool skills:** `skills/{agent}/tools/{tool}/SKILL.md`
- **Heartbeat skills:** `skills/{agent}/heartbeat/SKILL.md`
- **Agent configs:** `skills/{agent}/AGENT.md`
- **Soul files:** `skills/{agent}/SOL.md`