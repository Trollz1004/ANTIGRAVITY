# CodeX Sabretooth Status

Date: 2026-03-03
Node: Sabretooth (this machine)
Owner: Joshua Coleman (joshlcoleman@gmail.com)
Merchant Center: ID 5580614122

## Scope and roles
- CodeX: OnlineRecycle.org operations (customer service, pickups/drop-offs, marketing, landing page)
- Opus (Claude Desktop): Crosslister dashboard aspects on Sabretooth; OpenClaw/Clawdbot control
- Opus on T5500: date app + social + charity volunteer platform (youandinotai.com)
- Drive isolation: CodeX = E: drive, KRAKKEN = C: drive

## OnlineRecycle operating facts
- Base ZIP: 32776 (Sorrento, FL)
- Pickup radius: up to 60 miles
- Drop-off: appointment only (address shared after scheduling)
- Storefronts: onlinerecycle.square.site and eBay store

## Current system state
- OpenClaw/Clawdbot target port: 9020 (Opus)
- CodeX workspace: E:\CodeX
- Repo: E:\ANTIGRAVITY
- Landing page source: E:\ANTIGRAVITY\onlinerecycle-landing
- Deploy target: E:\ANTIGRAVITY\_deploy\onlinerecycle
- Env vault: E:\CodeX\env\local.env
- Master instructions: E:\ANTIGRAVITY\PROMPT-CODEX-SABRETOOTH.md

## Recent updates
- Moved CodeX workspace to E: drive for isolation.
- Cloned ANTIGRAVITY repo to E:\ANTIGRAVITY.
- Updated OnlineRecycle landing page copy to emphasize pickup radius, appointment drop-off, and clear CTAs.
- Stored Merchant Center ID in CodeX env for later setup.

## Open items / next actions
- Read PROMPT-CODEX-SABRETOOTH.md and align all work to it.
- Build production intake forms and connect Square booking flow (no placeholders).
- Confirm auto-start services on reboot (avoid ports 9999/5173).
- Build posting calendar + intake form and connect to landing page.
- Verify Claude Desktop path used by OpusAssistant.bat.
