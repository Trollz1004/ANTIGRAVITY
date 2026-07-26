# Live Paperclip URL (T5500 + Cloudflare)

**Node:** T5500 (`DESKTOP-H4B53GL` / `192.168.0.15`)  
**Repo bound:** https://github.com/Trollz1004/clean (`E:\clean`)  
**Local API:** `http://127.0.0.1:3120`  
**Public URL (Cloudflare tunnel):**

## https://paperclip.youandinotai.com

Alias: https://paperclip-clean.youandinotai.com

### Health

```bash
curl -sS https://paperclip.youandinotai.com/api/health
# expect: "status":"ok"
```

### Wiring

| Piece | Value |
|-------|--------|
| Tunnel | `hermes-t5500` (`68a2e766-30a6-4e30-b36e-d56b742a29f6`) |
| Config | `C:\Users\joshl\.cloudflared\hermes-t5500.yml` |
| Origin | `http://127.0.0.1:3120` |
| Paperclip config | `E:\clean\.paperclip-laptop\instances\default\config.json` |
| Start | `paperclipai run --config E:\clean\.paperclip-laptop\instances\default\config.json` |
| Branch | `main` only |

### Notes

- This is a **Cloudflare Tunnel hostname** (live app), not a static Cloudflare Pages deploy.
- DNS CNAME → tunnel is live.
- Allowed hostnames include `paperclip.youandinotai.com` and `paperclip-clean.youandinotai.com`.
