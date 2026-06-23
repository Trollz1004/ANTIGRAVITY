# ANTIGRAVITY Mission Control ChatGPT App Design

## Decision

Build a local, dependency-light ChatGPT App scaffold under `apps/antigravity-mission-control-app`.

## Rationale

Josh wants OpenAI in the mission loop permanently without replacing the verified Codex Desktop lane. The safest first step is a local app that gives ChatGPT/Hermes stable mission context and draft tools, but cannot mutate the repo, touch secrets, deploy, merge, or post live.

## Scope

- Read current safe repo docs and placeholder-only env templates.
- Show canonical root doctrine: `c:\antigravity` and `/mnt/c/antigravity`.
- Draft Codex execution prompts.
- Draft Slack/Hermes handoffs.
- Provide a widget UI and manifest-style endpoint for later Apps SDK wiring.

## Explicit Non-Scope

- No wrapper-Codex path.
- No populated env reads.
- No social automation.
- No payment rail changes.
- No deployment tools.
- No branch merge/delete tools.
- No Product structure/membership record/fundraising surface.

## Verification

- Node smoke tests for safe source handling and prompt boundaries.
- Server `--check` mode.
- Secret-pattern scan over new app files before PR.
