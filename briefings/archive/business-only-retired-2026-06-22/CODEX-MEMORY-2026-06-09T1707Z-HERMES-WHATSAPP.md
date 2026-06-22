# Codex Memory - Hermes WhatsApp Continuity - 2026-06-09T1707Z

## Purpose

This is a sanitized continuity note for Codex, Hermes, and Paperweight recovery across chats.

Use this file when a future Codex/Hermes session needs a timestamped, repo-local memory anchor without relying on private chat logs, raw Hermes state dumps, personal phone numbers, or secrets.

## Source

Josh pasted a Hermes WhatsApp self-chat summary into Codex on 2026-06-09. The raw chat is not copied here. This note preserves only safe operational facts and follow-up decisions.

## Canonical Repo Rule

- Windows repo root: `c:\antigravity`
- WSL repo root: `/mnt/c/antigravity`
- GitHub repo: `Trollz1004/ANTIGRAVITY`
- Do not introduce new root spellings such as `C:\Antigravity`, `C:\ANTIGRAVITY`, or `/mnt/c/Antigravity` in new Hermes/Paperweight tasks.
- If Windows tooling records an uppercase drive letter as `C:\antigravity`, treat it as the same filesystem location but normalize new doctrine and prompts to `c:\antigravity`.

## Repo State Captured From Current Codex Session

- Branch created for this continuity work: `claude/hermes-codex-memory`
- Base branch: `origin/main`
- Current remote `origin/main` commit observed locally: `b850e5a1`
- Working tree had many unrelated untracked artifacts before this note was created. Future agents should stage only scoped files.

## Hermes Summary Preserved Safely

The pasted Hermes summary reported:

- Most recent pushed repo: `Trollz1004/ANTIGRAVITY`
- Latest remote commit in that summary: `b850e5a`
- Recent pushed work included role-based agent briefs, opencode multi-provider config, live-agent prompt files, store/platform work, SupportClaw chat bridge, and CI/ops repair tracks.
- Hermes dashboard, gateway, and WhatsApp bridge were reported as running.
- No 24/7 wheel process was reported as actively running.
- A Paperweight board named `antigravity` was reported with 16 tasks: 0 running, 0 ready, 0 scheduled, 6 todo, 7 blocked, and 3 done.

Treat the board counts as Hermes-reported, not independently verified by this file. The local `AppData\Local\hermes\kanban.db` visible to Codex had zero tasks during this pass, so the active board may live in another runtime, profile, or remote Hermes process.

## Main Blocker To Preserve

The Hermes summary identified a workspace path bug blocking Paperweight child tasks:

- Bad dispatcher path form: `c:\antigravity`
- Preferred WSL dispatcher path form: `/mnt/c/antigravity`

Operational rule:

- Use `c:\antigravity` for Windows shell, Windows services, and repo doctrine that explicitly names the Windows root.
- Use `/mnt/c/antigravity` for WSL dispatchers, cron jobs, Linux subprocesses, and Hermes/Paperweight workspace paths executed inside WSL.
- Never "fix" this by changing the canonical repo root to uppercase.

## Memory Strategy

Use this priority order for continuity:

1. Repo-tracked timestamped briefings under `c:\antigravity\briefings\`.
2. Local Codex ad-hoc memory notes under `C:\Users\joshl\.codex\memories\extensions\ad_hoc\notes\`.
3. Existing Paperweight Daily Memory / Notion mirror only when already configured and accessible.
4. Raw Hermes session logs only as a last resort, and only after sanitizing secrets and personal identifiers.

Do not add Supabase, Notion, Graphify, or another memory backend unless Josh explicitly approves the external dependency and any required credentials are handled as environment variable names only.

## Safety Rules

- Do not copy private WhatsApp numbers into repo files.
- Do not copy raw Hermes chat logs into repo files.
- Do not print or store secrets.
- Do not create populated `.env` files.
- Do not resurrect DAO/token launch plans or restricted public-impact claims from old material.
- Do not stage unrelated untracked artifacts when committing memory updates.

## Next Actions For Future Agents

- Verify live Hermes/Paperweight board state before editing tasks.
- If a WSL dispatcher task is blocked on `workspace_path`, normalize that task's WSL workspace path to `/mnt/c/antigravity`.
- Keep Windows-facing docs and launchers aligned to `c:\antigravity`.
- Prefer small, reviewable commits from clean branches.
