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

| File                  | Paperclip agent  | Recommended base model       |
| --------------------- | ---------------- | ---------------------------- |
| `hermes-agent.md`     | Hermes Agent     | glm-5.1:cloud (current)      |
| `cfo-prime.md`        | CFO PRIME        | joshlcoleman/CFO-Until-No... |
| `cmo-marketing.md`    | CMO              | joshlcoleman/dateapp-mktg... |
| `cto-builder.md`      | CTO              | qwen2.5-coder:7b (local)     |
| `closer.md`           | Closer           | korpohermes-prime:latest     |

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
