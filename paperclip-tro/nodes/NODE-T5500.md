# T5500 Node - Front Door + Hermes Workbench

> youandinotai.com DNS + Cloudflare tunnels
> Cloudflared/proxy, date-app public stack, Hermes dashboard/workspace, support gateway, OmniRouter
> NO Agent Hub authority. NO Mission Control authority. NO payment webhook split-brain.
> Mission Control and repo authority live on Sabretooth.

## Services

| Service | Port | Purpose |
|---|---|---|
| Cloudflared | tunnel | Public DNS/front-door |
| Date-app backend | :8000 | Public API/backend on T5500 |
| Date-app frontend | :3200 | Static/frontend gateway when active |
| Node balancer | :4180 | Routes public/stateless traffic to healthy worker nodes |
| Hermes support gateway | :9110 | Date-app support sessions into Sabretooth Agent Hub |
| Hermes dashboard | :9119 | Official Hermes dashboard/API |
| Hermes workspace | :3010 preferred | Hermes workspace moved off contested :3000 |
| OmniRouter | :11436 | Token-saving/API routing layer |
| FCC server | :8082 optional | FCC/OpenCode adapter when this node owns it |

## What runs here

T5500 is the public front door and safe always-on workbench node. It may run
Hermes dashboard/workspace, support gateway, OmniRouter, node balancer, and
Cloudflared. It reports to Sabretooth Agent Hub instead of becoming a second
authority.

## What does NOT run here

Agent Hub authority, Mission Control authority, database primaries, payment
webhook ownership, checkout ownership, repo doctrine, and merge/push decisions.

## Bootstrap

```powershell
cd C:\antigravity
git pull origin main
powershell -ExecutionPolicy Bypass -File scripts\bootstrap-t5500.ps1
```
