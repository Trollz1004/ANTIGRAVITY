# income-engine

**Purpose:** Organic growth and lead-generation pipeline for:
- **youandinotai.com** — AI-powered dating app (primary revenue vehicle)
- **ai-solutions.store** — AI services storefront
- **onlinerecycle.org** — eBay/recycling marketplace (via TRA)

**Mission connection:** Revenue from these platforms funds the
#UntilNoKidInNeed mission — ensuring no child in medical need goes without care.
Every signups, every sale, every lead is a link in the chain.

---

## What This Pipeline Does

The income-engine activation pipeline has three layers:

```
Genspark Playbook (strategy)
        │
        ▼
mission-mcp task board (orchestration)
        │
        ▼
Drafts → Josh reviews → Josh posts (execution)
```

**Layer 1 — Strategy:** The Genspark xlsx playbook defines 30 days of daily
actions, 10 launch directories, community targets (Reddit/Discord/social), and
AI prompt templates. This is the "what to do and when."

**Layer 2 — Orchestration:** mission-mcp holds all tasks. The seeder script
reads the playbook and creates one task per action. Josh works through the task
board; the system tracks what's done, pending, and blocked.

**Layer 3 — Execution:** For content tasks, the draft generator calls a local
LLM (Hermes Router or Ollama) to produce variations. Josh picks one, edits if
needed, and posts. Nothing is auto-posted — ever.

---

## Directory Structure

```
income-engine/
├── README.md                    ← this file
├── CLAUDE-HANDOFF-2026-05-07.md ← session context from prior build
├── UNIVERSAL-MEMORY-PROMPT.md   ← cross-agent memory prompt
├── agents/
│   ├── ceo-orchestrator.md      ← CEO orchestrator agent profile (legacy Paperclip)
│   └── organic-growth-assistant.md  ← active agent profile for content drafting
├── drafts/                      ← created at runtime by draft-content.py
│   └── <task_id>/
│       ├── v1.md
│       └── v2.md  (if re-run)
├── graphy/                      ← Graphy knowledge graph (legacy, dormant)
├── manus-gui-extract/           ← Manus delivery: React components + DB schema
├── paperclip/                   ← legacy Paperclip integration (DO NOT extend)
├── paperclip-data/              ← legacy data (DO NOT extend)
├── paperclip-server/            ← legacy server (DO NOT extend)
└── skills/                      ← legacy skill files (Hermes bootstrap, etc.)
```

> **Paperclip note:** `paperclip/`, `paperclip-data/`, and `paperclip-server/`
> are legacy artifacts from a prior architecture that was abandoned. Do not
> extend them. All new work goes in `agents/`, `drafts/`, or
> `services/mission-mcp/scripts/`.

---

## The Genspark Playbook

**File:**
`C:\Users\joshl\OneDrive\e-commerce-orchestrator-v2\Documents\High-Traffic_Social_Communities_and_Dating_App_Mar-Genspark_AI_Sheets-20260403_0344.xlsx`

14 sheets covering:

| Sheet | What it provides |
|---|---|
| Reddit Communities | 11 subreddits ranked by priority + audience size |
| Discord Servers | 11 servers with engagement scores |
| Social Media Hashtags | TikTok/Threads/IG hashtag map |
| Launch Directories | 10 free directories (Product Hunt, BetaList, HN, etc.) |
| Submission Tracker | 10-row tracker for directory submissions with status |
| Content Calendar | 30-day daily action plan (platform + action + hashtags) |
| Prompt Generator | AI prompt builder template with 14 ready-made prompts |
| Facebook Groups | 9 groups with audience sizes |
| Email Marketing (Legal) | Free-tier email platforms with compliance notes |
| Other Communities | Quora, Skool, LoveShack, niche forums |
| 30-Day Growth Plan | Week-by-week strategy summary |
| AI vs Human Tasks | Clear division — AI drafts, Josh posts |
| Agent Documentation | 180-row agent.md template (ported to `agents/organic-growth-assistant.md`) |
| Sheet1 | Empty |

---

## Scripts

Both scripts live in `services/mission-mcp/scripts/` (co-located with the
mission-mcp service that provides the HTTP API they call).

### seed-income-engine.py — Seed tasks from the playbook

**Path:** `C:\ANTIGRAVITY\services\mission-mcp\scripts\seed-income-engine.py`

Reads the Genspark xlsx and creates mission-mcp tasks for:
- Each launch directory (priority scaled by audience size)
- Each of the 30 content calendar days

**Dry run (default — safe to run anytime):**
```bash
python services/mission-mcp/scripts/seed-income-engine.py
```
Expected output:
```
[seed-income-engine] mode=DRY-RUN
[seed-income-engine] Parsing Submission Tracker...
  -> 10 directory submission tasks
[seed-income-engine] Parsing Content Calendar...
  -> 30 content calendar tasks
[seed-income-engine] Total tasks to seed: 40
--- DRY RUN OUTPUT ---
  WOULD CREATE: [2] Submit to Product Hunt
  WOULD CREATE: [3] Submit to Hacker News (Show HN)
  ...
  WOULD CREATE: [4] Day 1 — Reddit: Join 5 subreddits. Lurk, upvo...
  ...
[seed-income-engine] Dry run complete. 40 tasks ready.
Run with --commit to actually seed mission-mcp.
```

**Commit (actually create tasks — idempotent):**
```bash
python services/mission-mcp/scripts/seed-income-engine.py --commit
```
Expected output (first run):
```
[seed-income-engine] mode=COMMIT
[seed-income-engine] Fetching existing task titles for dedup...
  -> 0 existing tasks found
  CREATED [01JVXXX...] Submit to Product Hunt
  ...
[seed-income-engine] Done. created=40 skipped=0
```

Re-running with `--commit` is safe — it skips tasks that already exist by title.

**Prerequisites:**
- `pip install pandas openpyxl`
- mission-mcp HTTP server running: `cd services/mission-mcp && npm run start:http`

---

### draft-content.py — Generate content drafts for a task

**Path:** `C:\ANTIGRAVITY\services\mission-mcp\scripts\draft-content.py`

Looks up a content-calendar task in mission-mcp, builds a prompt from the
Genspark Prompt Generator template, calls an LLM, saves draft variations as
Markdown, and updates the task with a result pointer.

**Usage:**
```bash
python services/mission-mcp/scripts/draft-content.py --task-id <ULID>
```

**With options:**
```bash
python services/mission-mcp/scripts/draft-content.py \
  --task-id 01JVXXX... \
  --variations 3 \
  --model qwen2.5:7b
```

Expected output:
```
[draft-content] task_id=01JVXXX...
[draft-content] mcp=http://127.0.0.1:3901
[draft-content] Fetching task from mission-mcp...
[draft-content] Task: Day 1 — Reddit: Join 5 subreddits. Lurk, upvo...
[draft-content] Platform=Reddit  Variations=5
[draft-content] Generating drafts...
[draft-content] Generated via hermes-router
[draft-content] Saved to C:\ANTIGRAVITY\income-engine\drafts\01JVXXX...\v1.md
[draft-content] Task updated with result pointer
[draft-content] Done. Draft at: C:\ANTIGRAVITY\income-engine\drafts\01JVXXX...\v1.md
[draft-content] Review before posting. Never auto-post.
```

LLM fallback chain:
1. Hermes Router at `http://127.0.0.1:11435` (default, free, local)
2. Ollama at `http://127.0.0.1:11434` with `qwen2.5:7b` (or `--model` override)
3. Hard fail with "no LLM endpoint available" — no fabrication, no silent failure

**Prerequisites:**
- mission-mcp HTTP server running
- Hermes Router running **OR** Ollama running with a model pulled

---

## Human Approval Loop

The pipeline is designed with a mandatory human gate:

```
draft-content.py generates draft
         │
         ▼
Draft saved to income-engine/drafts/<task_id>/v1.md
         │
         ▼
Josh reads draft, decides to post / edit / discard
         │
         ▼
Josh posts manually (Reddit/Discord/social/etc.)
         │
         ▼
Josh updates task in mission-mcp: status=done
```

**Nothing in this pipeline auto-posts.** The loop ends at "draft saved + task
updated." The future command-center approval queue (hermes-workspace) will provide
a UI for reviewing drafts before Josh posts, but even that will be human-gated.

---

## TOS and Compliance Rules

Every draft produced by this pipeline must pass the Officially Unofficial doctrine:

- **Never use:** `payment`, `payment`, `payments`, `outreach`, `tax-deductible`
- **Revenue framing (when needed):** "a share of net proceeds after taxes, fees,
  and operating costs supports families"
- **AI attribution (if ever needed):** "designed in collaboration with AI tools" —
  never "Anthropic partner" or "Google-backed"
- **No financial overclaim** in marketing copy before the DAO smart contract is live

The seed and draft scripts enforce these rules at generation time. Any forbidden
word in generated content will raise an error before a task is created.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `MISSION_MCP_URL` | `http://127.0.0.1:3901` | mission-mcp HTTP base URL |
| `MISSION_MCP_TOKEN` | (none) | Bearer token if auth enabled |
| `HERMES_URL` | `http://127.0.0.1:11435` | Hermes Router for LLM calls |
| `XLSX_PATH` | OneDrive path (hardcoded default) | Override xlsx location |
| `DRAFTS_DIR` | `C:\ANTIGRAVITY\income-engine\drafts` | Draft output directory |

---

## Starting mission-mcp

```bash
# From ANTIGRAVITY root:
cd services/mission-mcp
npm install        # first time only
npm run build      # first time or after code changes
npm run start:http # starts HTTP server on 127.0.0.1:3901
```

Health check:
```bash
curl http://127.0.0.1:3901/health
# -> {"ok":true,"name":"mission-mcp","version":"0.1.0"}
```

---

## Next Steps

1. **Run the seeder** (`--commit`) to populate the task board
2. **Wire command-center** approval queue for draft review UI
3. **Add scheduling** via the `mcp__scheduled-tasks` infrastructure — daily
   9am prompt to draft today's content calendar action
4. **Extend to ai-solutions.store and onlinerecycle.org** — the seeder is
   designed to accept additional sheets; add store-specific content calendars
   as those platforms activate
5. **Track results** — update task `result` fields with actual engagement/signup
   numbers so the Genspark 30-Day Plan metrics populate back into the task board
