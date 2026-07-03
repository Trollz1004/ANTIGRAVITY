# T5500 Node — Gateway Only

> youandinotai.com gateway | Cloudflare tunnels ONLY
> NO Paperclip instance. NO agents. Gateway + FCC only.

## Services (autostart via scripts/node-t5500-autostart.bat)

| Service | Port | Purpose |
|---|---|---|
| FCC proxy | :8082 | Available for ad-hoc claude_local work |
| Cloudflared | tunnel | youandinotai.com DNS |

## Why no Paperclip here

T5500 is the public gateway. It runs Cloudflare tunnels to serve youandinotai.com.
Agents deploy TO it (via wrangler from ant-devops on 9020) but don't run ON it.
FCC is available for ad-hoc work but no scheduled agents.
