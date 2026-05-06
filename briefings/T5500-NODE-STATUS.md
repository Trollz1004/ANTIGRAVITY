# T5500 Node Status — VALIDATED

> Last validated: 2026-05-06 (from T5500 elevated PowerShell)
> Validator: Claude Opus 4.7 on T5500
> Closes operator side of `mc-fix-2026-05-06` BLOCKED Task 5

## Identity

| Field | Value |
|------|------|
| Hostname | DESKTOP-H4B53GL |
| LAN IP | 192.168.0.15 |
| Workspace | C:\ANTIGRAVITY |
| Role | THE BRAIN — orchestrator, financial backbone, dating/social platform host |
| SSH from Sabretooth | `ssh joshl@192.168.0.15` (Windows shell) |

## LAN Service Bindings (portproxy + firewall)

Bound via `scripts/t5500/lan-bind.ps1` — idempotent, elevated PowerShell, Private firewall profile only.

| Port | Service | Label | portproxy | Firewall Rule | 0.0.0.0 Listener |
|------|---------|-------|-----------|----------------|-------------------|
| 5432 | postgres | uandinotai-postgres | ✅ | ✅ | ✅ (PID 3576) |
| 6333 | qdrant http | qdrant vector | ✅ | ✅ | ✅ (PID 3576) |
| 6334 | qdrant grpc | qdrant grpc | ✅ | ✅ | ✅ (PID 3576) |
| 6379 | redis | redis cache | ✅ | ✅ | ✅ (PID 3576) |
| 3200 | openclaw | openclaw api | ✅ | ✅ | ✅ (PID 3576) |

All forward `0.0.0.0:<port> -> 127.0.0.1:<port>`. No Docker container touched, no data moved. IP Helper service (`iphlpsvc`) confirmed Running.

## Verify from Sabretooth (192.168.0.8)

```powershell
Test-NetConnection 192.168.0.15 -Port 5432   # expect TcpTestSucceeded : True
Invoke-WebRequest http://localhost:8787/health/t5500 -UseBasicParsing | Select Content
# expect status:"ok" with every sub-service status:"ok" within ~10s
```

## Reverse (UNDO)

Run from elevated PS on T5500:

```powershell
foreach ($p in 5432,6333,6334,6379,3200) {
    netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$p
}
Get-NetFirewallRule -DisplayName "T5500 LAN *" | Remove-NetFirewallRule
```

## Remaining Blockers

- **Paperclip cred mismatch on Sabretooth** (`cl_user`) — unblock with `paperclipai configure --section database`. Not a T5500 issue.

## Notes for Future Claude

- T5500 = primary remote node SSH'd from Sabretooth via Chrome Remote Desktop.
- Public-network firewall profile remains denied — only Private allows these ports.
- Re-running `lan-bind.ps1` is safe (skip-if-present logic on every step).
- If a new cockpit-watched service is added on T5500, edit `$services` array at top of the script and re-paste.
