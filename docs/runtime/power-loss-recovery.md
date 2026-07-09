# Power Loss Recovery

Goal: every node comes back without creating split-brain authority or annoying
the Sabretooth dev workstation.

## Sabretooth

- Autostart: `scripts/node-sabretooth-autostart.bat`
- Starts: Mission Control and Agent Hub only.
- Does not start: Cloudflared, Hermes loops, FCC/MCP proxies, watchdogs,
  sentries, browser controllers.
- If drift reintroduces cursor-stealing loops, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\Disable-Sabretooth-BackgroundLoops.ps1
```

Install the clean restart task with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\Install-SabretoothControlTask.ps1
```

## T5500

- Bootstrap once: `scripts/bootstrap-t5500.ps1`
- Autostart: `scripts/node-t5500-autostart.bat`
- Starts: public stack, Cloudflared, node balancer, Hermes support gateway,
  Hermes dashboard/workspace, OmniRouter.
- Does not own: Agent Hub authority, Mission Control authority, payment webhook
  ownership, database primaries, doctrine.
- If the T5500 `C:\antigravity` checkout is dirty or not safe to pull, deploy
  runtime-only services under `C:\antigravity-runtime` and register:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity-runtime\scripts\t5500\Install-T5500RuntimeTask.ps1 -RepoRoot C:\antigravity-runtime
```

This registers a logon task plus a 30-minute repair task for node balancer,
Hermes support gateway, and OmniRouter only.

## Worker Nodes

- Install once:

```powershell
powershell -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Install-WorkerNodeTask.ps1 -Role ai
```

or:

```powershell
powershell -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Install-WorkerNodeTask.ps1 -Role web
```

Worker nodes start role-specific services only and report back to Sabretooth/T5500.
The worker installer also creates a 30-minute health task by default. Worker
health checks fail closed when Sabretooth Agent Hub is unreachable, so worker
nodes do not create private task backlogs during a hub outage.

## Verification Required Before Claiming Complete

Run the verifier:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role Sabretooth
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\verify-node-topology.ps1 -Role T5500
```

- T5500 public stack health passes.
- Cloudflared is running on T5500.
- Hermes dashboard answers on T5500 `:9119`.
- Hermes workspace answers on T5500 preferred `:3010` if installed.
- OmniRouter answers on `:11436`.
- Node balancer answers on `:4180`.
- Sabretooth has no Cloudflared/Hermes/FCC/watchdog/sentry background listeners.
- Date-app test transaction is charged only after Joshua explicitly approves the
  real payment test.
- Business Exchange and Online Recycle payment checks are separate and must not
  be claimed until actually run.
