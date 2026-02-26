Review the current task and suggest the most cost-effective approach:

**Cost model:**
- Ollama (local on SABRETOOTH): $0 — use for 90% of inference
- Haiku API: ~$0.01/task — use for 5% (quick structured tasks)
- Opus Max (chat + CLI): $200/mo subscription — use for 5% (strategic only)

**Decision framework:**
1. Can Ollama handle this? → Use HEMORzoid endpoints on SABRETOOTH
2. Does it need structured output but isn't complex? → Haiku
3. Does it need deep reasoning, architecture, or customer-facing quality? → Opus
4. Can another AI do this? → Give Josh a prompt for Gemini or Perplexity to save Opus tokens

**HEMORzoid endpoints (all $0):**
- `/crosslist/describe` — product descriptions
- `/crosslist/title` — listing titles
- `/social/tweet` — tweets
- `/social/caption` — captions
- `/support/respond` — customer responses
- `/dating/bio/generate` — profile bios

Report: what the current task costs, what it SHOULD cost, and the recommended approach.
