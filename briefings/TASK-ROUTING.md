# TASK-ROUTING — ANTIGRAVITY Jarvis Brain
> Last updated: 2026-03-05 | Version: 1.0 (Cheaper Edition)

This file defines the automated routing logic for all tasks entering the ANTIGRAVITY ecosystem. Jarvis (Claude Opus) reads this to dispatch tasks to the appropriate sub-agent.

---

## 🚦 ROUTING TABLE

| TASK TYPE | AGENT (ROLE) | EXECUTOR | PRIMARY PROMPT / BRIEF |
|-----------|--------------|----------|-------------------------|
| **Research / Intel** | Atlas | Comet (Perplexity) | `briefings/PERPLEXITY-BRIEFING.md` |
| **Copywriting / Posts** | Scribe | Gemini 3.1 | `briefings/GEMINI-AGENT-PROMPT.md` |
| **Trend Scouting** | Trendy | Comet (Perplexity) | `briefings/COMET-SYNC-PROMPT.md` |
| **Image / Design** | Designer | Gemini 3.1 | `briefings/AGENT-PROMPTS-FINAL.md` |
| **Hard Code / Arch** | Clawed | Claude Opus | `CLAUDE.md` |
| **Code Review / QA** | Sentinel | Gemini 3.1 | `briefings/CODEX-TASK-SENTRY.md` |
| **Video / Motion** | Motion | Claude + Remotion | `briefings/CLAUDE-SKILL.md` |
| **Support / Admin** | Ryder | Gemini 3.1 | `briefings/AGENT-PROMPTS-FINAL.md` |
| **Social Posting** | Dispatcher | Chrome Stations | `briefings/chrome-station-prompts.md` |

---

## 🛠️ ROUTING RULES (SCORING)

When a task enters the `TASK-QUEUE-100.md`, Jarvis scores it against these criteria to select the executor:

1. **Safety/Security (Sentinel Score)**:
   - If task involves Stripe, Square, or smart contracts -> **Sentinel (Gemini)** MUST review.
   - If core architecture -> **Jarvis (Opus)** handles.

2. **Visual/Browser (Browser Score)**:
   - If task requires visiting a URL, screenshotting, or dashboard interaction -> **Gemini 3.1** (Station 4).

3. **Inbound Content (Clipper/Scribe)**:
   - YouTube URL -> **Clipper (9020 SSH Script)**.
   - Research report -> **Scribe (Draft Posts)**.

## 📁 TARGET STRUCTURE

- `data/codex-task-queue.json` — The durable state.
- `TASK-QUEUE-100.md` — Human-readable view.
- `scripts/codex_task_sentry.py` — The dispatcher engine.

---

## 💰 COST OPTIMIZATION (THE "CHEAPER" PLAN)

| Requested Agent | Post's Expensive Model | ANTIGRAVITY "Cheaper" Implementation | Monthly Est. |
|-----------------|------------------------|---------------------------------------|--------------|
| **Jarvis Brain** | Opus 4.6 ($200) | **Claude Opus** ($20 fixed) | $20 |
| **Atlas Research**| Claude @ OAuth | **Perplexity Pro** ($20 fixed) | $20 |
| **Scribe Copy** | GLM 5 (API) | **Gemini 3.1 (Me)** | **FREE** |
| **Trendy Scout** | GLM 4.7 (API) | **Perplexity / Gemini Search** | **FREE** |
| **Image Designer**| Nano Banana Pro | **Gemini 3.1 (generate_image)** | **FREE** |
| **Video/Motion** | Higgs/Brok APIs | **Claude + Remotion (Self-hosted)** | **FREE** |
| **Development** | Claude Code + Codex | **Claude Code (Opus)** | **FREE*** |
| **Sentinel Review**| Separate LLM | **Gemini 3.1 (Me)** | **FREE** |
| **Operations** | Poster API | **Chrome Extension Stations** | **FREE** |

**TOTAL ESTIMATED MONTHLY COST: $40 — $60**
(Reduced from $400/mo by 90% while keeping co-founder level intelligence)

*Note: Free tools/tiers are used wherever possible to prioritize keeping the Claude Max subscription alive.*

#ForTheKids 🚀
