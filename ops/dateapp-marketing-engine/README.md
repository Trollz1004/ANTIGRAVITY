# DateApp Marketing Engine

The executable core of the Date App organic-growth directive. Converts the
`ops/marketing-inbox/2026-08-26-dateapp-tagcity-engine.md` playbook (a spec)
into code the Paperclip daily routine can actually run.

## Contract (what the tests pin)

1. **Rotation engine** — picks at most **3 tags** and at most **3
   cities/states** per post, cycles round-robin without repeating within a
   window (6 recent picks), and persists rotation state to
   `state/rotation.json` (gitignored) so runs continue where the last one
   stopped.
2. **Comment generator** — produces **3 variants per target post**, each with
   a **different 3-tag set** (brand + niche tag + city tag, per the playbook's
   1+1+1 rule), extending reach of existing posts. Openings vary per variant
   so comments never read identically.
3. **Research data** — 28 real US metros ranked by singles population, 4
   dating-app content niches with 3-tag pools, `#YouAndiNotAI` brand tag.
4. **Daily routine** — writes one dated DRAFT markdown into
   `ops/marketing-inbox/` for approval. **Never publishes directly.**

## Run

```bash
# Contract tests
node --test ops/dateapp-marketing-engine/engine.test.js

# Daily batch → ops/marketing-inbox/YYYY-MM-DD-dateapp-daily-batch.md
node ops/dateapp-marketing-engine/engine.js --daily

# Custom state/inbox (e.g. a dry run)
node ops/dateapp-marketing-engine/engine.js --daily \
  --state .freebuff/engine-state.json --inbox .freebuff/engine-out
```

## Files

| File | Responsibility |
|---|---|
| `data.js` | Metros (ranked), niches, brand tag, seeded target posts |
| `rotation.js` | Pure `pick(pool, max, window, state)` — no repeats within window |
| `comments.js` | `generateComments(post, rotation)` — 3 variants, 3 different tag sets |
| `engine.js` | `runDaily(opts)` orchestration + `--daily` CLI |
| `engine.test.js` | Node test runner contract (13 tests) |

## Routine wiring

The daily routine (created via Paperclip API) instructs the CEO lane to run
`node ops/dateapp-marketing-engine/engine.js --daily` and route the output
through the marketing inbox. Anchor tasks: ANT-203 (W1 batch), ANT-204
(research refresh feeds the pools), ANT-205 (X queue stays Grok-lane).
