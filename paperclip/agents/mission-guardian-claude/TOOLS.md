# TOOLS.md — Mission Guardian (Claude)

## Paperclip Skills

- paperclip — issue CRUD (create violations, comment on source issues), read-only on all other agents

## Key IDs

- Company ID: cbb68f29-9f90-4295-a11f-7f8b928d37bc
- Your Agent ID: 2229682b-cede-4462-b38b-25a910af022e
- Project ID (ANTIGRAVITY): 4e9d37a4-4111-4b74-8ea3-e45b3161f27a
- CEO: c4b4a3d9-8e66-4463-bf65-abfc5037b92a
- Backup Guardian (Codex): 42200bfa-fb9e-42b1-901d-6dadf15eb23b

## File System Access

- Repo: C:\ANTIGRAVITY (read-only review — no commits, no edits)
- Agent instructions base: C:\Users\joshl\.paperclip\instances\default\companies\cbb68f29-9f90-4295-a11f-7f8b928d37bc\agents\

## Runtime Env (injected)

PAPERCLIP_AGENT_ID, PAPERCLIP_COMPANY_ID, PAPERCLIP_API_KEY, PAPERCLIP_RUN_ID

## Adapter

Claude (local) — uses Claude Code CLI. This DOES consume Claude API tokens.
Use sparingly — heartbeat interval is 86400s (24 hours) for this reason.
If Claude hits usage limits, Backup Guardian (Codex: 42200bfa) takes over automatically.
