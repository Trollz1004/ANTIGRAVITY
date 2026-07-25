# Drift Cleanup Brief — c:\Antigravity
**Date:** 2026-04-28
**Authority:** Joshua Coleman (CEO)
**Conductor:** Opus (drafted this brief)
**Executor:** `ollama launch codex` running `qwen3-coder:480b-cloud` (fall back to local `qwen2.5-coder:7b` if Ollama Cloud is rate-limited). Codex is the trusted #2 — code-specialized, file-aware, the right hands for `git mv` work. OpenClaw stays in reserve for mission/copy tasks.
**Mission tag:** #UNTILnoKIDinNEED

---

## Context (read before doing anything)

`c:\Antigravity` is the ONE authoritative repo. Everything else is drift. This task: sweep drift into the right places without breaking anything tracked, without touching secrets, and without deleting the nested `Antigravity/` subdir until Joshua confirms what it is.

**Secrets rule (non-negotiable):**
- NEVER edit, move, or display contents of `.env`, `.env.*`, `*.key`, `*.pem`, `*.vault`, `*.secret`.
- The PreToolUse hook will block these anyway — don't fight it.

**§496.405 rule:** No file rename/edit may introduce the word "payment" / "payment" / "outreach" in customer-facing copy. (You're moving files, not editing copy, so this is just a guardrail.)

---

## Inventory (the drift surface)

### A. Root-level docs that belong in `briefings/`
```
CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md
DEPLOY-PAPERCloudflare.md            ← typo: also rename to DEPLOY-PAPERCLIP-CLOUDFLARE.md
DOCKER-SETUP.md
OPENCLAW-DAILY-ORDERS.md
REVENUE-BLITZ-2026-04-27.md
UNIVERSAL-SYNC-2026-03-23.md
UNIVERSAL-TEAM-SYNC-FINAL-2026-03-23.md
hermes-auto-start-setup.md
paperclip-cloudflare-deploy.md
```
**Action:** `git mv <file> briefings/<file>` for each (preserves git history once committed).

### B. Root-level scripts that belong in `scripts/`
```
setup-anythingllm-brain-bridge.ps1
scripts/paperclip-watchdog.ps1               ← already in scripts/, just `git add`
scripts/register-paperclip-forever.ps1       ← already in scripts/, just `git add`
```
**Action:** for `setup-anythingllm-brain-bridge.ps1`, `git mv` to `scripts/setup-anythingllm-brain-bridge.ps1`.

### C. Root-level archives — INVESTIGATE before moving
```
hermes-paperclip-adapter-main.zip            ← likely the Hermes adapter
joshuaclaw-flagship-beta-testing.zip         ← unknown contents
```
**Action:** Don't move yet. Run `unzip -l <file>` for each, output the file listing into the manifest below. Joshua decides keep/extract/archive.

### D. Root-level config oddballs
```
Modelfile                                    ← Ollama Modelfile, KEEP at root for `ollama create`
Import-Module                                ← stray PowerShell artifact, file with no extension. INVESTIGATE.
Antigravity.code-workspace                   ← (already inside nested Antigravity/, see Section F)
Personal Vault-Sabretooth.code-workspace     ← VS Code workspace, KEEP at root
```
**Action:** `Modelfile` and the `.code-workspace` stay at root. For `Import-Module`: report file size + first 100 bytes; if it's empty or a PowerShell echo-mistake, propose deletion in the manifest (Josh approves before delete).

### E. Desktop handoff doc
```
C:\Users\joshl\OneDrive\Desktop\.env.CLAUDE-TO-CLAUDE-HANDOFF-2026-04-11.md.env.md
```
**Action:** `robocopy` (don't move — keep Desktop copy as backup) into `briefings/CLAUDE-TO-CLAUDE-HANDOFF-2026-04-11.md` (drop the `.env` filename trickery — it's markdown, not a secret). Verify byte count matches.

### F. The big one — nested `c:\Antigravity\Antigravity\` subdir
**DO NOT MOVE OR DELETE.** It's a Next.js + Maven scaffold (`pom.xml`, `mvnw`, `package.json`, `prisma/`, `command-center-main/`) created Apr 27 by another tool.

**Action:** Read-only inventory only. Produce:
- File count, total size in MB
- Top-level directory listing (depth=2)
- Whether it has its own `.git/` (if yes, it's a nested repo and needs different handling)
- Whether `package.json` declares a name and which (suggests intent)
- Whether `pom.xml` `<artifactId>` matches anything in the parent repo
- Suggestion: per CLAUDE.md monorepo plan, this likely belongs at `apps/antigravity-app/` — but **do not move it**. Joshua decides.

### G. Modified tracked files (uncommitted)
```
.claude/settings.json                        ← already modified by Opus this session, ready to commit
.claude/settings.local.json                  ← per-machine local settings, may contain paths/auth
.github/instructions/codacy.instructions.md
docker-compose.yml                           ← OpenCode made paths relative (Apr 27)
memory/opencode-memory.md                    ← OpenCode session memory (Apr 27)
scripts/bootstrap-paperclip-ceo.ps1
scripts/start-paperclip.ps1
```
**Action:** Run `git diff --stat` on each. Don't auto-commit. Produce a one-line summary of what changed in each, write it to the manifest. Joshua approves the commit.

### H. KEEP as-is
```
infra/paperclip-worker/                      ← OpenCode's Cloudflare Worker scaffold, intended
.mvn/                                        ← if this is at the root, INVESTIGATE; if inside nested Antigravity/, ignore
```

---

## Output — write a manifest, don't execute moves yet

Produce `briefings/CLEANUP-MANIFEST-2026-04-28.md` with this structure:

```markdown
# Cleanup Manifest — 2026-04-28
Generated by: ollama launch openclaw (joshlcoleman/dateapp)

## Section A — root docs → briefings/
- [ ] CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md → briefings/CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md (size: X KB)
- [ ] ... etc

## Section B — scripts → scripts/
...

## Section C — archives (need decision)
- hermes-paperclip-adapter-main.zip — contains:
  - <list first 20 entries from unzip -l>
  - Recommendation: <keep | extract to <path> | delete>
...

## Section D — oddballs
- Import-Module (size: X bytes, first line: "<...>") — Recommendation: delete (empty PS artifact)
...

## Section E — Desktop handoff
- robocopy plan: copy C:\Users\joshl\OneDrive\Desktop\<file> → briefings\CLAUDE-TO-CLAUDE-HANDOFF-2026-04-11.md
- byte count: X
...

## Section F — nested Antigravity/ subdir
- Total size: X MB, X files
- Has nested .git/: yes/no
- package.json name: "..."
- pom.xml artifactId: "..."
- Top-level entries (depth 2): [...]
- Recommendation: needs Joshua's call. Likely belongs at apps/antigravity-app/.

## Section G — modified tracked files (proposed commit message per file)
- .claude/settings.json — added mcp__github__pull_request_read to allowlist
- docker-compose.yml — paths changed absolute → relative (OpenCode 2026-04-27)
...

## Section H — bash script (proposed, NOT executed)
\`\`\`bash
#!/usr/bin/env bash
# Run only after Joshua approves this manifest.
set -euo pipefail
cd /c/Antigravity
git mv CEO-PAPERCLIP-BOOTSTRAP-PROMPT.md briefings/
# ... one git mv per approved file
\`\`\`
```

---

## Hard constraints for OpenClaw

1. **Read-only first.** Build the manifest. Do NOT run `git mv`, `mv`, `rm`, or `robocopy /MOV` yet.
2. **No edits to `.env*`, `*.key`, `*.pem`, `*.vault`, `*.secret`.** Hook will block; don't try.
3. **Don't touch the nested `Antigravity/` subdir.** Inventory only.
4. **Don't push to remote.** No `git push`. No PR creation.
5. **Don't run `wrangler deploy`, `cloudflared`, `docker-compose up`.** Cleanup only.
6. **Stay inside `c:\Antigravity` and `C:\Users\joshl\OneDrive\Desktop` (the handoff doc only).** No other paths.
7. **If anything is ambiguous, write it into the manifest with `RECOMMENDATION:` and stop.** Joshua decides.

---

## Review gate (Opus reviews after, before execution)

When OpenClaw writes `briefings/CLEANUP-MANIFEST-2026-04-28.md`, the loop returns to Opus (this Claude Code session). Opus reads the manifest, flags anything risky, presents Joshua with a one-page summary + the proposed bash script. Joshua approves → bash runs.

**No file moves until Joshua approves the manifest.** Period.
