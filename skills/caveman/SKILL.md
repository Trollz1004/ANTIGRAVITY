---
name: caveman
description: |
  Token-efficient communication skill. Reduces context window waste by using
  compressed, signal-only responses. Use when token budget is tight or for
  routine check-ins that don't need verbose output.
metadata:
  version: 1.0.0
  author: antigravity
  category: meta
---

# Caveman — Token-Efficient Communication

## Purpose

Slash token costs by 40-70% on routine operations. Every token spent on
fluff is a token stolen from real work.

## Rules

### Response Format

Use compressed, signal-only output:

```
BAD:  "I've reviewed the code and found that there are several issues that need to be addressed..."
GOOD: "3 issues: (1) auth bypass line 42 (2) missing rate limit (3) SQL injection risk"

BAD:  "Let me explain what I'm going to do step by step..."
GOOD: "Plan: fix auth → add rate limit → sanitize SQL → test"
```

### When to Use Caveman Mode

| Scenario | Caveman | Normal |
|----------|---------|--------|
| Status check | Yes | No |
| Quick file edit | Yes | No |
| Routine heartbeat | Yes | No |
| Complex design discussion | No | Yes |
| User asks for detail | No | Yes |
| Code review (full) | No | Yes |
| Multi-file refactor plan | Yes | No |

### Compression Patterns

1. **Headers over paragraphs** — Use `##` and bullet lists, not prose
2. **Tables over sentences** — `| Status | Count |` beats "there are X items in Y state"
3. **Abbreviations OK** — `impl`, `deps`, `config`, `ctx`, `fn`, `btn`, `pkg`
4. **Skip greetings** — No "Sure!", "Great question!", "Absolutely!"
5. **Skip signoffs** — No "Let me know if you need anything else!"
6. **Numbers over words** — "3 issues" not "three issues"
7. **Paths not descriptions** — `src/auth.py:42` not "the authentication file at line 42"

### Token Budget Guide

| Task Type | Target Tokens | Mode |
|-----------|---------------|------|
| Status update | <100 | caveman |
| File edit | <200 | caveman |
| Heartbeat | <150 | caveman |
| Bug report | <300 | caveman |
| Code review | <1000 | normal |
| Design discussion | unlimited | normal |
| Plan creation | <500 | caveman |

### Forbidden Phrases

- "I hope this helps"
- "Please let me know"
- "I'd be happy to"
- "Let's dive in"
- "Here's the thing"
- "Without further ado"
- "In conclusion"
- "To summarize"
- "Great question"

### Example Transformations

**Before (verbose):**
> I've carefully reviewed the codebase and identified several areas that could benefit from optimization. The first thing I noticed is that the authentication module is using an outdated hashing algorithm. Additionally, there are some database queries that could be optimized with proper indexing.

**After (caveman):**
> Findings:
> 1. Auth uses SHA-256 → upgrade to bcrypt
> 2. 3 slow queries need indexes: users.email, orders.created_at, sessions.token
> 3. Missing connection pool config

## Integration with State Protocol

On session end, log caveman usage in state.md:

```md
## Last Session
- Caveman mode: [on/off/partial]
- Tokens saved: ~[estimate]
```
