---
name: code-review
description: Runs typecheck/tests/wall-check on a PR or local diff and writes a structured review
---

# Tool: code-review

## Inputs
- `target` — one of: `working-tree`, `pr:<number>`, `branch:<name>`, `commit:<sha>`

## Steps

### 1. Get the diff
- `working-tree` → `git diff` + `git diff --staged`
- `pr:<n>` → `gh pr diff <n>`
- `branch:<name>` → `git diff main...<name>`
- `commit:<sha>` → `git show <sha>`

### 2. Wall check
```bash
echo "$DIFF" | grep -iE "antigravity|sabretooth|trollz|:3100[^0-9]|aidoesitall.*paperclip"
```
If any match → REJECT with reason "WALL VIOLATION".

### 3. Typecheck
```bash
cd C:/income-engine && pnpm typecheck 2>&1 | tail -30
```
Capture pass/fail.

### 4. Tests
```bash
pnpm test --run 2>&1 | tail -40
```
Capture pass/fail and any new failures introduced by the diff.

### 5. Lint (if config exists)
```bash
pnpm lint 2>&1 | tail -20
```

### 6. Manual scan for:
- Hardcoded secrets (regex: `sk-|api[_-]?key.*=.*["'][a-zA-Z0-9]{16,}`)
- `any` types in TypeScript
- New dependencies in package.json (require justification)
- `console.log` debugging left in production paths

## Output (markdown comment on PR/issue)
```
## Code Review — <target>
- Wall: PASS/FAIL
- Typecheck: PASS/FAIL
- Tests: PASS/FAIL (N new failures)
- Lint: PASS/FAIL/SKIPPED
- Secrets scan: PASS/FAIL
- New deps: <list or "none">
- Recommendation: APPROVE / REQUEST CHANGES / REJECT
- Notes: <bullets>
```

## Constraints
- Never auto-merge. Recommendation is advisory; Josh approves.
- Never write to `main`.
