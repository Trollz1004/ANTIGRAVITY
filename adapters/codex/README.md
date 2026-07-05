# Codex Adapter

Paperclip alias: `codex`

CLI: `codex`

Provider: codex (via OpenAI auth sign-in). opencode_provider: "codex" model codex-mini-5.3.

No OpenAI API key is required for this adapter. Use the signed-in Codex Desktop
session / Codex auth-login lane.

Separation: For high-quality Codex Desktop auth path. Assign to agents needing OpenAI-grade via Codex only. Distinct from raw openai or opencode paths.

Declare in agent AGENT.md: adapter: codex

See opencode/opencode.json "codex" block for model list.
