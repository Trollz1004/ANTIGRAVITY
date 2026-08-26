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

- **Server:** `http://127.0.0.1:1933` (started by `.freebuff/startup.sh`)
- **CLI:** `ov` (status, find, ls, tree, read, add-resource, add-skill, session)
- **MCP:** streamable HTTP at `http://127.0.0.1:1933/mcp` — tools `find`,
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
| Paperclip ops | `viking://resources/paperclip-ceo` |
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
- Server binds loopback only (`127.0.0.1:1933`), auth mode `dev`.
- To re-index after heavy changes: `ov add-resource <path> --force` or see
  server docs for `reindex`.
