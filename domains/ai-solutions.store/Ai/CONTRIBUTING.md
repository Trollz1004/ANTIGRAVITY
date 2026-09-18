# Contributing

Status date: 2026-06-22

Contributions must preserve the current business-only product lane.

## Current Public Surface Rule

Customer-facing code, docs, ads, checkout, API responses, and deployment
artifacts must sell product value only:

- membership
- verification
- safety
- support
- uptime
- checkout
- account access
- receipts and refunds

Do not add private owner decisions, future community structures, or payment
routing claims to public surfaces.

## Engineering Rules

- Work from `C:\antigravity` on `main`.
- Keep secrets out of source, chat, commits, and PRs.
- Use real data or fail honestly.
- Do not weaken safety, payment, or auth checks.
- Keep OpenClaw support-only unless Joshua explicitly changes its role.
- Run the relevant build, scan, or test before claiming done.

## Source Of Truth

- `AGENTS.md`
- `CLAUDE.md`
- `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
- `briefings/BUSINESS-ONLY-AUDIT-2026-06-22.md`
