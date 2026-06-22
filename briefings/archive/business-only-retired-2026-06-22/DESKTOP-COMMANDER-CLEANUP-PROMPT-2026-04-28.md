# Cleanup Prompt — c:\Antigravity

**Recommended executor:** `ollama launch codex` running `qwen3-coder:480b-cloud` (fall back to local `qwen2.5-coder:7b`). Codex is trust-tier #2, code-specialized, native to git workflow. Desktop Commander is the alternate — works the same way, just slower for git-heavy work.

**Paste the block between the `=== PROMPT ===` markers into your chosen executor. One shot. Cleanup runs, report lands at `c:\Antigravity\briefings\CLEANUP-REPORT-2026-04-28.md`. Opus reviews the report before any commit.**

**Why Codex first:** Joshua's stated trust ranking is Opus #1, Codex #2, no close 3rd. Defaulting to Codex on code/repo work matches that hierarchy and keeps execution within the trusted pair.

---

## === PROMPT ===

You are operating on Joshua Coleman's primary Windows workstation, executing a drift cleanup inside `c:\Antigravity`. Mission tag #UNTILnoKIDinNEED, ~14 days runway. Be precise, be fast, do not improvise. Use Desktop Commander tools (file, shell, process). Work on Windows paths.

## Hard rules — non-negotiable

1. NEVER read, edit, copy, or move any file matching: `.env*`, `*.key`, `*.pem`, `*.vault`, `*.secret`, `*credentials*`, `*token*`. If you encounter one, skip silently.
2. NEVER touch `c:\Antigravity\.claude\settings.local.json` or any `briefings\MASTER-UNIVERSAL-ENV-*.env`.
3. NEVER delete, move, edit, or `git mv` anything inside `c:\Antigravity\Antigravity\` (the nested subdirectory). Read-only inspection only.
4. NEVER run: `git push`, `git commit`, `wrangler deploy`, `docker-compose up`, `docker run`, `npm publish`. Cleanup only.
5. Use `git mv` (not plain `mv`) inside `c:\Antigravity` to preserve git history.
6. If any command fails, log the error and continue with the next task. Do not retry destructive commands.
7. Customer-facing copy rule: never introduce the words "donate", "donation", or "solicitation" into any moved/edited file. (You're moving, not editing copy — guardrail only.)

## Stage 1 — Execute these moves (already approved)

Run each `git mv` from `c:\Antigravity`. Capture exit code per command.

```
git mv CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md briefings\
git mv "DEPLOY-PAPERCloudflare.md"     briefings\DEPLOY-PAPERCLIP-CLOUDFLARE.md
git mv DOCKER-SETUP.md                  briefings\
git mv OPENCLAW-DAILY-ORDERS.md         briefings\
git mv REVENUE-BLITZ-2026-04-27.md      briefings\
git mv UNIVERSAL-SYNC-2026-03-23.md     briefings\
git mv UNIVERSAL-TEAM-SYNC-FINAL-2026-03-23.md briefings\
git mv hermes-auto-start-setup.md       briefings\
git mv paperclip-cloudflare-deploy.md   briefings\
git mv setup-anythingllm-brain-bridge.ps1 scripts\
```

## Stage 2 — Robocopy Desktop handoff (copy, do not move)

Source: `C:\Users\joshl\OneDrive\Desktop\.env.CLAUDE-TO-CLAUDE-HANDOFF-2026-04-11.md.env.md`
Destination: `c:\Antigravity\briefings\CLAUDE-TO-CLAUDE-HANDOFF-2026-04-11.md`

Use a copy command (not move — keep the Desktop original as a backup). Verify byte counts match. Report any difference.

## Stage 3 — Inspect, do not touch

### 3a. Nested `c:\Antigravity\Antigravity\` subdirectory

Run a directory listing depth-1 only. Then capture:
- Total size in MB (`dir /s /-c c:\Antigravity\Antigravity` summary line).
- Whether `c:\Antigravity\Antigravity\.git\` exists (yes/no).
- The `"name"` field from `c:\Antigravity\Antigravity\package.json` (read first 200 lines).
- The `<artifactId>` from `c:\Antigravity\Antigravity\pom.xml` (read first 100 lines).
- Top-level entry list (one line per direct child).

### 3b. Archive contents

For each file, list contents without extracting to a permanent location. Use a temp dir if needed and clean it up.

- `c:\Antigravity\hermes-paperclip-adapter-main.zip` — list first 25 entries.
- `c:\Antigravity\joshuaclaw-flagship-beta-testing.zip` — list first 25 entries.

### 3c. Stray file

`c:\Antigravity\Import-Module` — read first 200 bytes, report content (likely a stray PowerShell echo artifact).

## Stage 4 — Final state capture

Run from `c:\Antigravity`:
- `git status` (full output)
- `git diff --stat` (full output, only for modified tracked files)

## Stage 5 — Write the report

Write to `c:\Antigravity\briefings\CLEANUP-REPORT-2026-04-28.md` exactly this structure:

```markdown
# Cleanup Report — 2026-04-28
**Executor:** Desktop Commander
**Reviewer pending:** Opus (Claude Code session)

## Stage 1 — Moves executed
| Command | Exit code | Notes |
|---|---|---|
| (one row per git mv, with exit code 0 = ok, non-zero = log error)

## Stage 2 — Robocopy
- Source bytes: <n>
- Dest bytes:   <n>
- Match:        YES / NO
- Path:         c:\Antigravity\briefings\CLAUDE-TO-CLAUDE-HANDOFF-2026-04-11.md

## Stage 3a — Nested Antigravity\ subdir (read-only)
- Size: <X> MB
- Has .git\: YES / NO
- package.json name: "<value>"
- pom.xml artifactId: "<value>"
- Top-level entries:
  - <entry>
  - <entry>
  ...

## Stage 3b — Archive contents
### hermes-paperclip-adapter-main.zip
- <up to 25 entries>

### joshuaclaw-flagship-beta-testing.zip
- <up to 25 entries>

## Stage 3c — Import-Module file
- Size: <bytes>
- First 200 bytes: <content>

## Stage 4 — git status / git diff --stat
\`\`\`
<full git status output>
\`\`\`
\`\`\`
<full git diff --stat output>
\`\`\`

## Stage 5 — Recommendations for Opus / Joshua review
- One bullet per ambiguous item with a recommended next action.
- Do NOT execute these recommendations. Joshua and Opus decide.
```

## Stop conditions

- Stage 1 complete → continue to Stage 2.
- Any command in Stage 1 fails → log it, continue. Do NOT retry.
- Stage 5 written → STOP. Do not commit. Do not push. Do not delete anything. Do not extract archives permanently.

End of brief.

## === END PROMPT ===

---

## After Desktop Commander returns

1. The report lands at `c:\Antigravity\briefings\CLEANUP-REPORT-2026-04-28.md`.
2. Tell Opus (this session) to read the report.
3. Opus reviews, flags risky items (especially the nested `Antigravity\` subdir and the archives), proposes the commit.
4. Joshua approves the commit message → Opus runs `git add` + `git commit` (no push without explicit OK).
