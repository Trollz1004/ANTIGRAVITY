# Paperclip Agent Prompts — Opus-Crafted, Drop-in

> **Current operating mode (2026-07-03): Hermes-only active agent.**
> Joshua's Paperclip architecture is now: Hermes does the work; Paperclip shows
> timestamped tasks/routines/issues/goals/evidence/done state from the Hermes
> work feed on `127.0.0.1:9119`. The agency roster below is a skill library,
> not a requirement to run permanent CFO/CMO/CTO/etc board agents.

> **Memory-first rule (new):** every canonical agent under `paperclip/agents/*/` now keeps a compact `STATE.md` file that is read on entry and written on exit, with a strict size cap and a Supabase-backed brain mirror. See [`paperclip/agents/memory-architecture.md`](agents/memory-architecture.md) and the per-agent `STATE.md` files.

**Paperclip-the-platform is alive and working** with Hermes for Joshua's daily ops.
Hermes is the active CEO/operator. These older prompts remain as reference
material only when Hermes deliberately creates a temporary subagent or skill lane.
They are NOT instructions to keep a permanent multi-agent company running.

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

### Legacy role prompts (reference only)

| File                  | Paperclip agent  | Recommended base model       |
| --------------------- | ---------------- | ---------------------------- |
| `hermes-agent.md`     | Hermes Agent     | glm-5.1:cloud (current)      |
| `cfo-prime.md`        | CFO PRIME        | joshlcoleman/CFO-Until-No... |
| `cmo-marketing.md`    | CMO              | joshlcoleman/dateapp-mktg... |
| `cto-builder.md`      | CTO              | qwen2.5-coder:7b (local)     |
| `closer.md`           | Closer           | korpohermes-prime:latest     |

### Legacy runtime / model prompts (reference only)

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

**The Agency** roster (144+ specialized AI roles) is integrated into this workspace
as Antigravity skills under `.agents/skills/agency-*`. Hermes loads these as
department expertise. They are not permanent Paperclip employees by default.

### Available Agent Skills

Run the following to list all available agency skills:

```bash
ls .agents/skills | grep "^agency-"
```

### Load an Agency Skill

In Antigravity, Hermes can load any department skill by its slug:

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

## Paperclip MCP Plugins

**The Agency MCP plugin** exposes all 184+ specialized agents as callable tools within Paperclip.

### Available MCP Plugins

| Plugin | Purpose |
|--------|---------|
| `agency-agents` | Invoke any Agency skill directly from Paperclip |
| `github-mcp` | GitHub repository and issue management |

### Agency Agents MCP Plugin Tools

```bash
# List all Agency divisions
agency-agents.list_agency_divisions

# List all available skills
agency-agents.list_agency_skills

# Read a specific skill
agency-agents.invoke_agency_skill --skill_slug agency-frontend-developer

# Activate an agent with a task
agency-agents.activate_agency_agent --agent_slug agency-backend-architect --task_description "Design API endpoint"
```

### Add Skills to Paperclip/Hermes

1. Pull the latest repo on Sabretooth
2. The MCP plugins in `paperclip-mcp-plugins/` are available for Paperclip integration
3. Restart the Hermes/Paperclip visual surface if plugin discovery changes

---

## Current Status: ✅ FUNA-23 COMPLETE

All 184+ Agency skills are integrated and available:

- `.agents/skills/agency-*` — 184 specialized AI agents
- `paperclip-mcp-plugins/agency-agents/` — MCP plugin to invoke skills
- `skills/self-improving-system/skills.md` — Complete skills index
- `paperclip/README.md` — Updated with Agency division counts (30/21/27/14/6/9/5/5/9/26/3)

**Last verified:** 2026-06-28
