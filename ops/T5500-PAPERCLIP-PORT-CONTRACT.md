# T5500 Paperclip Port Contract

## Canonical ports

| Service | Port | Rule |
|---|---:|---|
| Paperclip clean origin | `3120` | Backed by `https://paperclip-clean.youandinotai.com` |
| Hermes dashboard GUI | `9119` | Reserved. Do not bind OpenClaw here. |
| OpenClaw gateway | `18789` | Paperclip OpenClaw adapter target |
| OmniRoute API for OpenCode | `20128` | Paperclip `opencode_local` agents target this on T5500 |

## T5500 checks

Run in PowerShell on T5500:

```powershell
foreach ($port in 3120,9119,18789,20128) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)"
    [PSCustomObject]@{
      Port = $port
      PID = $proc.ProcessId
      Name = $proc.Name
      Path = $proc.ExecutablePath
      CommandLine = $proc.CommandLine
    }
  }
}
```

Expected:

- `3120`: Paperclip `paperclipai run --config E:/clean/.paperclip-laptop/instances/default/config.json`
- `9119`: Hermes dashboard only
- `18789`: OpenClaw gateway only
- `20128`: OmniRoute API only

## Paperclip agent rule

The Paperclip OpenClaw adapter on `https://paperclip-clean.youandinotai.com` must target OpenClaw on `http://127.0.0.1:18789` from T5500's point of view.

Do not configure any Paperclip OpenClaw agent, webhook, adapter URL, health URL, or tunnel origin to `http://127.0.0.1:9119`.

The Paperclip OpenCode adapters on `https://paperclip-clean.youandinotai.com` must target OmniRoute from T5500's point of view:

```text
http://192.168.0.15:20128/api/v1
```

Paperclip `opencode_local` agents should use base URL `http://192.168.0.15:20128/api/v1` with bearer auth and verified OmniRoute aliases. Default model is `auto/best-coding`.

## Current known failure

Paperclip run output showed:

```text
invalid agent params: at root: unexpected property 'paperclip'
```

That means the current OpenClaw gateway agent configuration is not accepted by the adapter schema. Fix by editing or recreating that Paperclip agent with only the fields expected by the `openclaw_gateway` adapter, and with the gateway URL on port `18789`.

## Preferred cleanup

Keep these Paperclip agents enabled:

- `CEO OmniRoute Local Models via OpenCode`
- `Founding Engineer`
- `OpenCode Self-Hosted Models`

Disable or repair before use:

- `Hermes CEO - clean repo OpenClaw Gateway`: error until the OpenClaw gateway accepts Paperclip's payload schema
- `Hermes Local CEO Adapter`: converted from `hermes_local` to `opencode_local`; needs a successful wake to clear prior error state
- `CEO`: converted from `hermes_local` to `opencode_local`; needs a successful wake to clear prior error state

Do not point any of those broken adapters at Hermes dashboard port `9119` as a workaround.
