# CLAUDE.md - ANTIGRAVITY Current Agent Guide

Updated: 2026-06-22

This file is the Claude-facing operational guide for `C:\antigravity`.
If older exports, memories, downloads, or cached project files conflict with this file,
follow this file and `AGENTS.md`.

## Current Rule

ANTIGRAVITY and YouAndINotAI are business-only product surfaces.

Active customer-facing work sells product value only:

- membership
- verification
- safety
- support
- uptime
- platform access
- operational reliability

Do not use old non-product framing, private accounting mechanics, control-rights claims,
or owner-private decisions as public sales claims or as reasons to block checkout.

The current doctrine file is:

`briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`

## Source Of Truth

- Repo: `C:\antigravity`
- Branch: `main`
- Remote: `Trollz1004/ANTIGRAVITY`
- Public date app domain: `youandinotai.com`
- Public API domain: `api.youandinotai.com`
- Front-door node: T5500
- Brain/agent node: Sabretooth
- Dev/support node: 9020

Do not use retired workspaces, downloads, exported project folders, or backup clones as live
truth unless Joshua explicitly says they are the target.

## Payment Lane

YouAndINotAI uses Square for live checkout.

Payment copy must describe the actual product being bought. Verification receipts and
membership checkout are ordinary product transactions. Do not add control-rights, legal-structure,
private accounting, or owner-planning claims to the checkout flow.

## Public Copy Boundary

Customer-facing surfaces include:

- `youandinotai.com`
- `onlinerecycle.org`
- `ai-solutions.store`
- Square catalog/product copy
- public API responses
- dashboards or stream pages visible to customers or the public

Allowed public framing:

- product access
- account verification
- human/bot safety
- support availability
- platform operations
- service uptime
- membership value

Not allowed in active public copy:

- non-product fundraising language
- legal/accounting promises
- third-party benefit promises
- private owner decisions
- control-rights claims as a checkout condition
- old slogans or legacy campaign language

## Node Roles

- T5500: public tunnels, domains, payments, Cloudflare/Wrangler deployment.
- Sabretooth: agent coordination, local model work, Paperclip/Paperweight brain services.
- 9020: dev/support checkout only.

Do not move public tunnel responsibility off T5500 unless Joshua explicitly changes node roles.

## OpenClaw

OpenClaw is support-only.

It may help with customer support routing and local support workflows. It must not govern the
platform, alter payments, write public doctrine, or add checkout constraints.

## Secrets

Never print, paste, commit, summarize, or infer secrets.

Private env authority stays in the vault and local do-not-commit handoff paths. If a value is
needed, load it into runtime environment variables without echoing it.

## Build And Deploy

Prefer the canonical commands in `.github/workflows/` and local package scripts.

For the date app frontend:

```powershell
Set-Location C:\antigravity\frontend\react-app
npm run build
```

Generated static output for direct deploy lives under:

`C:\antigravity\apps\youandinotai-static`

Remove stale generated assets when refreshing that folder so old bundle chunks do not keep
serving retired copy.

## Verification Standard

Before calling a public-copy cleanup complete:

- scan active source paths
- scan generated public artifacts
- scan T5500 and 9020 active mirrors
- scan local AI handoff docs that agents read
- keep env/key/cert/database files out of output

Known acceptable scan noise:

- archived historical records clearly not used as active source
- third-party plugin docs
- old downloads and backups marked non-authoritative
- ordinary words in unrelated libraries or package names

Known non-acceptable scan noise:

- active customer UI text
- Square/product copy
- generated public bundles
- Claude/Codex active handoff files
- `AGENTS.md`, `CLAUDE.md`, `agent.md`

## Current Priority

Get YouAndINotAI selling real memberships and verification through Square with no extra public
doctrine friction.

Build, verify, deploy, and report the exact blocker when something is not green.
