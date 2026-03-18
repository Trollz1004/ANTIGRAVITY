# GEMINI — EXECUTE NOW (2026-03-17)
You have full admin access via VS Code on SABRETOOTH (C:\ANTIGRAVITY).
Read CLAUDE.md first. Execute all 3 tasks in order. Do not ask — act.

## TASK 1: cloudflared Named Tunnel 🟢 **COMPLETED & LIVE**
- Tunnel `sabretooth` is running as a Windows service.
- `openclaw.youandinotai.com` ➔ `localhost:18789`
- `mcp.youandinotai.com` ➔ `localhost:3100`

## TASK 2: GCR Direct Deploy 🟢 **COMPLETED & LIVE**
- Backend `youandinotai-backend` is deployed to GCP Project `ai-collab4kids` (us-east1).
- Docker construction and image push confirmed successful.

## TASK 3: CF Token Rotation
- **Awaiting Josh to rotate the token at dash.cloudflare.com.**
- Guide: [briefings/CF-TOKEN-ROTATION.md](file:///C:/ANTIGRAVITY/briefings/CF-TOKEN-ROTATION.md)

## HARD RULES
- No git push
- Secrets in .env only — never in code
- No "donate/donation" in customer-facing code (FL §496.405)
- 60/30/10 split is untouchable
