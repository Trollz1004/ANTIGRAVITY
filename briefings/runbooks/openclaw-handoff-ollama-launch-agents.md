# OpenClaw handoff — build 6 ollama-launch dispatcher subagents

> Author: Opus 4.7. Surface: Sabretooth (`C:\Antigravity\.claude\agents\`).
> Goal: thin Claude Code subagent layer that shells out to `ollama launch <runtime>` so Opus delegation cascades on Ollama brains (free) instead of metered Anthropic API. Opus stays the brain; everything below is $0.

## Files to create

All six under `C:\Antigravity\.claude\agents\`. Each is a markdown file with YAML frontmatter + a tiny system prompt body. Use the template at the bottom for every file.

| filename | description (Opus auto-routes on this) | runtime command |
|---|---|---|
| `ollama-codex.md` | "Default executor for code edits, refactors, file rewrites, build/test runs. Brain: qwen-coder. Trust tier #2 — pick this first for any concrete coding instruction." | `ollama launch codex --brain qwen-coder` |
| `ollama-claude.md` | "Claude-style reasoning on a Hermes/Gemma brain — NO Anthropic API, zero metered spend. Use when the task wants Claude-shaped output but body is bulk/parallelizable." | `ollama launch claude` |
| `ollama-openclaw.md` | "Bulk runtime grunt work — Ollama model pulls, log triage, hermes-router probes, MCP diagnostics. One-shot dispatch into OpenClaw's 8-agent fleet." | `openclaw agent --message "$PROMPT"` |
| `ollama-opencode.md` | "OpenCode runtime — local + cloud. Cross-language code search, lightweight edits where codex is overkill." | `ollama launch opencode` |
| `ollama-pi.md` | "Pi runtime — conversational / explanatory tasks where a coding agent is wrong fit." | `ollama launch pi` |
| `ollama-hermes.md` | "Hermes runtime — research / multi-source synthesis. Prefer over WebFetch when reasoning over sources is needed." | `ollama launch hermes` |

If the actual `ollama launch` syntax differs from the table above, run `ollama launch --help` first and adjust each runtime command. Don't invent flags.

## Hard constraints (do NOT violate — from CLAUDE.md + memory)

- NO Haiku anywhere. NO Anthropic API in any of these files.
- Trust hierarchy: codex > others — `ollama-codex.md` description should read most attractive.
- 1-folder rule: paths use `C:\Antigravity\` (case-insensitive on Windows; just be consistent).
- Each agent's `tools:` field should be `Bash` only. They're dispatchers, not editors.

## File template (copy this for all 6, swap the bold parts)

```markdown
---
name: **ollama-codex**
description: **<paste from table above>**
tools: Bash
---

You are a thin dispatcher. ONE job: invoke `**<runtime command from table>**` with the caller's task as input, capture stdout, return it verbatim.

Do not add commentary. Do not summarize. Do not interpret. The runtime does the work; you are the conduit.

If the runtime exits non-zero, return stderr verbatim so Opus can diagnose.
```

## Smoke test after writing

```bash
ls -1 /c/Antigravity/.claude/agents/ollama-*.md
for f in /c/Antigravity/.claude/agents/ollama-*.md; do
  echo "--- $f ---"
  head -6 "$f"
done
```

Expect 6 files, each with valid frontmatter (name / description / tools fields present).

## Commit + push

```bash
cd /mnt/c/Antigravity
git add .claude/agents/ollama-*.md
git commit -m "feat(agents): ollama-launch dispatcher subagents for free delegation

Six thin agents (codex/claude/openclaw/opencode/pi/hermes) that shell out
to ollama launch so Opus delegation cascades on Ollama brains instead of
metered Anthropic API. Opus stays the brain; subagents and their own
sub-spawns are zero-cost.

Co-Authored-By: OpenClaw <noreply@youandinotai.com>"
git push origin main
```

## Report back (tight bullets)

- 6 files written? Y/N
- Smoke test pass? Y/N
- Any runtime command you had to adjust based on `ollama launch --help`?
- Commit SHA pushed to origin/main
