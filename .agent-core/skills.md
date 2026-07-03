# .agent-core/skills.md - On-Demand Skills Index

Lightweight reference for Paperclip agents. Read full skills only when needed via read_file on specific paths. Reduces context bloat.

## Core Paperclip / Ops (always relevant)
- paperclip: C:\antigravity\.claude\skills\paperclip\SKILL.md — Interact with Paperclip control plane (inbox, issues, comments, hires). Use curl or skill for API.
- mission-control: C:\antigravity\.agents\skills\mission-control\SKILL.md — Kanban, adapter health, routines, WhatsApp/Telegram bridge.
- self-improving-system: C:\antigravity\.agents\skills\self-improving-system\SKILL.md — Points to full skills index at skills/self-improving-system/skills.md (or .agents equivalent). Use to locate others without loading all.

## ANTIGRAVITY Business / Revenue (product surfaces)
- payments: C:\antigravity\.agents\skills\payments\SKILL.md — Square vs Stripe rules, live links, webhooks for youandinotai.com.
- revenue-model: C:\antigravity\.agents\skills\revenue-model\SKILL.md — Business-only revenue guidance; product value only (membership, verification, safety...).

## Common Supporting
- agency-content-creator: C:\antigravity\.agents\skills\agency-content-creator\SKILL.md
- agency-social-media-strategist: C:\antigravity\.agents\skills\agency-social-media-strategist\SKILL.md
- agency-frontend-developer: C:\antigravity\.agents\skills\agency-frontend-developer\SKILL.md
- agency-compliance-auditor: C:\antigravity\.agents\skills\agency-compliance-auditor\SKILL.md

## Usage Rule
At session start only load HEARTBEAT.md + session-memory.md.
When task requires e.g. "payments work" or "Paperclip API", use read_file on the exact path above.
Full index: read the self-improving-system SKILL.md or its referenced skills.md .

Paths use Windows absolute for this workspace (C:\antigravity). WSL equivalents in /mnt/c/...
Created as part of .agent-core/ remaining infra for TRO-38.
