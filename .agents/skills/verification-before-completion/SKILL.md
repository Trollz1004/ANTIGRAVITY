---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Bug reproduced | Failure has the SAME cause as production | Failure for a different cause (DB down, missing table, wrong config) |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ≠ excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**A regression test must be able to fail.** A test that passes whether or not the
fix is present is not a regression guard — it is decoration. Prove the guard by
mutation: delete the fix, watch it fail, restore it, watch it pass. Report all
three runs. "Tests pass" alone never proves a regression test works.

**A guard must assert, not print.** A test that prints an observation and exits 0
enforces nothing. If a docstring promises behaviour, the suite must FAIL when
that behaviour is absent — otherwise it is documentation with extra steps.

**Docstrings and commit messages are claims, and they are judged as claims.**
```
✅ State only what the code measurably does, including its exceptions
❌ "Every return is verified" when one early-return path skips the verification
```
A guarantee in a docstring is a testable assertion; a false one is a defect of
the same severity as broken code. Before writing "always", "never", "every", or
"guaranteed":
- Walk EVERY return path — early returns, empty input, and fallbacks reached
  when a search finds nothing. Name the exception in the docstring if one exists.
- Prefer REMOVING the exceptional path to documenting it. A fallback returning
  something it never measured is a bug to delete, not a behaviour to describe.
- Commit messages count too: "every returned size was tested" is false if one
  path returns before testing. The message is part of the artifact.

**Prove absence of writes by mtime, not by content hash.**
```
✅ Compare st_mtime_ns before and after the operation
❌ "The md5s are identical, so nothing was written"
```
Deterministic regeneration produces byte-identical files, so equal hashes cannot
distinguish "did not write" from "wrote the same bytes". Use timestamps when the
claim is about whether a write happened.

**But timestamps have resolution limits — observe the effect directly instead.**
```
✅ Spy on the write path (open/os.replace/Image.save) and count the attempts
❌ Relying on mtime when two back-to-back writes can share one st_mtime_ns
```
Two consecutive writes on NTFS returned the SAME `st_mtime_ns`, so mtime could
not distinguish them either. Content hashes and timestamps are both PROXIES for
a write; when the claim matters, intercept the write itself and report the count.
Rank your evidence by distance from the claim: direct observation of the effect
beats a proxy, and a proxy that can coincide beats nothing at all.

**`$?` after a pipe is the exit code of the LAST command, not yours.**
```
✅ python build_blog_static.py --check; echo "exit: $?"     # 1 — correct
❌ python build_blog_static.py --check | tail -4; echo "exit: $?"   # 0 — tail's
```
A checker that correctly exits 1 on a defect read as `EXIT: 0` in three separate
mutation tests, because `tail` was the last process in the pipeline and it
succeeded. This inverts the entire meaning of the evidence: a passing suite and a
failing one both report 0. When the exit code IS the claim, never pipe the
command — run it bare, or capture `PIPESTATUS[0]`.

**A check that cannot be triggered by any input is decoration.**
```
✅ Mutation-test each assertion: does it FAIL when the defect is present?
❌ Adding an assertion and seeing it pass on already-correct code
```
Adding an assertion proves nothing on its own — it must be shown to fail. And the
input must actually reach the code path being asserted: a membership check on a
fallback never passed a case that reaches that fallback, so mutating the fallback
still passed the suite. Construct the input that reaches the branch, then mutate.

**Reproducing a bug (confounded failure):**
```
✅ Cause the failure in ISOLATION → confirm the error message names the defect
✅ Same command, same environment, ONE variable changed (the commit)
❌ "I got a 500 before the fix and a 201 after" (the 500 may have another cause)
```
A failing reproduction is worthless if it failed for a DIFFERENT reason than the
one you are claiming to fix. Before/after is only evidence when the environment
is held constant and the failure is the SAME failure. Check the actual exception,
not just the status code:

- A 500 from a down database, a missing table, or bad credentials looks exactly
  like a 500 from the bug under test. Confirm the exception names the defect.
- If the before-side ran with different config (a copied `.env`, a different DB,
  a fresh database with no schema), you have proven nothing. Reproduce with the
  SAME harness on both sides — ideally the repo's own test fixture.
- Ask of every reproduction: "what else could cause this exact output?" If there
  is a second plausible cause, rule it out or the evidence is void.

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**
```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

**Rule applies to:**
- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion/correctness
