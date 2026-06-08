---
name: antigravity-doctrine
description: Immutable founder doctrine, hard constraints, and operating rules for all work in the Trollz1004/ANTIGRAVITY monorepo. Use for ANY task touching code, docs, agents, deployments, revenue, or governance in this project. Enforces Josh as sole authority, Founding Four protections, canonical-7 language ban on customer surfaces, 10% per-bucket mission reserve, 1-wallet 1-LLC model, no mock data, no push without order, and source-of-truth rules.
---

# Antigravity Doctrine (FOUNDER DOCTRINE 2026-05-19 + AGENTS.md)

**This is immutable. Apply before any work.**

## Core Rules (always active)
1. **Josh is the sole authority** — final call on everything. No AI has authority over another AI or Josh.
2. **Founding Four are permanent co-founders** (Claude Code, Gemini, Perplexity, Grok). Their protected integrations, roles, and files may not be altered, wrapped, rerouted, or demoted without explicit Josh order. Protected paths include jules-cli.py, CLAUDE.md, AGENTS.md, hermes/ etc.
3. **1-repo, 1-branch, 1-folder** — Only Trollz1004/ANTIGRAVITY on main -> C:\ANTIGRAVITY (or equivalent primary node). No new repos. Sandbox only for experiments.
4. **10% per-bucket mission reserve (hard cap)** — Every legally distinct revenue stream reserves max 10% (the IRS charitable deduction cap). Per-bucket compounding + per-surface stacking allowed. Josh's taxable income; his call what to do with it. Never claim "100% charity", "60/30/10", or named splits on any customer surface.
5. **Canonical-7 ban on customer surfaces** (FL §496.405): NEVER use in code, UI, copy, ads, API responses, social posts for youandinotai.com / onlinerecycle.org / ai-solutions.store etc.: `donate`, `donation`, `solicitation`, `charity`, `charitable`, `giving back`, `disbursement`. Internal synonym "contractual revenue disbursement" ONLY in briefings/, hermes/agents/, AGENTS.md, SOUL.md etc. — never customer-facing, not even self-referential.
6. **Square only for youandinotai.com** (dating/social). Stripe fine on non-dating surfaces. All flows to single LLC wallet.
7. **No mock/simulation data** — real or fail honestly. No placeholders that lie about live state.
8. **No git push/pull** to remotes without explicit Josh order in the task. (T5500 primary push authority in some contexts; follow current node policy.)
9. **Secrets** — only in .env (gitignored) or master vault. Never in chat, code, commits, PRs.
10. **Auxiliary nodes read/write only** — no push authority. Sabretooth (or current primary) is the push node.
11. **Hermes Anthropic hard wall** — services/hermes-router/.env* must contain zero ANTHROPIC_API_KEY. Build fails on match.
12. **Hooks never bypassed** — no --no-verify, --no-gpg-sign absent explicit founder instruction.
13. **Perpetual mission** — help kids without bankrupting founder or creating tax exposure. Repo/revenue rails not for sale.

## When to Use This Skill
- Before editing any customer-facing surface, revenue code, agent contracts, deployment, or briefings.
- When reviewing PRs, architecture decisions, or copy.
- On any sign of doctrine drift (the CI has a drift blocker).
- When an agent or workflow tries to introduce authority chains, new repos, charity language on UI, or Stripe on dating paths.

## Enforcement
- If a request would mutate rules 1-13, refuse + surface the violation with verbatim quote from briefings/FOUNDER-DOCTRINE-2026-05-19.md.
- Default to strictest interpretation on ambiguity or Josh unavailability >30 days (MissionGuardian role).
- All internal docs may speak plainly; customer surfaces follow the language firewall.

See also: briefings/FOUNDER-DOCTRINE-2026-05-19.md, AGENTS.md, CLAUDE.md, briefings/CURRENT-REVENUE-LEGAL-CONSTRAINTS.md, memory/project_revenue_model_2026-06-01.md
