---
name: brainstorm
description: "Structured brainstorming: generate, evaluate, and refine ideas systematically."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [brainstorming, ideation, creativity, planning, decision-making]
    related_skills: [caveman, test-driven-development]
---

# Brainstorm Skill

## When to Use

- User needs ideas, options, or creative solutions
- Evaluating multiple approaches to a problem
- Feature planning or product decisions
- User says "brainstorm", "ideas", "options", "what should I build"

## The Brainstorm Loop

### 1. Diverge (Generate)

Generate 5-10 ideas without judgment. Use these techniques:

- **First principles**: What are the fundamental constraints? What's actually required?
- **Analogy**: How does nature/other industries solve this?
- **Inversion**: What would make this fail? Now avoid those things.
- **Constraint removal**: If [budget/time/expertise] weren't an issue, what then?
- **Combinations**: Merge two unrelated concepts

### 2. Converge (Evaluate)

Score each idea on:
- **Impact** (1-10): How much value if successful?
- **Feasibility** (1-10): Can we build it with current resources?
- **Speed** (1-10): How fast to MVP?
- **Alignment** (1-10): Does it match user goals?

### 3. Refine (Synthesize)

Take top 2-3 ideas and:
- Identify risks and mitigations
- Define success metrics
- Outline first steps
- Note assumptions to validate

### 4. Present

Format output:
```
## Top Recommendation: [Name]
- Impact: X/10 | Feasibility: X/10 | Speed: X/10
- Why: [one sentence]
- First step: [concrete action]
- Risk: [main risk] → Mitigation: [action]

## Runner-up: [Name]
[Same format]

## Wildcard: [Name]
[Same format — unconventional but high upside]
```

## Pitfalls

- Don't generate only safe ideas — include 1-2 wildcards
- Don't skip the evaluation step — raw ideas without scoring are noise
- Don't present more than 3 options — decision paralysis
- Don't brainstorm forever — timebox to 5 minutes for simple topics

## Verification

- [ ] At least 5 ideas generated
- [ ] Each scored on 4 dimensions
- [ ] Top 3 presented with risks and next steps
- [ ] User can make a decision from the output
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
