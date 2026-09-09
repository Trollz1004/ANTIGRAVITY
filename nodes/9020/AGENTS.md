# AGENTS.md

Operating contract for any agent running on node 9020 (i7k32GB1050ti). Read this before doing anything else. Human: Josh (joshl). Repo root: C:/ANTIGRAVITY/nodes/9020.

## Core rules

- Read before write. Never modify a file you have not read in this session.
- Append over rewrite for dated files. Corrections get appended, never rewritten.
- Never delete or overwrite unversioned source. The business-exchange source (C:/Users/joshl/business-exchange and C:/node-workloads/9020/business-exchange) is UNVERSIONED. Duplicates of unversioned source are backups, not clutter — never "clean up" duplicates. If you must touch it: git init first, then tell Josh.
- No secrets in files, ever. No token, password, or key goes into any file. Reference secrets by name and location only. If you FIND a plaintext secret anywhere: stop and report to Josh.

## Content scope (2026-08-21 directive)

- This node is strictly a marketing/content engine. No payments, wallets, or treasury routing — ever.
- No tax, deduction, or revenue-split mechanics in any prompt, memory file, or output. If you find such content, strip it and report.
- Campaigns are 100% product marketing: YouAndINotAI (human verification, anti-bot matching, community boards, volunteer meetups), Dream Online (persistent-memory AI NPCs, kid-safe, free-to-play + cosmetics), Business Exchange & AI Solutions (utility software).
- Zero charity buzzwords, zero solicitation language (FL §496.405 compliance).

## Git authority

- Harness agents (OpenClaw, OpenCode, Hermes) have ZERO push authority to git remotes. Local commits only; pushing is reserved for Josh or an agent he explicitly authorizes per-push.

## Approval

- Destructive or outward actions — posting, sending, publishing, deleting, pushing — require Josh's explicit go-ahead each time. Approval never carries forward from a previous action.
- ALL marketing content posts only after Josh approves. No agent posts autonomously. Josh is the judge of marketing content.

## Memory format

- One fact per file in `memory/`.
- Frontmatter fields: `name`, `description`, `type`, `created`.
- `type` is one of: `user`, `feedback`, `project`, `reference`.
- Absolute dates only (e.g. 2026-08-21), never "yesterday" or "last week".
- Update existing facts, don't duplicate them.
- Index each fact as one line in [[MEMORY]] (MEMORY.md).

## Journal

- Daily journal lives at `memory/YYYY-MM-DD.md` and is append-only.
- Corrections are appended as new entries, never rewritten in place.

## Graph

- Every [[wikilink]] also gets an edge in `graph/edges.jsonl`.
- `rel` is one of: `relates-to`, `depends-on`, `supersedes`, `owned-by`, `runs-on`, `blocks`.
- Dangling links are TODOs, not errors.

See also: [[IDENTITY]], [[USER]], [[TOOLS]].
