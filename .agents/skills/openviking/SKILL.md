---
name: openviking
description: Use the OpenViking context database (viking:// virtual filesystem) to store and retrieve agent memory, knowledge, and skills with hierarchical L0/L1/L2 loading. Use when an agent needs long-term context, needs to remember something across sessions, wants to reduce context bloat, or needs to find prior decisions/knowledge. Also use to commit session learnings into shared memory.
---

# OpenViking — The Context Database

OpenViking unifies agent memory, knowledge RAG, and skills into one virtual
filesystem (`viking://`) with three loading tiers:

- **L0 (abstract)** — one-sentence summary, ~100 tokens. Quick relevance check.
- **L1 (overview)** — structure and key points, ~2k tokens. For planning.
- **L2 (details)** — full content, loaded only when needed.

This is the answer to context bloat: heartbeats and session starts load L0/L1
locations, never full content. Full content is pulled on demand.

## Service

- **Server:** `http://192.168.0.15:1933` (T5500 node service)
- **CLI:** `ov` (status, find, ls, tree, read, add-resource, add-skill, session)
- **MCP:** streamable HTTP at `http://192.168.0.15:1933/mcp` — tools `find`,
  `search`, `read`, `tree`, `remember`, `write`, `edit`, `add_resource`,
  `grep`, `glob`
- **Config:** `~/.openviking/ov.conf` (Ollama: `ollama/nomic-embed-text`
  embeddings, `ollama/ornith-1.5:9b` VLM — fully local, no external keys)
- **CLI client config:** `~/.openviking/ovcli.conf`

## Seeded Knowledge (already indexed)

| Source | viking:// URI |
|---|---|
| Agent skills/journals/memory | `viking://resources/agents` |
| Obsidian vault (defe808dbc475855) | `viking://resources/defe808dbc475855` |
| Briefings | `viking://resources/briefings` |
| Mission OS ops | `viking://resources/mission-os` |
| Canonical record site | `viking://resources/openai-canonical-record.trollz1004.chatgpt.site` |
| YouAndINotAI galaxy studio | `viking://resources/youandinotai-galaxy.ai.studio` |

## Daily Agent Protocol

1. **Session start — recall, don't reload.** Before loading large files, run
   `ov find "<task topic>"` to check if the knowledge already exists as
   L0/L1. Read L1 overviews before L2 files. This is the anti-hallucination
   move: verify against the knowledge base instead of pattern-matching.
2. **Commit learnings.** At the end of meaningful work, commit the session so
   OpenViking extracts long-term memory:
   ```bash
   ov session --help   # create/add/commit a session
   ```
   Or via MCP: `remember` (store a memory), `write` (write a file in the
   viking filesystem).
3. **Add new knowledge.** New briefings, decisions, or docs go into the
   filesystem:
   ```bash
   ov add-resource <path-or-url>   # --wait to block for semantic processing
   ```
4. **Keep heartbeats lean.** Heartbeats reference locations (L0/L1), never
   paste full context. If a heartbeat, tool dump, or skills file is bloating
   session context, the setup is wrong — move the content into OpenViking and
   reference it.

## Verification Before Claiming

- `ov status` — server healthy, models available
- `ov find "<query>"` — semantic retrieval actually returns results
- `ov tree viking://resources/<uri>` — resources indexed
- Never claim "context is managed" without a real `ov find` result cited.

## Notes

- Fully local (Ollama) — no API keys, no external data egress. Do not swap to
  a cloud provider without Joshua's instruction.
- Server binds T5500 (`192.168.0.15:1933`), auth mode `dev`.
- To re-index after heavy changes: `ov add-resource <path> --force` or see
  server docs for `reindex`.
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
