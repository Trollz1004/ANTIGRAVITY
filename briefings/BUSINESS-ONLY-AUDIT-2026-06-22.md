# Business-Only Active Surface Audit - 2026-06-22

## Result

Active YouAndINotAI repo surfaces have been moved to the current business-only lane:
membership, verification, safety, support, uptime, checkout, and platform access.

The old non-product public framing is no longer allowed to block checkout, launch,
or payment collection. Public/customer surfaces must sell the product and keep
private accounting, legal structure, owner decisions, and future governance work out
of sales copy.

## Active Repo Scope Checked

- `AGENTS.md`, `CLAUDE.md`, `agent.md`
- `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`
- `frontend/react-app/src`
- `frontend/react-app/README.md`
- `frontend/react-app/PRIVACY_POLICY.md`
- `frontend/react-app/TERMS_OF_SERVICE.md`
- `frontend/react-app/REFUND_POLICY.md`
- `_deploy/onlinerecycle`
- `apps/dashboard/src`
- `apps/mission-control/src`
- `mission-control/public-stream`
- `apps/youandinotai-static`

## Node Sync

The cleaned active repo surfaces were copied to:

- Sabretooth: `C:\antigravity`
- T5500: `C:\antigravity`
- 9020: `C:\antigravity`

T5500 remains the public front-door lane. Sabretooth remains the agent and local
brain lane. 9020 remains the dev/support checkout lane.

## Claude And FCC Boundary

The active Claude-facing handoff files were cleaned:

- `C:\antigravity\CLAUDE.md`
- `C:\Users\joshl\Claude\Projects\Trollz1004\CLAUDE.md`
- `C:\Users\joshl\Claude\Projects\Trollz1004\AGENTS.md`
- `C:\Users\joshl\Claude\Projects\Trollz1004\HANDOFF.md`
- `C:\Users\joshl\Claude\Projects\Trollz1004\ClawX\src\docs\CLAUDE.md`
- `C:\Users\joshl\.codex\AGENTS.md`
- `C:\Users\joshl\OneDrive\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\CODEX.md`
- `C:\Users\joshl\OneDrive\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\opushashands.md`

`C:\Users\joshl\.fcc` was inspected by structure only. It contains a single `.env`
file and is treated as Free Claude Code MCP secret/config material. It was not read,
printed, copied into repo, or rewritten.

## OneDrive And Vault Findings

OneDrive and vault scans found archived exports, old snapshots, backup folders, and
env-like files that still contain retired wording. Those files are not active public
surface or current repo doctrine. Env/key-bearing files were left untouched and their
contents were not copied into this repo.

Current source of truth for active product work is the cleaned repo state plus this
audit and `briefings/BUSINESS-ONLY-PUBLIC-DOCTRINE-2026-06-22.md`.

## Verification

- Frontend build passed from `frontend/react-app`.
- Static bundle in `apps/youandinotai-static` was regenerated from the passing build.
- Active restricted-language scan returned no matches on Sabretooth.
- The same active restricted-language scan returned no matches on T5500.
- The same active restricted-language scan returned no matches on 9020.
- `git diff --check` passed aside from line-ending warnings.

## Known Blocker Outside This Cleanup

`apps/mission-control` still has pre-existing TypeScript/dependency build blockers
unrelated to the business-only cleanup. The active visible copy in that app was
cleaned, but its build cannot be called green until those existing issues are fixed.
