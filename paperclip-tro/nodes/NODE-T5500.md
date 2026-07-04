# T5500 Node — Gateway Only

> youandinotai.com DNS + Cloudflare tunnels
> NO Agent Hub. NO Hermes. NO FCC. NO Ollama. NO PostgreSQL.
> All orchestration lives on Sabretooth.

## Services

| Service | Port | Purpose |
|---|---|---|
| Cloudflared | tunnel | youandinotai.com DNS |

## What runs here

Cloudflare tunnel endpoint for youandinotai.com. That's it.
All AI work routes through Sabretooth :3130 (Agent Hub).

## What does NOT run here

Everything else. Agent Hub, Hermes, FCC, Ollama, PostgreSQL, DREAM, Paperclip — all on Sabretooth.

## Bootstrap

```powershell
cd C:\antigravity
git pull origin main
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-t5500.ps1
```
