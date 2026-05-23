# CTO ADR - 2026-05-20 - watchdog sentry

## Context

MINI-ASUS-PC is already running a local watchdog from `C:\Users\joshl\OneDrive\Desktop\antigravity-watchdog`, but it evaluates node-local paths and services as if every node should host the same repo and runtime. That makes the display red for expected reasons and does not give Joshua one trustworthy health board for the platform.

The prior Rule 11 stop was resolved by `briefings/DOCTRINE-CLARIFICATION-2026-05-20-vault-onedrive-sync.md`: OneDrive vault sync to authorized Joshua nodes is intentional succession architecture. The new watchdog treats vault sync as a first-class health signal, using metadata only.

## Decision

Build a Sabretooth-side FastAPI health aggregator on `localhost:11436`, expose it on the local network, and make MINI-ASUS-PC a thin kiosk display that polls `http://192.168.0.8:11436/health/all`.

## Tradeoffs evaluated

| Option | Cost | Latency | Correctness | Reversibility | Doctrine fit |
|--------|------|---------|-------------|---------------|--------------|
| Keep mini-local sentry only | Low | Low | Low; checks wrong authority points | Easy | Weak, because mini becomes truth source |
| Sabretooth aggregator + mini display | Low | Low | High; probes authoritative nodes and services | Easy | Strong |
| Cloud-hosted dashboard | Medium | Medium | Medium; exposes local health through public path | Medium | Weak for local-only visibility |

## Auth model

MINI-ASUS-PC to aggregator is LAN-only and read-only. The aggregator reads vault metadata and API keys only on Sabretooth at runtime. It never logs key values and does not send credential material to MINI-ASUS-PC.

## Vault monitoring

The aggregator monitors:

- authorized-node vault folder presence,
- master env timestamp, file count, and total size drift against Sabretooth,
- OneDrive process/sync availability where observable,
- Microsoft Graph device-list status when read-only Graph credentials exist.

Microsoft Graph is currently blocked because the vault exposes no Graph-specific credential names. The probe must return yellow with a clear reason until a read-only Graph app credential is added.

## Failure modes

- Aggregator down: mini display shows a red stale/offline banner.
- Node SSH down: that node turns red with the SSH error.
- Service port closed: only that service turns red.
- Missing API credentials: affected integration turns yellow/red with a missing-credential reason.
- Vault missing on an authorized Windows node: red.
- Vault present on an unauthorized device from Graph: critical red.

## Rollback plan

Disable the scheduled task and remove the portproxy/firewall entry:

```powershell
Unregister-ScheduledTask -TaskName ANTIGRAVITY-HealthAggregator -Confirm:$false
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=11436
Get-NetFirewallRule -DisplayName "ANTIGRAVITY Health Aggregator 11436" | Remove-NetFirewallRule
```

MINI-ASUS-PC can keep its existing `antigravity-watchdog` folder during the transition.

## Doctrine check

- Rule 1: PASS - one repo, new folders inside `ANTIGRAVITY`.
- Rule 2: PASS - feature branch only, no direct push to main.
- Rule 3: PASS - Sabretooth owns push and aggregator; mini is a display.
- Rule 4: PASS - no Founding Four routing changes.
- Rule 5: PASS - no Claude wrapper.
- Rule 6: PASS - env audit blocks Anthropic key strings.
- Rule 7: PASS - Codex PR requires Joshua manual review.
- Rule 8: PASS - all badges use real probes or fail honestly.
- Rule 9: PASS - no public partnership claims.
- Rule 10: PASS - watchdog display is local-only under `tools/`.
- Rule 11: PASS - vault contents are not read or logged; metadata only.
- Rule 12: PASS - no hook bypass.
- Rule 13: PASS - gives Joshua eyes-on health for the wheel.

## Wheel-test

Revenue this month: no direct revenue. 50-year horizon: yes; it gives Joshua and future stewards a truthful local health surface and detects vault sync drift.

