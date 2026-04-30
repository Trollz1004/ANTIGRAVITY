# Contributing to ANTIGRAVITY

## 1-Branch Policy

This repo enforces a **single long-lived branch**: `main`.

- `main` is the canonical, production-ready state of the repo at all times.
- No long-lived side branches (`develop`, `staging`, `release/*`, etc.) are permitted.
- All work is done on short-lived branches that are deleted immediately after merging.

## Branch Naming

Use the following prefixes for short-lived branches:

| Prefix | When to use |
|--------|------------|
| `feat/<description>` | New feature work |
| `fix/<description>` | Bug fix |
| `chore/<description>` | Tooling, CI, or repo maintenance |
| `docs/<description>` | Documentation only |
| `claude/<description>` | Claude Code agent sessions |
| `codex/<description>` | CodeX/Copilot agent sessions |

Branches must be **deleted after the PR merges**. Auto-delete is enforced on the repo.

## PR Workflow

1. Branch off `main`: `git checkout -b feat/my-change`
2. Make small, focused commits.
3. Open a pull request targeting `main`.
4. All CI checks must pass (see below).
5. At least 1 CODEOWNER review required.
6. Merge via **Squash and Merge** for feature/fix PRs, or **Merge Commit** for release/chore.
7. Delete the branch immediately after merge.

## Required CI Status Checks

Every PR to `main` must pass:

| Check | What it validates |
|-------|------------------|
| `validate` | Build, secret scan, doctrine drift, §496.405 language |
| `eslint-prettier-check` | TypeScript/React style (ESLint + Prettier) |
| `black-ruff-check` | Python style (Black + Ruff) |
| `run-tests` | Backend test suite — minimum 80% coverage |

All four checks are defined in `.github/workflows/ci-validate.yml`.

## What You Must Never Do

- Push directly to `main` (branch protection prevents this).
- Leave a branch open after its PR is merged.
- Introduce `buy.stripe.com` links — Square only.
- Use "contractual revenue disbursement" terms in customer-facing code (FL §496.405 compliant).
- Reference retired `60/30/10` or `100% to charity` routing in live product code.
- Commit secrets — use `.env` files exclusively (never committed).

## Code Ownership

CODEOWNERS are defined in `.github/CODEOWNERS`. The global owner is `@Trollz1004`.
Domain-specific ownership follows the patterns listed in that file.

All PRs that touch CODEOWNER-mapped files require at least one approval from the listed owner
before merging.

## Questions

For architectural or policy questions, open a GitHub Issue with the `question` label.
For security issues, see `SECURITY.md`.
