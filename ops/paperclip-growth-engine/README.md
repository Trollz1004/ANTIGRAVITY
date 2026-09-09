# Paperclip Growth Engine — the "5 ways"

The "5 ways to improve Paperclip in marketing / SEO / YouTube (faceless or
animated, avatars ok)" deliverable, implemented as a daily routine engine that
mirrors the Date App engine's conventions (`ops/dateapp-marketing-engine/`)
and **reuses its rotation pick** (`pick` from `rotation.js` — no duplicated
logic).

> **Related artifact:** the process-oriented companion briefing
> `briefings/PAPERCLIP-MARKETING-SEO-YOUTUBE-DAILY-2026-08-26.md` (+ its
> `agent-workflow-graphy.json` daily config) describes agent-driven daily
> procedures for the same mission. This engine is the executable layer: it
> actually produces the dated DRAFT batches in the marketing inbox that the
> briefing's procedures log. The two complement each other — the briefing
> prescribes the audits/checks, this engine produces the content drafts.

## The five ways

| id | Way | Platform |
|----|-----|----------|
| `seo` | SEO content cluster | Blog / website |
| `youtube` | Faceless YouTube channel | YouTube (faceless, avatar ok) |
| `shorts` | Animated / avatar short-form | TikTok / Shorts / Reels |
| `community` | Community engagement on existing posts | TikTok / Instagram / Reddit comments |
| `social-proof` | Social proof & story marketing | Instagram / TikTok / X story formats |

Each way has its own 8-item topic pool in `data.js`. Every daily run:

1. Rotates: picks up to **3 topics** from the way's pool with **no repeats
   within a 6-pick window**, state persisted per way in `state/<way>.json`
   (gitignored).
2. Drafts **3 variants**, each with a **different 3-tag set**
   (`#YouAndiNotAI` brand tag + two topic tags).
3. Writes one **dated DRAFT** markdown to `ops/marketing-inbox/` as
   `<date>-paperclip-<way>-batch.md` — **never direct publishing**.

## Run

```bash
node ops/paperclip-growth-engine/engine.js --way seo
# optional: --state <dir>  --inbox <dir>
```

## Test

```bash
node --test ops/paperclip-growth-engine/engine.test.js
```

## Routines

Five Paperclip routines are registered (one per way, assigned to Buffy/CEO),
each with an enabled daily schedule trigger (13:00–17:00 UTC, staggered):

| Way | Routine trigger |
|-----|-----------------|
| seo | `0 13 * * *` UTC |
| youtube | `0 14 * * *` UTC |
| shorts | `0 15 * * *` UTC |
| community | `0 16 * * *` UTC |
| social-proof | `0 17 * * *` UTC |

Known API gotcha (recorded from wiring this): routine frontmatter triggers
are documentation only — the schedule must be created via
`POST /api/routines/{id}/triggers` with `{kind:"schedule", cronExpression,
timezone}`.

## Boundaries

- Drafts only; route through `ops/marketing-inbox/` approval before any use.
- X execution remains Grok-lane only until Grok cap clearance is evidenced.
- No invented claims: every piece grounds in a real city singles scene or
  real dating behavior.
