# Hermes Paperclip 24x7 Handoff Prompt

Hermes, stabilize the ANTIGRAVITY Paperclip stack for 24/7 operation after reboot, crash, or power loss.

Canonical truth:
- Work from `C:\Antigravity`. Windows may display `C:\ANTIGRAVITY`; treat those as the same Sabretooth repo path, not two repos.
- Do not use `C:\ANTIGRAVITY-git` as live truth. That is salvage/archive drift only.
- Paperclip runs locally on `http://127.0.0.1:3100`.
- Paperclip health is `http://127.0.0.1:3100/api/health`.
- Public Paperclip health is `https://paperclip-hq.youandinotai.com/api/health`.
- Paperclip uses embedded Postgres under `C:\Users\joshl\.paperclip\instances\default\db` on port `54329`.
- Cloudflared config is `C:\Antigravity\infra\cloudflare\paperclip-hq.yml` and routes `paperclip-hq.youandinotai.com` to `http://127.0.0.1:3100`.
- Hermes router is `http://127.0.0.1:11435`.
- Local Ollama is `http://127.0.0.1:11434`.

Startup/watchdog files:
- `C:\Antigravity\scripts\autostart-mission.ps1`
- `C:\Antigravity\scripts\paperclip-watchdog.ps1`
- `C:\Antigravity\scripts\hermes-watchdog.ps1`
- `C:\Antigravity\scripts\start-paperclip.ps1`
- `C:\Antigravity\scripts\start-hermes-router.cmd`

Validation commands:
- `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3100/api/health`
- `Invoke-WebRequest -UseBasicParsing https://paperclip-hq.youandinotai.com/api/health`
- `Get-NetTCPConnection -LocalPort 3100,54329,11435 -State Listen`
- `C:\Users\joshl\AppData\Roaming\npm\paperclipai.cmd --version`
- `C:\Users\joshl\AppData\Roaming\npm\wrangler.cmd --version`
- `C:\Users\joshl\AppData\Local\hermes\hermes.cmd --version`

Operating rules:
1. Keep Paperclip on port `3100`. Do not move it to `3101` or `2222` unless Josh explicitly orders a port migration and the Cloudflare tunnel is updated in the same change.
2. Keep `paperclip-hq.youandinotai.com` routed to localhost `3100` through cloudflared.
3. Treat Docker and LiteLLM as optional helpers; they must not block Paperclip startup.
4. Use local/Ollama paths for routine heartbeat and intern/background work.
5. Save Claude/Codex/premium code agents for founder-directed work, security review, major code edits, protected docs, and high-risk repo decisions.
6. Do not edit protected governance files unless Josh explicitly asks.
7. Verify local health, public health, embedded Postgres, cloudflared, Hermes router, and Ollama before declaring the stack healthy.
8. Log outcomes under `C:\Antigravity\logs`.
