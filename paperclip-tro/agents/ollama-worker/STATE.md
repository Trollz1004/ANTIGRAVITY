# STATE — ollama-worker
> Max 4k tokens. Read on start. Write on exit ONLY. Timestamp every write.
> Failure to timestamp = platform deletion. Joshua audits this.
> updated: 2026-07-09T07:41:00Z

## Last Session
- Agent files created: HEARTBEAT.md, AGENT.md, STATE.md (initial setup 2026-07-09)
- Role: free local GPU inference; cost_saver lane via OmniRouter :11436 → Ollama :11434 on T5500

## Decisions
- Max 3 concurrent sessions (Ollama local concurrency limit)
- Default model: llama3.3:latest — update AGENT.md if swapping
- Returns drafts only — CEO/hermes-ceo reviews before any production use

## Learned
- (none yet — first session)

## Blocked
(none)
