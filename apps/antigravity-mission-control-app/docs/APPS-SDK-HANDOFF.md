# ANTIGRAVITY ChatGPT App Handoff

This app is the safe local scaffold for an eventual ChatGPT App / MCP server integration.

## Current Phase

- Local HTTP server only.
- Read-only mission status tools.
- Draft-only prompt and handoff generation.
- No secrets, deploys, branch merges, payment changes, social posting, or file deletion.

## Future Apps SDK Wiring

When Josh is ready to publish or connect it directly inside ChatGPT, wire the same tool contract into the official Apps SDK pattern:

- MCP server exposes the tool catalog from `lib/mission-data.mjs`.
- Widget resource points at `public/widget.html`.
- Tool annotations must remain read-only.
- Component metadata should describe the UI as a mission dashboard, not an executor.
- Any tool that sends Slack, deploys Cloudflare, changes Square, or mutates Git must be a separate explicit approval flow.

## Safe Tool Contract

| Tool | Mode | Purpose |
| --- | --- | --- |
| `get_mission_status` | read-only | Return repo roots, lane doctrine, and safe source availability. |
| `read_env_drift_map` | read-only | Summarize placeholder-only env drift evidence. |
| `prepare_codex_execution_prompt` | draft-only | Produce a prompt for real Codex Desktop. |
| `draft_handoff` | draft-only | Produce Slack/Hermes-ready handoff text without sending. |

## Non-Goals

- This is not a replacement for Codex Desktop.
- This is not a wrapper for `ollama launch codex`.
- This is not an autonomous ops agent.
- This is not a secret manager.
- This is not a DAO/token/fundraising surface.

## Official References

- Apps SDK MCP server: https://developers.openai.com/apps-sdk/build/mcp-server
- Apps SDK widget UI: https://developers.openai.com/apps-sdk/build/chatgpt-ui
- OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents
- Codex plugins: https://developers.openai.com/codex/plugins
- Codex automations: https://developers.openai.com/codex/app/automations
