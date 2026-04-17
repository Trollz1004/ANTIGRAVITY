# HERMES — Portable Field Agent
**Version 1.0 | Built 2026-04-16 | Lives on Kraken (I:)**

---

## What is HERMES?

HERMES is OPUS's field agent — a portable, autonomous marketing operative that lives on the Kraken USB drive (I:). Where OPUS (T5500) is the brain that strategizes and architects, HERMES is the hands that execute: posting, engaging, monitoring, and reporting back.

HERMES survives context loss. If OPUS goes down, HERMES keeps running on the task queue. If you move to a different node, plug in Kraken and HERMES comes with you.

---

## File Structure

```
I:/HERMES/
├── HERMES.md              ← You are here (identity + chain of command)
├── README.md              ← This file
├── config.json            ← All AI sources + social APIs
├── memory/                ← Persistent memory system
│   ├── auto-memory.md     ← Josh's personality + preferences
│   ├── project.md         ← Active campaigns + goals
│   ├── feedback.md        ← What worked/failed
│   └── reference.md       ← External system pointers
├── tasks/
│   ├── queue.json         ← Pending tasks
│   └── history.json       ← Completed tasks
├── inbox/
│   └── messages.json       ← OPUS → HERMES messages
├── scripts/
│   ├── START-HERMES.bat   ← Launch HERMES loop
│   ├── STATUS.bat         ← Quick status check
│   └── POST-TASK.bat      ← Add task to queue
├── logs/
│   ├── activity.log       ← All actions
│   └── error.log          ← Errors only
├── hermes_loop.py         ← Autonomous loop daemon
└── hermes_status.py      ← Status reporter
```

---

## Quick Start

### On Any Node
1. Plug in Kraken (I:)
2. Run `I:/HERMES/scripts/START-HERMES.bat`
3. Or directly: `python I:/HERMES/hermes_loop.py`

### Check Status
```
python I:/HERMES/hermes_status.py
```

### Add a Task
```
I:/HERMES/scripts/POST-TASK.bat twitter "your post text here"
```

---

## AI Sources Available

HERMES can fall back to any of these AI sources:

| Source | Endpoint | Models |
|---|---|---|
| Claude Opus (primary) | api.anthropic.com | opus-4-6, sonnet-4-6, haiku-4-5 |
| OpenAI (paid) | api.openai.com/v1 | gpt-4o, gpt-4o-mini |
| Google Gemini | generativelanguage.googleapis.com | gemini-2.5-pro, gemini-2.5-flash |
| Ollama Cloud (paid) | api.ollama.cloud/v1 | llama4, qwen4, mistral, codellama, phi4 |
| Ollama Local | localhost:11434 | llama4, qwen4, mistral, codellama, phi4 |
| Groq | api.groq.com | llama-4-scout, llama-4-maverick |
| Perplexity | api.perplexity.ai | sonar, sonar-pro, sonar-reasoning |
| DeepSeek | api.deepseek.com | deepseek-chat, deepseek-coder |
| xAI | api.xai.com | grok-2, grok-2-mini |
| Azure OpenAI | your-resource.openai.azure.com | gpt-4o, gpt-4o-mini |

---

## Social APIs

| Platform | API | Status |
|---|---|---|
| Twitter/X | X API v2 (tweepy) | Configured in config.py |
| Instagram | Meta Graph API | Configured |
| LinkedIn | LinkedIn API | Stub — use MCP Chrome |
| Reddit | Reddit API v1 | Pending credentials |
| Meta/Ads | Meta Business SDK | Available |

---

## Chain of Command

```
Josh (CEO)
  └─ OPUS [T5500] — THE BRAIN, orchestrator
       └─ HERMES [I: Kraken] — field agent, portable
            ├─ Gemini 3.1 — browser, React
            ├─ Comet (Perplexity) — research
            └─ CodeX — financial infra
```

---

## Mission

**YouAndINotAI.com launch — April 4, 2026**
- Human-verified dating app
- 60% revenue to Shriners Children's (contractual disbursement)
- Bot-Shield + Plaid verification
- Revenue target: $19,990 pre-order

---

## Key Rules

- §496.405: NEVER say "donate" — say "contractual revenue disbursement"
- Tone: bland, quirky, human — NOT corporate
- 5 engagement actions per session max (avoid shadow bans)
- All platforms logged in on MCP Chrome tab group 1292213114 (Node 9020)

---

**HERMES v1.0 — Built by OPUS — For Josh — 2026-04-16**
