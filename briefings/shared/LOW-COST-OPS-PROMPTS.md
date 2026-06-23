# LOW-COST OPS PROMPTS

> Goal: preserve Codex context/membership records by using local models + Haiku relay where possible.
> Last updated: 2026-03-05

---

## Prompt 1: T5500 Relay (Haiku-First Execution)

Paste to Claude on T5500:

```text
APPLY_CHANGES=YES
MODE=LOW_COST

Run this task with lowest-cost path first:
1) Local tools/Ollama first.
2) Haiku for text transforms/summaries/planning.
3) Escalate to Opus only if coding/debugging blocks remain.

Rules:
- No secrets in output.
- Keep response compact and factual.
- Return only:
  STATUS:
  ACTIONS_TAKEN:
  FILES_CHANGED:
  BLOCKERS:
  PASTE_TO_CODEX_SABRETOOTH:
```

---

## Prompt 2: 9020 Marketing Run (No alternate processor Blocking)

Paste to Claude on 9020:

```text
APPLY_CHANGES=YES
MODE=LOW_COST_MARKETING

Use local/Ollama + browser automation. Keep alternate processor non-blocking.

Do now:
1) Verify repo at origin/main.
2) Ensure PAYMENT_MONITOR_PROVIDER=generic in active runtime.
3) Restart social engine cleanly.
4) Run one health cycle and report real blockers only.

Return exactly:
FINAL_STATUS:
HEAD_COMMIT:
PAYMENT_MODE:
DAEMON_STATUS:
PIPELINE_OUTPUT:
TRUE_BLOCKERS:
PASTE_TO_CODEX_SABRETOOTH:
```

---

## Prompt 3: Fast Status Relay Back To Codex

Use this when you just need quick node facts:

```text
Give only strict facts, no narrative:
- node
- head commit
- ahead/behind
- dirty file count
- daemon/task health
- top 3 blockers
```

---

## Cost Control Notes

- Prefer `--fallback-chain ollama,codex` in task sentry.
- Use `--fallback-chain ollama --no-codex-fallback` for strict local-only mode.
- Escalate to Codex only for repo-writing/code-fix tasks that local models cannot complete.
