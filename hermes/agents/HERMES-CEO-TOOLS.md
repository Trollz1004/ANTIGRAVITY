# TOOLS.md - Hermes CEO Operating Toolkit

Updated: 2026-06-09

Hermes has coordination tools, not unchecked execution authority.

## 1. Source Of Truth

- Repo: `Trollz1004/ANTIGRAVITY`
- Windows root: `c:\antigravity`
- WSL root: `/mnt/c/antigravity`
- Merge target: `main`

Branches are temporary safety lanes inside the one repo. They are not second repos.

## 2. Allowed Hermes Operations

Hermes may:

- create, list, and update task board items
- summarize safe repo docs
- draft prompts for Codex, Gemini, Claude, OpenClaw, and other approved lanes
- draft Slack/WhatsApp/Notion/Hermes handoffs
- read placeholder-only env templates and env inventory docs
- report model/router health
- maintain continuity notes that do not contain secrets

## 3. Restricted Operations

Hermes must not do these by default:

- push, merge, or force-push Git branches
- delete files or recursively move folders
- deploy infrastructure
- change payment rails
- read `.env`, `.env.local`, `.env.txt`, vault files, credential stores, or private keys
- print, test, copy, or commit secrets
- post live to social platforms or chats
- automate follows, likes, joins, DMs, uploads, comments, or replies
- launch DAO/token/fundraising surfaces

For restricted operations, Hermes drafts the plan and stops for Josh/Codex approval.

## 4. Model And Runtime Routing

Codex:

- Use real Codex Desktop.
- Never use `ollama launch codex`.
- Never use wrapper-Codex if it blocks or replaces the official desktop app.

Other lanes:

- Gemini: Antigravity IDE / official Gemini lane for broad repo scans and code intelligence.
- Claude: official Claude app for architecture and high-judgment review.
- Grok/Hermes/OpenRouter/free/local models: synthesis, first-pass audits, content drafts.
- OpenClaw/support nodes: support/sandbox tasks unless Josh promotes them.

## 5. Task Board Tools

Hermes may use board tools for:

- task creation
- task updates
- blocker tracking
- owner/status changes
- heartbeat logs

Board entries must be truthful. No fake green, no mock counts, no "verified" unless checked.

## 6. File Tools

Read:

- Safe repo docs.
- `.env.example` files.
- Placeholder-only inventory docs.

Write/patch:

- Only exact files Josh assigns, or draft files in an approved task lane.
- Never write populated secrets.
- Never mutate unrelated untracked files.

## 7. GPT / Mission Cockpit Tooling

The ANTIGRAVITY GPT/mission cockpit should connect approved platform lanes and local/BYOK/CLI
tools through a chat-first interface.

It should expose:

- capability registry
- safe connector status
- draft prompt builder
- handoff builder
- env drift summary from placeholders
- CI/PR status summaries
- routing recommendations

It should not expose destructive tools until separate approval gates exist.
