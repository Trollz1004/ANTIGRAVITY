# BRANCH_POLICY.md

v1.0.0 — 2026-07-07 — Branch rules for all agents.

## Main

`main` is the only long-lived branch.

## Agent Branches

Temporary agent work uses `ai/<agent>/<task-slug>`.

Examples:

- `ai/codex/governance-contracts`
- `ai/claude/api-health-fix`
- `ai/hermes/workspace-watchdog`

## Start Rule

Fetch latest `origin/main` before starting work. Branch from `origin/main` unless Josh gives a different base.

## Finish Rule

After Josh merges a PR, delete the temporary branch locally and remotely and remove any temporary worktree.

## Prohibited

- No abandoned AI branches.
- No force-push to `main`.
- No history rewrite on shared branches unless Josh explicitly gives that exact instruction.
