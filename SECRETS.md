# SECRETS.md — Credential Doctrine

How this repository handles credentials. Contributors and AI agents follow this without exception.

## Where keys live

| Purpose | Home |
|---|---|
| CI / GitHub Actions | **GitHub Secrets** (repo settings) — referenced as `${{ secrets.NAME }}`, never inlined |
| Runtime model access | **OmniRoute's encrypted connection store** — agents receive routed access, never raw provider keys |
| Local operator values | The operator's local vault, outside this repository |
| Anthropic / Claude | **CLI auth on subscription only.** No Anthropic API key exists in this stack, ever. |

## Never in the repository

No key, token, populated `.env`, or credential fragment is ever committed — in any file,
any branch, any commit message, any test fixture. Example files use empty values only.
History is treated the same as the worktree: exposure in an old commit is exposure.

## On exposure

Rotation plus judge-led history purge. Restriction is not the remedy.

## Trust model (owner's standing decision)

Credentials for trusted platforms are intentionally full-access and non-expiring.
Safety in this repository comes from keys never touching git — not from permission
locks that push automation into workarounds.
