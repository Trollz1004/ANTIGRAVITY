# Live Verification Checklist

This checklist is the evidence gate before claiming the full operations goal is
complete.

## Node Restart / Power Loss

Run after a restart on each node:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role Sabretooth
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role T5500
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role WorkerAi
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role WorkerWeb
```

Or from Sabretooth, after node IPs are registered:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\Invoke-AllNodeTopologyVerification.ps1
```

Evidence required:

- JSON report in `C:\antigravity\logs\node-topology-verification-*.json`
- For all-node runs, JSON report in
  `C:\antigravity\logs\all-node-topology-verification-*.json`
- zero `fail` checks
- any `warn` checks explained with a concrete next action

## Node Registration

When the Mini ASUS or i5-6600 nodes come online, register them before routing:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Register-NodeInPool.ps1 -NodeId worker-ai-1 -HostAddress 192.168.0.X -Role ai-adapter-worker -Hardware "i5-6600 32GB"
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Register-NodeInPool.ps1 -NodeId worker-web-1 -HostAddress 192.168.0.Y -Role stateless-web-worker -Hardware "i5-6600 16GB"
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Register-NodeInPool.ps1 -NodeId mini-asus -HostAddress 192.168.0.Z -Role thin-display-manual-checkin -Hardware "Mini ASUS"
```

## DNS / Proxy

Evidence required before saying a domain is routed:

- Cloudflare/Wrangler command output or Cloudflare API result showing the record
  exists.
- T5500 Cloudflared process/service healthy.
- Public URL HTTP status captured.
- Private control surfaces protected by Cloudflare Access if exposed.

Do not route control surfaces publicly without Access.

## Payments

Do not say “charge a transaction” has passed until all are true:

- Joshua explicitly approves the live or sandbox charge attempt.
- The exact product lane is named: date app, Business Exchange, or Online
  Recycle.
- The payment provider environment is confirmed as sandbox or production.
- The transaction id/receipt id is recorded without exposing card data.
- Webhook receipt is confirmed for that lane.

Never use a real card number in chat. Use the provider's documented sandbox test
card only in sandbox mode.

## Current Known Incomplete Items

- Live T5500 restart verification has not been run in this session.
- Live DNS mutation has not been run in this session.
- Date-app transaction has not been charged in this session.
- Business Exchange transaction has not been charged in this session.
- Online Recycle transaction has not been charged in this session.
