# Legal-Safe Node Automations

Updated: 2026-03-07

## Operating Rule

CodeX nodes do not live-post to third-party social networks.

The nodes are allowed to:
- generate draft packs
- generate handoff queues
- generate owned-site content queues
- generate revenue support packs
- generate compliance, drift, and audit reports

The nodes are not allowed to:
- auto-post to X
- auto-post to Facebook
- auto-post to Reddit
- auto-post to LinkedIn
- auto-post to any other third-party social platform from the legacy browser daemon

## Human-Gated Ownership

- X: Perplexity with Josh supervising
- Facebook: Perplexity with Josh supervising
- Reddit: Devvit, Opus, or Perplexity
- LinkedIn: draft-only until a separately reviewed official API path is approved

## Safe Node Profiles

### 9020

Role: content factory

Installed task:
- `CodeX-9020-Safe-Drafts`

Schedule:
- at logon
- 06:15
- 12:15
- 18:15

What it does:
- runs `scripts/Run-Safe-NodeAutomation.ps1 -Profile 9020-content`
- writes draft packs and handoff queues to `CodeX/state/marketing`
- does not open browsers or publish directly

Automated:
- Perplexity handoff drafts for X and Facebook
- Reddit / Devvit handoff prompts
- LinkedIn draft copy
- owned-content queue refresh
- node automation matrix refresh

Not automated:
- posting to any social platform
- community replies, comments, follows, DMs, or engagement loops
- browser logins or browser-based growth automation

### T5500

Role: compliance and revenue support

Installed tasks:
- `CodeX-T5500-Safe-Marketing-Audit`
- `CodeX-T5500-Revenue-Pack`

Schedule:
- audit: at logon, 07:00, 13:00, 19:00
- revenue pack: at logon, 08:30

What they do:
- publish the latest policy audit and queue summary
- publish the public-copy policy audit
- build the deterministic OnlineRecycle revenue pack
- keep outputs local under `CodeX/state/marketing` or `data/local/onlinerecycle-worker`

Automated:
- safe automation audit
- public-copy policy scan for banned donation-style wording and stale payment/copy drift
- e-waste intake live-ok audit
- node automation matrix refresh
- OnlineRecycle marketing pack
- OnlineRecycle response templates
- OnlineRecycle 7-day cashflow checklist
- eBay-ready batch and HTML export

Not automated:
- live social posting
- inbox replies or outreach sends
- eBay publish clicks
- pricing or inventory changes without a human decision

### Sabretooth

Role: control plane

Optional task:
- `CodeX-SABRETOOTH-Safe-Control`

Schedule:
- at logon
- 09:00

What it does:
- refreshes the control-plane summary pack for review
- refreshes the public-copy policy audit
- refreshes the node automation matrix

Automated:
- control-pack refresh
- public-copy policy scan
- node/platform matrix refresh
- handoff-file refresh for the human-gated platforms

Not automated:
- live posting
- browser engagement loops
- production copy changes or dashboard edits by itself

## Compatibility Shims

These files remain in place only so old shortcuts and tasks fail safe:
- `scripts/social-engine-24x7.py`
- `scripts/daemon-start.py`
- `scripts/daemon-login.py`
- `scripts/social-engine-boot.bat`
- `scripts/social-engine-login.bat`
- `scripts/opus-marketing-watchdog.ps1`
- `scripts/register-watchdog-task.ps1`

They no longer represent an approved live-posting path.

## Audit Standard

- `public-copy-policy-audit-latest.md` is scoped to public-facing or generated customer copy only
- internal scripts, internal guidance, and the audit's own output are intentionally excluded
- the preferred steady state is `FINDINGS=0`
- any non-zero finding should be treated as drift to review before expanding automation

## Install

Run on each node locally:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\install-safe-node-automation-tasks.ps1 -NodeProfile 9020
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\install-safe-node-automation-tasks.ps1 -NodeProfile t5500
pwsh -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\install-safe-node-automation-tasks.ps1 -NodeProfile sabretooth
```

## Outputs

Primary output directory:
- `CodeX/state/marketing`

Expected files:
- `safe-node-marketing-pack-latest.md`
- `safe-automation-audit-latest.md`
- `public-copy-policy-audit-latest.md`
- `node-automation-matrix-latest.md`
- `perplexity-handoff-latest.md`
- `reddit-devvit-handoff-latest.md`
- `linkedin-drafts-latest.md`
- `owned-content-queue-latest.md`
- `safe-node-marketing-manifest-latest.json`
