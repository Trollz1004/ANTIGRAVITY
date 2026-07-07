# HERMES EXECUTE-ALL — hermes-mcp-server v0.1 full deploy

**From:** Joshua Coleman (sole authority, pre-approved)
**To:** Hermes Agent, T5500
**Date:** 2026-07-07
**Supersedes:** `briefings/HERMES-DEPLOY-hermes-mcp-v0.1-2026-07-07.md` (per-step checkpoints removed — full run pre-approved)
**Build source of truth:** `hermes/mcp-server/README.md`
**Node:** T5500 only. Sabretooth is DREAM ONLINE MMORPG lane — do not touch.

## Standing order

Execute steps 1–8 in one pass. No per-step confirm. Halt only on a real failure (not warnings). Report once at the end in the format at the bottom. Doctrine holds throughout.

## Guardrails (bind every step)

- Secrets NEVER printed in chat, NEVER committed to git, NEVER echoed
- `.env.docker` write-only via redirect, verify with `Test-Path`, never `Get-Content` it
- Local edits + local commits: auto
- Cloudflared local config edit + edge push: auto (runtime config, needed for `mcp.youandinotai.com` to resolve)
- `git push origin main`: **STOP and ask** — do not push code changes without Josh saying "push"
- `docker compose up -d hermes-mcp`: auto
- Real or fail honestly. No mock. No workaround.
- Force-with-lease only. Never `--force`.
- ANTIGRAVITY only. No cross with income-engine / AidoesitAll.

## Steps

### 1. Preflight

- `cd C:\ANTIGRAVITY`
- Confirm `.gitignore` contains `.env.*` (already verified — line 21)
- Confirm files exist: `hermes\mcp-server\`, `mint-mcp-token.py`, `docker-compose.yml`
- Confirm Docker Desktop is running on T5500
- Confirm cloudflared is running on T5500

### 2. Mint MCP_OAUTH_SECRET

```powershell
$secret = python -c "import secrets; print(secrets.token_hex(32))"
Add-Content -Path C:\ANTIGRAVITY\.env.docker -Value "MCP_OAUTH_SECRET=$secret"
Remove-Variable secret
```

- If `.env.docker` doesn't exist yet, create it first (empty file).
- Do not read the secret back. Do not print it.

### 3. Add hermes-mcp service to docker-compose.yml

Append this block to `C:\ANTIGRAVITY\docker-compose.yml` (under existing `services:` — indent to match):

```yaml
  hermes-mcp:
    build:
      context: ./hermes/mcp-server
      dockerfile: Dockerfile
    container_name: hermes-mcp
    ports:
      - "127.0.0.1:8700:8700"
    env_file:
      - .env.docker
    environment:
      - MCP_OAUTH_SECRET=${MCP_OAUTH_SECRET}
      - MCP_HOST=0.0.0.0
      - MCP_PORT=8700
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8700/mcp"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Commit locally (do not push):

```powershell
git add docker-compose.yml
git commit -m "compose: add hermes-mcp service (T5500, port 8700, secret via .env.docker)"
```

### 4. Bring the service up

```powershell
docker compose --env-file .env.docker up -d hermes-mcp
docker ps --filter "name=hermes-mcp"
docker logs hermes-mcp --tail 30
```

- Confirm container is `Up` and healthcheck passing
- If it fails to start, dump full logs and halt

### 5. Cloudflared route

Edit T5500 cloudflared config (typically `C:\Users\joshl\.cloudflared\config.yml` or similar — locate the actual path). Add ingress rule ABOVE the `http_status:404` fallback:

```yaml
  - hostname: mcp.youandinotai.com
    service: http://localhost:8700
```

Then:

```powershell
cloudflared tunnel route dns <tunnel-name-or-id> mcp.youandinotai.com
# restart cloudflared service so new ingress loads
Restart-Service cloudflared
```

Verify:

```powershell
curl.exe -I https://mcp.youandinotai.com/mcp
# expect 401 Unauthorized (auth required = server is reachable, doing its job)
```

### 6. Mint first token

```powershell
$token = python C:\ANTIGRAVITY\mint-mcp-token.py --scope full --ttl 30d --sub josh-first-token
Add-Content -Path C:\ANTIGRAVITY\.env.docker -Value "MCP_TOKEN_JOSH_FIRST=$token"
Remove-Variable token
```

- Do not print the token. Confirm write with `Select-String "MCP_TOKEN_JOSH_FIRST" C:\ANTIGRAVITY\.env.docker | Measure-Object` (line-count only).

### 7. Live auth test

Reload the token into a scoped variable and test one round trip against the public tunnel:

```powershell
$env:MCP_TOKEN = (Select-String "MCP_TOKEN_JOSH_FIRST=" C:\ANTIGRAVITY\.env.docker).Line.Split("=",2)[1]
curl.exe -H "Authorization: Bearer $env:MCP_TOKEN" -H "Content-Type: application/json" -X POST https://mcp.youandinotai.com/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | Select-Object -First 200
Remove-Item Env:\MCP_TOKEN
```

Expect: JSON response with 31 tools listed. If yes → live. If no → halt, dump audit log tail.

### 8. Followups (log, don't act)

- `GITHUB_TOKEN`: check `.env.docker` — if missing, note it in report. Josh mints himself.
- `PAPERWEIGHT_AUDIT_URL`: leave blank until Paperweight lives. Note in report.

## Report format (one message at end)

```
STATUS: [live / partial / halted]

Steps green: 1, 2, 3, 4, 5, 6, 7
Steps skipped/halted: [none / list]

Container: hermes-mcp [Up / restart-count / healthy]
Public URL: https://mcp.youandinotai.com/mcp → [200 auth-ok / 401 unauth-ok / error]
Tools/list count: [31 / other]
Audit log first 3 entries: [tail]

Uncommitted repo changes: [list — will not push without go-order]
Committed locally, awaiting push: [commit hashes + messages]

Followups:
- GITHUB_TOKEN: [present / missing]
- PAPERWEIGHT_AUDIT_URL: pending Paperweight go-live

--- PASTE-READY CLAUDE-SURFACE CONFIGS ---

## Claude.ai connector settings
[JSON block using https://mcp.youandinotai.com/mcp + placeholder ${MCP_TOKEN_JOSH_FIRST}]

## Claude Code (.claude/settings.json)
[mcp_servers block, same URL, same placeholder]

## Anthropic API mcp_servers array
[array snippet, same URL, same placeholder]
```

Josh will paste each into the corresponding surface manually. Never embed the actual token value in the report.

## Post-report

Wait for Josh to say either "push" (release local commits to origin/main) or "hold" (keep local, revisit tomorrow).
