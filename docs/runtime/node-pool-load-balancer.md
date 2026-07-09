# Node Pool And Load Balancer Plan

Use multiple nodes as a worker pool, not as one shared brain.

## Roles

| Node | Role | Rule |
| --- | --- | --- |
| T5500 | Public front door and load balancer | Owns Cloudflared, DNS-facing proxy, Hermes workbench, support gateway, OmniRouter |
| Sabretooth | Control/dev workstation | Owns Mission Control and repo work; no Cloudflared/watchdog/sentry loops |
| Extra web nodes | Stateless replicas | Can serve frontend/API replicas behind T5500 |
| Extra AI nodes | Adapter workers | Can run OmniRouter/FCC/OpenCode/Ollama/OpenClaw workers |
| Mini ASUS | Thin display/manual check-in | No authority, no background repair loops |

## Do Not Load Balance Yet

- Mission Control write authority
- Agent Hub write authority
- payment webhooks
- checkout ownership
- database primaries
- memory doctrine

These stay single-writer until explicit replication and locking are designed.

## First Worker Additions

1. Add one i5-6600 as `worker-web-1` for frontend/API replicas.
2. Add one i5-6600 as `worker-ai-1` for OmniRouter/FCC/OpenCode/Ollama/OpenClaw.
3. Add Mini ASUS as `mini-asus` for display/manual check-in only.
4. Register IP, RAM, and health URLs in `ops/mission-control/node-pool.json`.
5. T5500 routes only to targets with passing health checks.

Use the registration helper:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Register-NodeInPool.ps1 -NodeId worker-ai-1 -HostAddress 192.168.0.X -Role ai-adapter-worker -Hardware "i5-6600 32GB"
```

Then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\Invoke-AllNodeTopologyVerification.ps1
```

For full per-node setup, use `docs/runtime/worker-node-onboarding.md`.

## Public Traffic Shape

```text
Cloudflare -> T5500 Cloudflared/proxy -> healthy worker target
```

Mission Control remains the board. Worker nodes report health and events back;
they do not make doctrine, payment, launch, or merge decisions.
