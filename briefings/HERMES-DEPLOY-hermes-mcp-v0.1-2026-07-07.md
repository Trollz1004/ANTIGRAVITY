# HERMES BRIEF — Deploy hermes-mcp-server v0.1

**From:** Joshua Coleman (sole authority)
**To:** Hermes Agent, T5500
**Date:** 2026-07-07
**Context:** Opus handoff at `C:\ANTIGRAVITY\briefings\opus-handoff-hermes-mcp-v0.1.md` — build is done, 40/40 unit tests + 13/13 integration checks green. Wire it up on T5500, stage the tunnel, produce paste-ready Claude-surface configs. Do not deploy live surfaces yourself.

## Node lane

- Executes on: **T5500** (Hermes + Coworker home node, live root `C:\ANTIGRAVITY`)
- Sabretooth: **DREAM ONLINE MMORPG only — do not touch**
- Tunnel node: T5500 (already owns public tunnels per doctrine)

## Execute in order. Halt on first failure and report. No retries, no workarounds, no mock data.

### 1. Mint MCP_OAUTH_SECRET

- Confirm `.env.docker` is in `.gitignore` first. If not, add it before anything else.
- Run: `python -c "import secrets; print(secrets.token_hex(32))"`
- Write output to `C:\ANTIGRAVITY\.env.docker` as `MCP_OAUTH_SECRET=<value>`
- **Never print the value in chat. Never commit .env.docker.**

### 2. Add hermes-mcp service to docker-compose.yml

- Pull the snippet from `C:\ANTIGRAVITY\hermes\mcp-server\README.md`
- Append the service block to `C:\ANTIGRAVITY\docker-compose.yml`
- **Do NOT run `docker compose up` yet.** Show me the diff first.

### 3. Cloudflared route on T5500 (stage only)

- Route: `mcp.youandinotai.com → http://localhost:8700`
- Edit the T5500 cloudflared config
- **Do NOT push to Cloudflare edge until I give the go.**
- Show me the diff with any tunnel UUIDs redacted

### 4. First token — WAIT for my explicit go-order

- Command ready: `python C:\ANTIGRAVITY\mint-mcp-token.py --scope full --ttl 30d --sub josh-first-token`
- Do NOT execute until items 1–3 are green and I say go
- When executed: write to `.env.docker` as `MCP_TOKEN_JOSH_FIRST=<value>` — never paste in chat

### 5. Other secrets

- `GITHUB_TOKEN`: check if one already lives in `.env.docker` or the T5500 vault. If not, flag it — I mint it myself.
- `PAPERWEIGHT_AUDIT_URL`: leave blank until Paperweight is live. Log as followup.

### 6. Claude surface wiring — REPORT ONLY, DO NOT TOUCH

Produce three paste-ready config blocks using `mcp.youandinotai.com` as the URL and a placeholder token variable name (never the real token):

- Claude.ai MCP connector settings JSON
- Claude Code `.claude/settings.json` mcp_servers block
- Anthropic API `mcp_servers` array snippet

I wire each surface manually.

## Guardrails (non-negotiable)

- No git push. No merge to main. Stage everything locally on T5500.
- Secrets in `.env.docker` only. Never in chat, never in git, never in memory files.
- Do not touch Sabretooth. Sabretooth is DREAM ONLINE MMORPG lane, isolated.
- No cross with income-engine / AidoesitAll — this is ANTIGRAVITY only.
- Force-with-lease only if you touch git — never `--force`.
- Cloudflare only. Not Netlify.

## Report format when done

1. Green / pending-go-order status per step
2. `docker-compose.yml` diff summary
3. T5500 cloudflared config diff (UUIDs redacted)
4. Three paste-ready Claude-surface config blocks
5. Open followups (GITHUB_TOKEN, PAPERWEIGHT_AUDIT_URL, etc.)
