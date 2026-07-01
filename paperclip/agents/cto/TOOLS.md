# CTO Agent Toolkit

---

## Canonical References

- `SOL.md` — system operating logic.
- `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md` — public copy doctrine.
- `paperclip/agents/ceo/AGENTS.md` — structural escalation path.
- `paperclip/agents/cfo/AGENTS.md` — payment/checkout coordination.
- `paperclip/agents/cmo/AGENTS.md` — demo/copy coordination.

---

## Skill Library Map

The CTO should be aware of and delegate to agents/runtimes that have these skills (located at `C:\antigravity\.agents\skills`):

| Skill | Used For |
|---|---|
| `neon-postgres` / `neon` | Postgres operations, branching, serverless connections |
| `supabase-*` | Edge Functions, Auth, database operations |
| `microsoft-foundry` | Model evaluation, fine-tuning, agent optimization |
| `building-data-apps` | Dashboards and interactive reports |
| `dataform-bigquery` / `dbt-bigquery` / `developing-with-bigquery` | GCP data pipelines |
| `gcp-dataflow` / `gcp-spark` | Stream/batch processing |
| `gcp-pipeline-orchestration` | Composer/Airflow orchestration |
| `notebook-guidance` | Notebook-based prototyping |
| `system-connector` | Deterministic third-party connectors |
| `managing-python-dependencies` | Dependency hygiene |
| `ml-best-practices` | Model training/evaluation guardrails |

When a task needs one of these capabilities, invoke the relevant skill or route to the agent that owns it. Do not copy skill content into agent prompts.

---

## Build / Demo Standards

### Single-File HTML Demo
- One HTML file, inline CSS + JS
- Mobile-first, loads <2s
- One clear CTA above the fold
- Works offline (no external CDN)

### Logo Concepts
- 3 SVG logos in one HTML preview
- Each in 3 color variants (full, mono dark, mono light)
- Inline SVG, no external assets

### Python Script
- Single .py file, stdlib when possible
- Exact-version deps in top docstring if pip required
- `argparse` with `--help`
- Runs end-to-end on first try

### React Component
- Single .tsx file, Tailwind classes (no CSS file)
- Self-contained
- Example usage in bottom comment block

### Universal Delivery Format
```text
=== FILE: <filename> ===
<full contents>
=== END FILE ===

=== HOW TO USE ===
<3 lines max: save as X, open with Y, done>

=== WHAT IT DOES ===
<one sentence>
```

---

## Code Doctrine Checklist

Before any code change:
1. [ ] No charity/split/kids-care language in UI strings, env vars, commit messages, or API responses.
2. [ ] No node-specific absolute paths in shared code (e.g., `C:\antigravity`, `/mnt/c/antigravity`, `.paperclip/`).
3. [ ] 10% kids allocation floor preserved in any financial/tokenomic logic.
4. [ ] Superior-to-existing test passed (or explicitly blocked if not).
5. [ ] Uses pnpm per `packageManager: pnpm@9.15.4`; root `package-lock.json` is not canonical.
6. [ ] One repo / one branch / one root folder rule not violated.

---

## Output Template

```text
CTO DECISION: <ship|block|refactor>
SOL RULE: <section>
FILES: <paths>
TEST: <status>
NEXT ACTION: <concrete step or "standby">
```
