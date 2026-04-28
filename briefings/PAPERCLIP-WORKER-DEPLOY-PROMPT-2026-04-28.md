# Paperclip Worker Deploy Prompt

**Recommended executor:** `ollama launch codex` running `qwen3-coder:480b-cloud` (fall back to `qwen2.5-coder:7b` local). Codex understands wrangler, D1, and KV idiomatically.

**Scope:** Deploy the Paperclip Worker scaffold at `c:\Antigravity\infra\paperclip-worker\` to Cloudflare. Validate. Report. Do NOT push to git in the same step — Opus reviews the deploy report and commits separately.

**Paste the block between the `=== PROMPT ===` markers.**

---

## === PROMPT ===

You are deploying the Paperclip Cloudflare Worker for Joshua Coleman's #UNTILnoKIDinNEED mission. The scaffold was created by OpenCode in commit `41491fe8` and lives at `c:\Antigravity\infra\paperclip-worker\` with `wrangler.toml`, `src/`, and `.wrangler/` cache. Your job: deploy, validate, report. No file moves, no git commits, no pushes.

## Hard rules

1. NEVER read or display contents of `.env*`, `*.key`, `*.pem`, `*.vault`, `*.secret`, `*credentials*`. The wrangler CLI will read its own auth from local config — leave it alone.
2. NEVER `git commit`, `git push`, or modify any tracked file outside `infra/paperclip-worker/`. Deploy only.
3. NEVER deploy if `wrangler whoami` fails — stop and report.
4. NEVER delete or overwrite an existing D1 database. If `wrangler d1 list` shows `paperclip-db` already exists, use it; do not recreate.
5. The Worker route is `paperclip-hq.youandinotai.com` via tunnel `c7bc9665-3923-4977-acd7-2033838cd56e`. Do NOT change tunnel config or DNS routes.

## Stage 1 — Pre-flight

Run from `c:\Antigravity\infra\paperclip-worker\`:

```
wrangler --version
wrangler whoami
wrangler d1 list
wrangler kv:namespace list 2>&1
```

Capture all four outputs. If `wrangler whoami` returns "not logged in", STOP and write the report with status `BLOCKED: wrangler not authenticated`. Joshua runs `wrangler login` then re-runs you. Do not proceed.

## Stage 2 — Inspect the scaffold

```
type wrangler.toml          (Windows; or `cat` on bash shells)
dir src
type src\index.ts 2>&1      (or whatever entry the wrangler.toml points to)
```

Verify: `wrangler.toml` declares `name`, `main`, `compatibility_date`, and any `[[d1_databases]]` / `[[kv_namespaces]]` bindings. If a binding references a database/namespace that doesn't exist in Stage 1's lists, stop and report — do not auto-create unless explicitly listed in this prompt.

If `paperclip-db` is referenced but missing from `d1 list`, **create it once** with:
```
wrangler d1 create paperclip-db
```
Then update `wrangler.toml` `database_id` with the value from the output. Capture the new ID for the report.

## Stage 3 — Dry-run

```
wrangler deploy --dry-run --outdir=.wrangler/dryrun
```

This builds without uploading. Confirm exit code 0. Capture full output. If it fails, STOP and report with the error block.

## Stage 4 — Deploy

Only if Stage 3 succeeded:

```
wrangler deploy
```

Capture exit code, deploy URL, version ID from the output.

## Stage 5 — Validate

```
curl -s -m 20 https://paperclip-hq.youandinotai.com/api/health
```

Also try:
```
curl -s -m 20 https://paperclip-hq.youandinotai.com/
```

Capture HTTP status + first 500 bytes of response body for both.

If the public URL fails but `wrangler deploy` succeeded, the issue is the Cloudflare tunnel — check:
```
Get-Process cloudflared -ErrorAction SilentlyContinue
type C:\ANTIGRAVITY\infra\cloudflare\paperclip-hq.yml
```
and report that the tunnel may need a restart. Do NOT auto-restart it without Joshua's approval.

## Stage 6 — Tail (sample)

```
wrangler tail --format=pretty
```

Run for 15 seconds, capture the first few log lines, then Ctrl-C. This confirms the Worker is receiving traffic. If no traffic in 15s, that's fine — the Worker may just be idle. Report it as "no traffic in 15s window — Worker idle".

## Stage 7 — Write the report

Write to `c:\Antigravity\briefings\PAPERCLIP-WORKER-DEPLOY-REPORT-2026-04-28.md`:

```markdown
# Paperclip Worker Deploy Report — 2026-04-28
**Executor:** <agent-name> (qwen3-coder:480b-cloud or qwen2.5-coder:7b)
**Reviewer pending:** Opus (Claude Code session)

## Stage 1 — Pre-flight
- wrangler version: <value>
- wrangler whoami: <output>
- d1 databases: <list>
- kv namespaces: <list>
- Status: PASS / BLOCKED: <reason>

## Stage 2 — Scaffold inspection
- wrangler.toml summary: name=<n>, main=<path>, compat_date=<date>
- bindings referenced:
  - D1: <names + IDs>
  - KV: <names + IDs>
  - any other (R2, AI, etc.): <list>
- Issues found: <none | list>
- New D1 created (if any): paperclip-db id=<value>

## Stage 3 — Dry-run
- exit code: <n>
- output (last 30 lines):
  ```
  <captured output>
  ```

## Stage 4 — Deploy
- exit code: <n>
- deploy URL: <value>
- version ID: <value>
- output (last 20 lines):
  ```
  <captured output>
  ```

## Stage 5 — Validation
| URL | HTTP status | First 500 bytes |
|---|---|---|
| https://paperclip-hq.youandinotai.com/api/health | <n> | <body> |
| https://paperclip-hq.youandinotai.com/ | <n> | <body> |

- Cloudflare tunnel diagnostic (only if public URL failed):
  - cloudflared process running: YES/NO
  - tunnel config exists: YES/NO

## Stage 6 — Tail sample
- 15-second window starting <ISO timestamp>
- log lines captured: <n>
- sample output:
  ```
  <first 10 lines or "no traffic in 15s window">
  ```

## Final summary
- Deploy status: SUCCESS / FAILED / BLOCKED
- Public URL reachable: YES / NO
- D1 created in this run: YES (id=<value>) / NO
- Worker version: <value>
- Recommended next action for Opus: <one bullet>
```

## Stop conditions

- Stage 1 BLOCKED → write report with `BLOCKED` status, stop, do not deploy.
- Stage 3 fails → write report with `FAILED` status at Stage 3, stop, do not deploy.
- Stage 4 fails → write report with `FAILED` status at Stage 4, stop, do not validate.
- Otherwise: complete all stages, write report, STOP. Do not commit. Do not push. Do not modify any file outside `infra/paperclip-worker/` (except writing the report itself to `briefings/`).

End of brief.

## === END PROMPT ===

---

## After the report lands

1. Opus reads `briefings/PAPERCLIP-WORKER-DEPLOY-REPORT-2026-04-28.md`.
2. If status is SUCCESS + public URL reachable: Opus drafts a single commit (any wrangler.toml `database_id` updates), Joshua approves, Opus runs `git add` + `git commit` (no push without explicit OK).
3. If status is BLOCKED on auth: Joshua runs `wrangler login` and re-runs the prompt.
4. If status is FAILED: Opus reads the captured error blocks, proposes the fix, Joshua approves, re-run.
5. Once SUCCESS: Mission Control's `PaperclipWorkerPanel` should turn green. Time to go GUI-first.
