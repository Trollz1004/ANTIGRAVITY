# Paperclip Agent Prompts — Opus-Crafted, Drop-in

**Paperclip-the-platform is alive and working** with Hermes for Joshua's daily ops.
These are user-facing prompts to paste into Paperclip's Custom Instructions /
System Prompt field for each agent. They are NOT the retired `paperclip-worker`
infrastructure (that one was replaced by paperweight per 2026-05-20 doctrine).

The thesis: a smaller base model + an Opus-crafted prompt with strict structure,
explicit decision tables, and forced output schemas performs 2–3 tiers above its
untuned weight. The model stops *thinking* and starts *executing* a clear procedure.

## How to install

1. `git pull` this repo on Sabertooth
2. Open Paperclip in your browser
3. For each agent below:
   a. Open the corresponding `.md` file in this folder
   b. Copy everything **below the `--- PASTE BELOW ---` line**
   c. Paste into Paperclip > [Agent] > **Custom Instructions** (or System Prompt)
   d. Save
4. Smoke-test each agent against the **Expected First Response** block in the file

## Files in this folder

### Role agents (business function)

| File                  | Paperclip agent  | Recommended base model       |
| --------------------- | ---------------- | ---------------------------- |
| `hermes-agent.md`     | Hermes Agent     | glm-5.1:cloud (current)      |
| `cfo-prime.md`        | CFO PRIME        | joshlcoleman/CFO-Until-No... |
| `cmo-marketing.md`    | CMO              | joshlcoleman/dateapp-mktg... |
| `cto-builder.md`      | CTO              | qwen2.5-coder:7b (local)     |
| `closer.md`           | Closer           | korpohermes-prime:latest     |

### Runtime / model agents (added 2026-06-14 per founder directive — all models, free and paid)

| File                       | Paperclip agent       | Default model                 | Tier        |
| -------------------------- | --------------------- | ----------------------------- | ----------- |
| `opencode-agent.md`        | OpenCode Worker       | qwen2.5-coder:7b (local)      | free        |
| `pi-agent.md`              | Pi Conversational     | Pi runtime default            | free / paid |
| `ollama-local-agent.md`    | Ollama Local          | qwen2.5:7b (self-hosted)      | free        |
| `ollama-cloud-agent.md`    | Ollama Cloud          | glm-5.1:cloud                 | free / paid |
| `gemini-agent.md`          | Gemini (Founding Four) | gemini-2.0-flash (direct API) | free / paid |
| `openrouter-agent.md`      | OpenRouter Router     | qwen-2.5-7b-instruct:free     | free / paid |
| `cursor-agent.md`          | Cursor (editor-side)  | claude-sonnet-4-6 (in Cursor) | free / paid |

> **Founding Four protection note**: `gemini-agent.md` honors the FOUNDER DOCTRINE rule
> that Gemini integrations are PERMANENTLY PROTECTED — direct API via `jules-cli.py`, never
> wrapped, never rerouted. The `openrouter-agent.md` explicitly refuses to call Anthropic
> models (Hermes Anthropic hard wall, FOUNDER DOCTRINE rule 6) and refuses to wrap Gemini.

## What's in each prompt

- Identity + mission constants (#UNTILnoKIDinNEED baked in)
- Decision matrix (table-form thresholds the model looks up)
- Output schema (forces structured response, no rambling)
- One-shot example (working template to mimic)
- Self-check checklist (model validates before returning)
- Refusal rules (hard-coded "never do X" for cheap-model failure modes)

## Honest expectation setting

- glm-5.1 + this prompt ≠ Sonnet 4.7 base. Base capability still matters.
- BUT: structured, self-validating prompts close most of the gap on routine
  tactical work (gig scoring, proposal drafting, lead triage).
- For deep novel reasoning, route to Opus via Claude Code or `hermes-deep`
  through the canonical `services/hermes-router/`.

## Agency Skills Integration

**The Agency** roster (144+ specialized AI agents) is integrated into this workspace
and available as Antigravity skills under `.agents/skills/agency-*`.

### Available Agent Skills

Run the following to list all available agency skills:

```bash
ls .agents/skills | grep "^agency-"
```

### Activate an Agency Skill

In Antigravity, activate any agent by its slug:

```
Use the agency-frontend-developer skill to review this component.
Use the agency-backend-architect skill to design an API endpoint.
Use the agency-growth-hacker skill to plan user acquisition.
```

### Agent Divisions

| Division | Count | Examples |
|----------|-------|----------|
| Engineering | 23 | frontend-developer, backend-architect, mobile-app-builder, devops-automator |
| Design | 8 | ui-designer, ux-researcher, brand-guardian, whimsy-injector |
| Marketing | 22 | growth-hacker, content-creator, tiktok-strategist, seo-specialist |
| Sales | 9 | outbound-strategist, deal-strategist, sales-engineer |
| Product | 5 | sprint-prioritizer, product-manager, trend-researcher |
| Project Management | 6 | project-shepherd, studio-producer, experiment-tracker |
| Testing | 8 | reality-checker, evidence-collector, api-tester |
| Support | 6 | support-responder, analytics-reporter, infrastructure-maintainer |
| Paid Media | 7 | ppc-campaign-strategist, paid-social-strategist, search-query-analyst |
| Spatial Computing | 5 | xr-interface-architect, visionos-spatial-engineer, xr-immersive-developer |
| Specialized | 30+ | agents-orchestrator, mcp-builder, blockchain-security-auditor |
| Finance | 5 | bookkeeper-controller, financial-analyst, tax-strategist |
| Game Development | 20+ | game-designer, unity-architect, unreal-systems-engineer, godot-shader-developer |
| Strategy | 2 | chief-of-staff |
| Academic | 5 | anthropologist, historian, psychologist |

### Regenerate Agency Skills

After modifying agent definitions in `agency-agents/`:

```bash
./agency-agents/scripts/convert.sh --tool antigravity
./agency-agents/scripts/install.sh --tool antigravity --no-interactive
```

This regenerates and installs skill files to `.agents/skills/`.
