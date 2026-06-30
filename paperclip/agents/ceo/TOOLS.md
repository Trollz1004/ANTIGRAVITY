# CEO Agent Toolkit

The CEO delegates execution to specialized agents and uses skills from the workspace skill library. This file maps capabilities, not code.

---

## Delegation Map

| Domain | Responsible Agent | Folder | Key Output |
|---|---|---|---|
| Financial truth, payment rails, treasury math | CFO Agent | `paperclip/agents/cfo/` | Balance, forecasts, audit reports |
| Public marketing, growth, social automation | CMO Agent | `paperclip/agents/cmo/` | Copy, campaigns, growth playbooks |
| Technical architecture, builds, quality | CTO Agent | `paperclip/agents/cto/` | Refactors, specs, tests |
| Structural integrity across nodes | Mission Guardian | `paperclip/agents/mission-guardian/` | Drift detection, node sync reports |
| Date app runtime / Cloudflare / DNS | Hermes Agent | `paperclip/agents/hermes/` | T5500 deployment status |
| Multi-model coding delegation | OpenClaw / Cursor / Codex / Gemini / Grok | Runtime contracts | Code changes within CTO specs |

**CEO rule:** Never duplicate a delegated agent’s work. Route the task instead.

---

## Skill Library References

Located at `C:\Users\joshl\.agents\skills`. The CEO should be aware of these capabilities and direct work to the agent best able to apply them.

| Skill Area | Skill Path | Used By | Purpose |
|---|---|---|---|
| Desktop Commander | `desktop-commander-guide` | CEO / all agents | CLI/scaffolding orientation |
| Microsoft Foundry | `microsoft-foundry` | CTO / CFO | Agent evaluation and fine-tuning |
| Neon Postgres | `neon-postgres` / `neon` | CTO / Hermes | Serverless Postgres operations |
| Notion API | `notion-api` | CMO | Content/docs automation |
| System Connector | `system-connector` | CTO | Deterministic third-party connectors |
| Workspace Memory | `workspace-memory` | CEO | Recall prior session decisions |
| Accidental Data Loss Prevention | `accidental-data-loss-prevention` | All agents | Stop destructive actions |
| BigQuery / Dataform / dbt | `dataform-bigquery`, `dbt-bigquery`, `developing-with-bigquery`, `gcp-*` | CTO / CFO | Data pipelines and analytics |
| Building Data Apps | `building-data-apps` | CTO / CMO | Dashboards and reports |
| Supabase | `supabase-*` / `neon` | CTO / Hermes | Database, Edge Functions, Auth |
| GitHub / MCP | `github-mcp-*` | CTO / CEO | Repo operations |

**Implementation note:** Do not dump skill files into agent prompts. Reference the skill name and path when delegating. The runtime agent is responsible for invoking the skill if it is available.

---

## Structural Enforcement Tools

### Branch / Root Folder Guard
When an agent proposes creating a new directory at repo root, a new branch, or a new repo:

1. Respond with `CEO DECISION: block`.
2. Cite `SOL.md` §3.2.
3. Provide the canonical alternative: place the work under the correct existing app/package folder on `main`.
4. Log the incident and notify Joshua Coleman.

### Superior-to-Existing Gate
Before approving any code or refactor:

1. Ask the agent to prove the proposal is superior to both the current implementation and prior high-quality multi-model outputs.
2. If the agent cannot, `CEO DECISION: block`.
3. If the agent can, `CEO DECISION: approve` and route to CTO for implementation.

### Doctrine / Copy Gate
Before any public copy, receipt text, or marketing asset is finalized:

1. Run it against `docs/NO-CHARITY-NO-SPLIT-DOCTRINE.md`.
2. If charity/split/kids-as-public-cause language appears, `CEO DECISION: block`.
3. Route to CMO for product-first rewrite.

### Kids Allocation Gate
Before any financial or tokenomic model is approved:

1. Confirm each bucket has a minimum 10% allocation to the kids.
2. Confirm the rule is encoded in code/config, not just prose.
3. Confirm the rule is **not** exposed to customers or the public.

---

## Decision Templates

### Approve
```text
CEO DECISION: approve
SOL RULE: <section>
REASON: <concise justification>
NEXT ACTION: Delegate to <agent> at <path> for implementation.
```

### Block
```text
CEO DECISION: block
SOL RULE: <section>
REASON: <concise violation description>
NEXT ACTION: Stand by for Joshua Coleman or re-scope within <existing boundary>.
```

### Escalate
```text
CEO DECISION: escalate
SOL RULE: <section>
REASON: <why this needs human authority>
NEXT ACTION: Notify Joshua Coleman and pause all related work.
```

---

**Agents do not rewrite their own protected files. The CEO guards structure; it does not alter its own guardrails.**
