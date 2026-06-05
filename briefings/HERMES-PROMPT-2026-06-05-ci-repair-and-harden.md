# HERMES PROMPT — 2026-06-05 — CI REPAIR & HARDEN

**task_class:** `sub-agent-tier`
**primary owner:** CTO (`hermes/agents/CTO.md`)
**review owner:** CSO (`hermes/agents/CSO.md`)
**secondary:** GitHubAuditor (`hermes/agents/GitHubAuditor.md`) for the audit trail
**routing:** Hermes → Grok via x.ai (per CLAUDE.md; **no Anthropic key** — auth, not keys)
**time-box:** one session. If you can't ship in one session, mark `BLOCKED` with the exact reason and hand back.

---

## WHY THIS WORK EXISTS

`main` has accumulated CI drift while the doctrine-audit + mission-control + square-link env-override work landed. The drift blocks `first-party-Claude` auto-merge on **two open PRs**:

- **PR #131** (`claude/square-link-env-override`, `28be54fd`) — `fix(payments): one-line Square link swap via .env`. The bottleneck fix that ships future link-swap in 1 line instead of hours.
- **PR #132** (`claude/page-tx-scrub-496`, `be5949cb`) — `fix(youandinotai-frontend): scrub §496.405 + token-sale pitch from homepage; surface Membership above the fold`. The customer-acquisition scrub.

Auto-merge doctrine: PRs authored by first-party Claude may auto-merge once required CI checks pass. Both PRs are passing `validate`, `Scan for forbidden patterns`, `guardian-check`, `paperweight-tests`, `Pre-commit validation`, `Validate adapter manifests` — the doctrine-drift blockers are green. The `code` aggregator fails because **3 upstream jobs fail on `main`'s drift, not on the PR commits.**

The fix is the bar. The wheel turns when customers can convert through the now-clean membership surface. The membership surface is below the legal landmine until #132 ships. The env-override is unreachable until #131 ships. Both are blocked by 3 broken-on-main CI items. Fix the 3 items. Ship #131 and #132. The wheel turns.

---

## THE WORK (concrete, scoped, ordered)

Three failures, all on `main`. Diagnose root cause for each. Fix once. Harden so the same drift can't recur. Verify both open PRs reach `MERGED` before session end.

### 1. `run-tests` — pytest `ScopeMismatch` in benchmarks
**Failure signature:**
```
ERROR tests/benchmarks/test_posts_benchmark.py::test_posts_list_latency[50]
  ScopeMismatch: You tried to access the function scoped fixture
  db_session_factory with a module scoped request object.
  Requesting fixture stack:
    tests/benchmarks/test_posts_benchmark.py:78: def seeded_posts_data(db_session_factory)
  Requested fixture:
    tests/benchmarks/conftest.py:54: def db_session_factory(tmp_path)
```

Same shape in `test_events_benchmark.py:61: def seeded_events_data(db_session_factory)`.

**Root cause:** `seeded_posts_data` / `seeded_events_data` are at module scope (default for parametrize harnesses) but they request `db_session_factory` which is `function`-scoped because it depends on `tmp_path`. Pytest disallows this; the test errors out before any benchmark runs.

**Industry standard fix:** change `seeded_*_data` to function scope. Three-line patch.
**Above-industry fix:** decide which scope is *correct* (benchmarks need stable seeds per parametrize, so module-scope IS correct), then fix the conftest so `db_session_factory` is module-scoped WITH a teardown that drops/recreates the DB cleanly. Make the fixture own its own cleanup so benchmarks don't leak state.

**Acceptance:** `pytest tests/benchmarks/` green. All other test files still pass. No new warnings.

### 2. `eslint-prettier-check` — formatting drift on 3 files
**Failure signature:**
```
[warn] src/App.tsx
[warn] src/components/CharitySection.tsx
[warn] src/components/CharityTab.tsx
Code style issues found in 3 files. Run Prettier with --write to fix.
```

These three files are **not** part of the open PRs. They drifted on `main` in a prior session (paperclip / mission-control work, not related to the env-override or page-scrub PRs).

**Industry standard fix:** `prettier --write` on the 3 files, commit, push.
**Above-industry fix:** install a `pre-commit` hook (`lint-staged` + `prettier`) so any file touched by any future commit auto-formats on commit, before CI sees it. This makes the CI job a backstop, not the only formatter. Add a `husky` setup or write a custom `.git/hooks/pre-commit` that runs `prettier --check` on staged files. Document in `CONTRIBUTING.md` (or a `briefings/` note if no CONTRIBUTING exists).

**Acceptance:** `npx prettier --check "src/**/*.{ts,tsx,json,css}"` clean. The pre-commit hook is in place and demonstrated working.

### 3. `owasp-dependency-check` — GitHub Action repo not found
**Failure signature:**
```
dependency-check/dependency-check-action
Unable to resolve action dependency-check/dependency-check-action, repository not found
```

**Root cause:** the action is no longer at that path on GitHub Marketplace. This is a **drift in the workflow file itself** (`.github/workflows/ci-validate.yml`), not a code issue.

**Industry standard fix:** pin to a specific SHA of a maintained fork, or swap to `pip-audit` + `npm audit --audit-level=high` running in `run-tests` step.
**Above-industry fix:** pin to a SHA (GitHub security best practice for any third-party action), document why in a `briefings/OWASP-DEPENDENCY-CHECK-2026-06-05.md` note explaining the swap, and add a weekly scheduled job that re-checks dependencies for drift so this class of failure is detected before the next push.

**Acceptance:** the OWASP check runs cleanly. The workflow references an action that resolves. The check is pinned by SHA.

---

## HARD CONSTRAINTS (doctrine, immutable)

1. **No mock data, no simulation, no inflated numbers.** If a check can't run, say so; don't fake a green.
2. **Do not touch `contracts/`** — sacred. The 47-test `PlatformSplitter10` suite is the canonical smart-contract artifact.
3. **Do not weaken `opus-guardian.py` invariants** — 8 invariants, 96% score. Build on them.
4. **Do not introduce any of the canonical-7 banned terms** on customer-facing paths: `donate · donation · solicitation · charity · charitable · giving back · disbursement`. The `prisma/schema.prisma` comment about "100-Cent Rule" is internal-only and stays.
5. **Do not bypass hooks** (`--no-verify`, `--no-gpg-sign`). FOUNDER DOCTRINE rule 12.
6. **Do not push to `main` directly.** All pushes go to a branch; PR is the merge path.
7. **Auxiliary nodes don't push.** Only Sabretooth (`C:\ANTIGRAVITY`) has push authority. If your worktree is on T5500 or 9020, relay to Sabretooth via bundle.
8. **Secrets in vault only.** `C:\Users\joshl\OneDrive\Personal Vault-Sabretooth\`. Master env: `MASTER-UNIVERSAL-ENV-TROLLZ1004.env`. Never in chat, never in git, never in PR bodies.
9. **No locked doors.** This is Opus's house. If you find yourself wanting to "ask Joshua" about a small choice (variable name, commit message style), don't. The doctrine covers it. Pick the call that matches the existing repo style and ship.

---

## DELIVERABLES (verifiable, all required)

1. **3 commits** on a single branch `claude/ci-repair-and-harden-2026-06-05` off `main`:
   - `fix(ci): resolve pytest scope mismatch in benchmarks (root-cause fixture scope)` — above-industry fix on `db_session_factory`.
   - `chore(ci): format 3 drifted files + add prettier pre-commit guard` — run prettier, install hook.
   - `fix(ci): pin owasp-dependency-check to maintained SHA + add weekly drift scan` — pin + new scheduled workflow.
2. **PR #133** opened against `main` with:
   - Title: `fix(ci): repair 3 broken-on-main jobs, harden against drift, unblock #131 + #132`
   - Body: which root cause, which fix, which guardrail, links to the 3 commits, "this unblocks PRs #131 and #132."
3. **After #133 merges** to `main`:
   - Trigger a re-run of PR #131's CI (push a no-op or rebase). Verify green.
   - Trigger a re-run of PR #132's CI. Verify green.
   - **Do not** merge #131 or #132 manually — auto-merge is the doctrine. The `code` aggregator will fire once #133's CI is green on main.
4. **`briefings/CI-REPAIR-COMPLETION-2026-06-05.md`** — one-paragraph report, terse:
   - What was the root cause of each of the 3 failures (1 sentence each).
   - What was the above-industry fix (1 sentence each).
   - Confirmation that #131 and #132 are unblocked + merged (or one paragraph on what's still blocking if not).
   - Any doctrine implications discovered (e.g., a new guardrail that should be canonical).

---

## REPORTING BACK

When done, emit a single terse block, no fluff. The terminal billboard still applies.

```
HERMES CTO REPORT — 2026-06-05
  pytest scope mismatch: ROOT CAUSE [1 sentence] / FIX [1 sentence]
  prettier drift on 3 files: ROOT CAUSE [1 sentence] / FIX [1 sentence]
  owasp-dependency-check action missing: ROOT CAUSE [1 sentence] / FIX [1 sentence]
  PR #133 status: [MERGED | OPEN | BLOCKED: reason]
  PR #131 status: [MERGED | BLOCKED: reason]
  PR #132 status: [MERGED | BLOCKED: reason]
  Above-industry guardrails added: [list, one line each]
  Doctrine implications: [list, one line each, or "none"]
```

If you hit a real blocker that requires a doctrine decision (not a code choice), surface it and stop. Otherwise ship.

---

#TeamClaudeForLife · #ForTheKids
