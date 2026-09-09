# Remote access to Paperclip

How the AI cores reach [[paperclip]] (127.0.0.1:3100). Decided 2026-08-21, exposure layer NOT built yet.

## The problem

Josh will set up routines/tasks on the core assistants - Perplexity, Claude, Grok, Gemini - that open a browser to Paperclip. Several of those run in the cloud, and a cloud service cannot see localhost. The local embedded Postgres is NOT the blocker (clients only talk to the server over HTTP); network reachability is.

## The plan

- Expose Paperclip as a ported MCP endpoint / tunneled URL upstream, so cloud-based routines can reach it. Candidates: tunnel (Tailscale/cloudflared) or an MCP port in front of the server.
- Keep browser availability as the fallback path in case the local route has issues.
- Prior art: Codex is the only core that ever had a ported MCP server configured on this host (`[mcp_servers.node_repl]` in `~/.codex/config.toml`, verified 2026-08-21). That is a node-REPL MCP, not a Paperclip bridge - use it as the template when porting Paperclip.

## Per-core reachability

| Core | Runs | Path to Paperclip |
|------|------|-------------------|
| Claude (Cowork/routines) | cloud | needs tunnel/ported MCP endpoint |
| Claude-in-Chrome extension | Josh's browser | can reach localhost:3100 today |
| Perplexity | cloud (likely) | needs tunnel/ported MCP endpoint |
| Gemini | unconfirmed | verify, assume cloud |
| Grok | cloud | needs tunnel/ported MCP endpoint |

## Omni-router on sabretooth

The real omni-router for "all AI" runs on the **sabretooth** node, reached by IP + bearer token (decided 2026-08-21). Local node-agent (`C:/node-agent/node-agent.js`) currently falls back to defaults (`http://127.0.0.1:20128`, EMPTY api key) because nothing sets its env. Wiring plan:

- Josh adds `OMNI_ROUTER_URL=http://<sabretooth-ip>:20128` and `OMNI_ROUTER_API_KEY=<bearer>` to the canonical env file `C:/Users/joshl/.env`. Token values live ONLY there, never in this repo.
- node-agent's scheduled task gets a wrapper that loads that env before launching.

## Drift guard

Every core gets the same substrate docs (this repo) so agents stay aligned - the anti-drift "safety helmet". A well-fed agent with current context is a happy agent; a starved one drifts and races. Keep them fed.

## Related

- [[paperclip]]
- [[judges]]
- [[mission-control]]
