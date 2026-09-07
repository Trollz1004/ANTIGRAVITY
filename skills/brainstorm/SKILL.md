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
