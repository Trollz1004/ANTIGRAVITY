# Worker Node Onboarding

Use the Mini ASUS and i5 boxes as worker capacity only. They must not become
Mission Control, Agent Hub, payment webhook owners, DNS owners, database
primaries, or doctrine writers.

## Roles

| Node id | Hardware | Role | Starts |
| --- | --- | --- | --- |
| `worker-web-1` | i5-6600, 16-32 GB RAM | `web` | web/API replicas after targets are confirmed |
| `worker-ai-1` | i5-6600, 16-32 GB RAM | `ai` | OmniRouter on `:11436` and optional configured adapters |
| `mini-asus` | Mini ASUS | `display` | display/manual check-in only |

## Install On Each Worker

1. Put the repo at `C:\antigravity`.
2. Confirm the node can reach Sabretooth Agent Hub:

```powershell
Invoke-WebRequest -UseBasicParsing http://192.168.0.8:3130/health
```

3. Install the worker startup and 30-minute health task:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Install-WorkerNodeTask.ps1 -Role ai -AgentHubUrl http://192.168.0.8:3130
```

Use `-Role web` for `worker-web-1` and `-Role display` for `mini-asus`.

## Register From Sabretooth

After each node has a LAN IP, update the node pool:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Register-NodeInPool.ps1 -NodeId worker-ai-1 -HostAddress 192.168.0.X -Role ai-adapter-worker -Hardware "i5-6600 32GB"
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Register-NodeInPool.ps1 -NodeId worker-web-1 -HostAddress 192.168.0.Y -Role stateless-web-worker -Hardware "i5-6600 16GB"
powershell -NoProfile -ExecutionPolicy Bypass -File C:\antigravity\scripts\workers\Register-NodeInPool.ps1 -NodeId mini-asus -HostAddress 192.168.0.Z -Role thin-display-manual-checkin -Hardware "Mini ASUS"
```

## Fail-Closed Rule

Worker startup and worker health checks call:

```text
http://192.168.0.8:3130/health
```

If Agent Hub is unreachable, workers write `FAIL_CLOSED` to their logs and do
not start or repair worker services. This prevents split-brain task execution.

Worker heartbeat logs are compact JSONL files:

```text
C:\antigravity\logs\worker-<node>-heartbeat.jsonl
```

Each line includes timestamp, node, role, event, status, Agent Hub URL, repo
root, and log path. It does not paste long session context.
