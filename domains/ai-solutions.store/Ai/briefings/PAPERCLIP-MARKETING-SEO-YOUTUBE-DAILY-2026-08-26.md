# Paperclip Marketing, SEO & YouTube — Daily Improvement Routine (2026-08-26)

> **Mission deliverable** — 5 concrete, lean, daily-runnable improvement ideas for Paperclip
> in marketing, SEO, and YouTube (faceless/animated avatars, Hermes live-streaming included).
> Persisted into: Obsidian vault `defe808dbc475855`, `.agents/journals/paperclip-xmarketing/STATE.md`,
> `.freebuff/agent-workflow-graphy.json`. Branch: `feat/paperclip-marketing-seo-youtube-daily`.
> Status: ready for judge lane. Author: Freebuff CEO lane.

---

## 1. SEO — Daily keyword-gap + on-page audit (10 min)

**Idea:** Every day, audit 3 target keywords against `youandinotai.com` and the
openai-canonical-record / galaxy-studio pages: title tag, meta description, H1, alt text,
and whether a given page ranks-relevant to the keyword intent.

**Daily execution step (run by: memory/system agent with `agent-reach` + `growth-marketer`):**
1. Pull the day's 3 keywords from `.freebuff/agent-workflow-graphy.json` → `seo.keywordQueue`.
2. Fetch each live URL with `agent-reach`; extract title/meta/H1/alt.
3. Score each against a 5-point on-page checklist; log pass/fail to the Obsidian vault note `SEO-Audit-Log`.
4. Pick the single worst gap, write one concrete fix (exact string to change), and drop it to
   `ops/marketing-inbox/` as PENDING for Joshua approval.
5. Record the day's 3 keywords + scores in the vault and in the xmarketing journal entry.

**Why it compounds:** 30 keywords/month audited with a written fix each day → measurable
on-page coverage growth without a single big-bang project.

---

## 2. YouTube — Daily faceless short pipeline (Hermes) (15 min)

**Idea:** Hermes renders **one** faceless short per day from the newest `content/yesterday-news/<date>/`
folder, applying social-growth-engineer hook formulas (first-3-seconds hook, strong loop,
captions) before dropping it to the approval queue.

**Daily execution step (run by: Hermes lane with `hermes-youtube-faceless-news` + `social-growth-engineer`):**
1. Read `content/yesterday-news/` newest day folder → `metadata.json` + `script.txt`.
2. Draft the 3-second hook as 3 variants; pick the best with the social-growth-engineer hook checklist.
3. Render the short (existing avatar/faceless pipeline); validate the file exists and is non-empty.
4. Drop draft + evidence to `ops/marketing-inbox/` PENDING (no publish without Joshua).
5. Append one line to the vault `YouTube-Content-Log` and the Hermes STATE.md.

**Why it compounds:** 30 shorts/month, each a hook-variant A/B lesson; the vault log becomes
a searchable "what hook worked" memory.

---

## 3. YouTube Live — Animated avatar live-stream readiness check (10 min)

**Idea:** Before any Hermes live stream, run a daily 10-minute readiness probe of the animated
avatar live stack: avatar renderer up, audio input live, stream key valid, safety lifeline
(Hermes kill-switch / "safe life stream" hook) armed.

**Daily execution step (run by: Hermes/ops agent with `hermes-youtube-avatar-head` + `system-connector`):**
1. Probe the avatar-head renderer and audio source with real calls (identity, not port sniffing).
2. Verify stream key/health against YouTube live API; confirm the lifeline endpoint answers.
3. Log state to the vault `Live-Readiness-Log` as **UP** / **DOWN** / **NEEDS-FIX** with exact evidence.
4. If DOWN: file a mission issue (mission-mcp `create_issue`) with the failing check; do not start a stream.
5. If UP: mark "safe to stream today" in the vault; Hermes may use the animated avatar for the daily
   live life-stream when Joshua approves.

**Why it compounds:** live-stream readiness is verified daily from memory (vault log), so a stream
never launches blind and every failure mode is already documented.

---

## 4. Marketing — Daily funnel metric + one ICE-scored experiment (10 min)

**Idea:** Each day, measure exactly one AARRR stage metric (acquisition traffic, activation,
retention, referral K-factor, or revenue LTV:CAC) against the live property, then ICE-score one
experiment idea and append it to the experiment backlog.

**Daily execution step (run by: OpenClaw/xmarketing with `growth-marketer` + `supabase`):**
1. Rotate through the AARRR stages (Mon=Acquisition … Sun=Revenue); pick today's metric.
2. Measure it from live site analytics / Supabase with a real query; record the number.
3. Write one hypothesis in growth-marketer format ("If we [change], then [metric] will [direction]
   by [amount] because [reason]") and ICE-score it (Impact × Confidence / Effort).
4. Append metric + hypothesis to the vault `Funnel-Experiments` note.
5. If ICE ≥ 7, drop the experiment as a PENDING task to `ops/marketing-inbox/` for Joshua.

**Why it compounds:** 30 days of AARRR numbers + hypotheses builds a real funnel model and a
prioritized experiment backlog instead of ad-hoc marketing.

---

## 5. Memory/System — Daily skill research + context-bloat trim (10 min)

**Idea:** Each Paperclip agent researches **one new skill per day** (via `find-skills` /
`skills.sh` / hermes-skill-hub), tests it with a real call, records adopt-or-reject in its
STATE.md, and trims its own heartbeat/state file to LOCATIONS-ONLY to prevent context bloat
and hallucinations.

**Daily execution step (run by: every agent, driven by `self-improving-system` skill):**
1. Run `find-skills {role-topic}`; pick one candidate skill relevant to today's role task.
2. Load it and prove it with a real tool call (capability baseline rule — "configured" is not proof).
3. Record in STATE.md: skill name, what it proved, keep or reject (1 line each).
4. Trim STATE.md/heartbeat to locations-only format per `.freebuff/heartbeat-template.md`
   (paths to files, never full content dumps).
5. Sync the preloaded-skill list for the role into `.freebuff/agent-workflow-graphy.json`.

**Why it compounds:** 1 new skill/day × 5 agents = 150 proven skills/month, and the
locations-only discipline keeps every session start cheap — the direct fix for the context
bloat the CEO flagged.

---

## Execution ownership

| # | Idea | Daily owner | Skills |
|---|------|-------------|--------|
| 1 | SEO keyword-gap audit | memory/system agent | agent-reach, growth-marketer |
| 2 | Faceless short pipeline | Hermes | hermes-youtube-faceless-news, social-growth-engineer |
| 3 | Avatar live-readiness | Hermes/ops | hermes-youtube-avatar-head, system-connector |
| 4 | Funnel metric + experiment | OpenClaw/xmarketing | growth-marketer, supabase |
| 5 | Skill research + context trim | all agents | self-improving-system, find-skills |

All five are wired into `.freebuff/agent-workflow-graphy.json` → `dailyRoutine` so the daily
routine executes them. Evidence lands in the Obsidian vault (`defe808dbc475855`) via
`.freebuff/daily-obsidian-writer.sh`.
