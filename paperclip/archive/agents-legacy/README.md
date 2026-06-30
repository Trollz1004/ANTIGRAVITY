# Legacy Paperclip Agent Prompts

These flat `.md` agent prompts are archived as of 2026-06-30.

## Why archived

They pre-date the business-only doctrine alignment and the canonical folder-based
Paperclip agent structure. They still contain outdated framing such as `#UNTILnoKIDinNEED`
and "kids' care" language that must not appear in customer-facing or public surfaces.

## Canonical agents

The current source of truth is under `paperclip/agents/`:

- `ceo/` — monorepo orchestrator (1 repo / 1 branch / 1 root folder)
- `cfo/` — payment-rail and treasury truth
- `cmo/` — business-only growth and public copy
- `cto/` — technical build and quality gate
- `mission-guardian/` — structural integrity across nodes
- `hermes/` — research and routing

Each canonical agent folder contains `AGENTS.md`, `HEARTBEAT.md`, and `TOOLS.md`.

## Do not use these legacy files as source of truth

If you need to revive a specific capability from a legacy prompt, port it into the
appropriate canonical agent folder and run it through the doctrine filter in
`docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md` before use.
