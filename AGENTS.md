# AGENTS.md - ANTIGRAVITY Current Operating Rules

This file is loaded at session start. Treat it as the current operating brief for
`C:\antigravity` unless Joshua gives a newer timestamped written directive.

## Current Business Rule - 2026-06-22

ANTIGRAVITY and YouAndINotAI are business-only product surfaces going forward.
Customer-facing work sells membership, verification, support, safety, uptime,
matching quality, account access, and platform value.

Do not use old public-benefit language, private accounting mechanics, treasury
math, control-rights claims, ownership-sale claims, or owner-private decisions as
copy, checkout gates, launch gates, agent prompts, or blocker logic.

Owner-private giving, tax handling, and LLC accounting are handled outside AI
product execution. AI work must not create public claims, compliance blockers, or
sales friction from those private decisions.

## Authority

Joshua Coleman is the sole human authority for this repo and its connected nodes.
Agents, tools, models, dashboards, and wrappers do not outrank Joshua or each
other. They execute assigned work, preserve evidence, and avoid hidden control
paths.

Codex is the execution lane for this thread: inspect, fix, verify, stage, commit,
push, and sync when Joshua assigns work. Do not leave finished work as local drift.

## Canonical Workspace

- Live repo: `C:\antigravity`
- Canonical branch: `origin/main`
- Product domain: `youandinotai.com`
- API domain: `api.youandinotai.com`
- Frontend host: Cloudflare Pages project `youandinotai`
- Backend target: T5500 self-host FastAPI stack
- Payment rail: Square production links and Square API only unless Joshua changes it
- Private env handoff: `C:\Users\joshl\OneDrive\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\JOSHUAS.ENV`
- Cloudflare/Wrangler env: `C:\Users\joshl\OneDrive\Personal Vault\ENV-AUTHORITY-20260608-082127\derived-platform-envs\runtime-misc.env`

Never print, commit, or copy populated secret values into repo files or chat.

## Node Roles

T5500 (`192.168.0.15`) is the public-front-door node for domains, tunnels,
payments, Wrangler, and the date-app backend.

Sabretooth (`192.168.0.8`) is the brain/operator node for Codex, local model
workloads, Paperclip-style agent coordination, and repo maintenance.

9020 (`192.168.0.5`) is the dev/operator checkout. It must not become the public
production endpoint unless Joshua explicitly changes the role map.

OpenClaw is support-only. It must use local/self-hosted inference for the live
support path and must not become a policy, treasury, or product-control layer.

## Shipping Rules

- Pull before editing when touching shared repo state.
- Fix drift directly when it blocks the assigned outcome.
- Build or test the exact surface you changed.
- If checks unrelated to the assigned outcome are red, record the exact blocker
  and keep moving on the assigned outcome.
- Keep public copy product-first and checkout-first.
- Remove stale launch blockers from prompts, docs, and agent files.
- Push completed founder-approved work to `origin/main`.
- Sync T5500 and 9020 after pushed changes when the edit affects node behavior or
  active AI handoff context.

## Public Copy Boundary

Allowed customer-facing themes:

- membership
- verification
- trust and safety
- support
- account recovery
- real profiles
- events and matching
- uptime and reliability
- pricing and checkout
- terms, privacy, refunds, and receipts

Disallowed on customer-facing surfaces:

- private owner giving or tax decisions
- accounting formulas
- ownership-sale, voting, or control promises
- public-benefit fundraising language
- investment-return language
- claims that receipt, membership, or verification creates control rights
- claims that checkout money is routed automatically to non-product purposes

## Repository Hygiene

Authoritative active context lives in:

- `AGENTS.md`
- `CLAUDE.md`
- `agent.md`
- `.claude/`
- `.codex/`
- `.agents/skills/`
- `skills/`
- `memory/`
- `briefings/` files that are not clearly archived or superseded
- product frontend/backend source
- active OneDrive handoff files explicitly named by Joshua

Historical, backup, cache, archive, downloaded, and session-log material is not
current operating truth unless Joshua points to it for recovery.

## Env And Secret Rules

- Do not read `.fcc\.env`.
- Do not print secret-bearing env files.
- Do not commit OneDrive vault files.
- Do not normalize placeholder secrets into active configs as if they are real.
- Record missing secrets as missing without exposing adjacent values.

## Completion Standard

A task is not complete until the current state proves it:

- repo status checked
- relevant build/test/scan run
- public URLs or local health checked when deployment/runtime was touched
- changed files reviewed
- commit pushed when repo state changed
- remote node checkouts synced when node guidance or runtime files changed

If completion is not proven, report the one current blocker and the next concrete
action.
