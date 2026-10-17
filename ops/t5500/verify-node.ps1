# T5500 node final-state check. Read-only: it probes, it never starts, stops or changes anything.
# Writes ops\t5500\node-final-state.json and prints one line per check.
# Run after a reboot, once the keepalive has had ~5 minutes:  powershell -File ops\t5500\verify-node.ps1

$ErrorActionPreference = 'SilentlyContinue'
$out  = Join-Path $PSScriptRoot 'node-final-state.json'
$results = New-Object System.Collections.Generic.List[object]

function Add-Result($group, $name, $status, $detail) {
  $results.Add([pscustomobject]@{ group = $group; name = $name; status = $status; detail = $detail })
}

function Test-Http($url, $match, $hostHeader) {
  try {
    $h = @{}; if ($hostHeader) { $h.Host = $hostHeader }
    $r = Invoke-WebRequest $url -Headers $h -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 3
    if ($match -and $r.Content -notmatch $match) { return @('WRONG SERVICE', "$($r.StatusCode), identity '$match' not found") }
    return @('UP', "$($r.StatusCode)")
  } catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'no answer' }
    if ($code -in 401, 403) { return @('AUTH MISSING', "$code (answers, needs login)") }
    return @('DOWN', "$code")
  }
}

# 1. Local services, checked by identity, not by the port alone.
$services = @(
  @{ n = 'Ollama :11434 (Fable)';        u = 'http://127.0.0.1:11434/api/tags';   m = 'fable' },
  @{ n = 'Domains server :9160';         u = 'http://127.0.0.1:9160/';            m = '<html'; h = 'onlinerecycle.net' },
  @{ n = 'Date-app frontend :3200';      u = 'http://127.0.0.1:3200/';            m = '<html' },
  @{ n = 'Date-app API :8000';           u = 'http://127.0.0.1:8000/health';      m = 'ok|healthy' },
  @{ n = 'Paperclip :4747';              u = 'http://127.0.0.1:4747/api/health';  m = '"deploymentMode":"authenticated"' },
  @{ n = 'Mission Control :3130';        u = 'http://127.0.0.1:3130/live';        m = '.' },
  @{ n = 'Hermes dashboard :9119';       u = 'http://127.0.0.1:9119/';            m = '(?i)hermes' },
  @{ n = 'OmniRoute :20128';             u = 'http://127.0.0.1:20128/';           m = '.' },
  @{ n = 'Obsidian REST :27123';         u = 'http://127.0.0.1:27123/';           m = '(?i)obsidian' },
  @{ n = 'Hermes gateway API :8643';     u = 'http://127.0.0.1:8643/health';      m = 'hermes-agent' }
)
# Fable must actually run, not just be listed (2026-10-15: Ollama listed it while its runner was missing).
try {
  $b = @{ model = 'joshlcoleman/Fable:latest'; prompt = 'Reply OK'; stream = $false; keep_alive = -1 } | ConvertTo-Json
  $g = Invoke-RestMethod 'http://127.0.0.1:11434/api/generate' -Method Post -Body $b -ContentType 'application/json' -TimeoutSec 150
  Add-Result 'service' 'Fable answers (Ollama runs models)' $(if ($g.response) { 'UP' } else { 'DOWN' }) 'generate returned text'
} catch { Add-Result 'service' 'Fable answers (Ollama runs models)' 'DOWN' (($_.ErrorDetails.Message -replace '\s+', ' ') -replace '^(.{0,120}).*', '$1') }

foreach ($s in $services) { $r = Test-Http $s.u $s.m $s.h; Add-Result 'service' $s.n $r[0] $r[1] }

foreach ($p in @(@{ n = 'PostgreSQL :5432'; p = 5432 }, @{ n = 'Redis :6379'; p = 6379 }, @{ n = 'Paperclip DB :54329'; p = 54329 })) {
  $l = Get-NetTCPConnection -LocalPort $p.p -State Listen | Select-Object -First 1
  if ($l) { Add-Result 'service' $p.n 'UP' (Get-Process -Id $l.OwningProcess).ProcessName } else { Add-Result 'service' $p.n 'DOWN' 'not listening' }
}

$cf = Get-Process cloudflared
Add-Result 'service' 'Cloudflare tunnel (cloudflared)' $(if ($cf) { 'UP' } else { 'DOWN' }) "$(@($cf).Count) process(es)"

# 2. Public domains, from the real URLs.
foreach ($u in 'https://youandinotai.com/', 'https://www.youandinotai.com/', 'https://api.youandinotai.com/health',
               'https://onlinerecycle.net/', 'https://dream-online.net/', 'https://mcp.youandinotai.com/') {
  $r = Test-Http $u $null; Add-Result 'domain' $u $r[0] $r[1]
}

# 3. Every service must come back on its own after a reboot.
$tasks = 'ANTIGRAVITY T5500 Keepalive', 'ANTIGRAVITY Paperclip', 'ANTIGRAVITY OmniRoute', 'ANTIGRAVITY Mission Control',
         'ANTIGRAVITY Hermes Dashboard', 'Hermes_Gateway', 'HermesDailyVideo',
         'ANTIGRAVITY Agent Windows'

# The two watchers: OpenClaw's sentry window and Hermes's support window, plus Hermes's watch cron.
foreach ($w in 'openclaw-sentry.ps1', 'hermes-support.ps1') {
  $p = Get-CimInstance Win32_Process -Filter "Name='powershell.exe' or Name='pwsh.exe'" | Where-Object CommandLine -match [regex]::Escape($w)
  Add-Result 'watchdog' $w $(if ($p) { 'UP' } else { 'DOWN' }) $(if ($p) { "window pid $(@($p)[0].ProcessId)" } else { 'window not running' })
}
$cron = hermes cron list 2>&1 | Out-String
Add-Result 'watchdog' 'Hermes cron: T5500 node watch' $(if ($cron -match 'T5500 node watch' -and $cron -match '\[active\]') { 'UP' } else { 'DOWN' }) 'every 10 min, Telegram only when stuck'
foreach ($t in $tasks) {
  $task = Get-ScheduledTask -TaskName $t
  if (-not $task) { Add-Result 'task' $t 'NOT CONFIGURED' 'no scheduled task'; continue }
  $i = Get-ScheduledTaskInfo -TaskName $t
  # 0 = last run OK, 267009 = running now, 267011 = not run since it was created (runs at next logon).
  $ok = $task.State -ne 'Disabled' -and $i.LastTaskResult -in 0, 267009, 267011
  Add-Result 'task' $t $(if ($ok) { 'UP' } else { 'DOWN' }) ("{0}, last run {1:yyyy-MM-dd HH:mm} rc {2}" -f $task.State, $i.LastRunTime, $i.LastTaskResult)
}

# 4. Keepalive freshness: its status file must be under 15 minutes old.
$st = Join-Path $PSScriptRoot 'status.json'
if (Test-Path $st) {
  $age = [int]((Get-Date) - (Get-Item $st).LastWriteTime).TotalMinutes
  Add-Result 'watchdog' 'Keepalive status.json' $(if ($age -le 15) { 'UP' } else { 'DOWN' }) "$age min old"
} else { Add-Result 'watchdog' 'Keepalive status.json' 'DOWN' 'missing' }

# 5. Tunnel rule: no mission-surface route without a partner (CLAUDE.md).
$cfg = Join-Path $env:USERPROFILE '.cloudflared\config.yml'
$bad = Select-String -Path $cfg -Pattern 'untilnokidinneed' -SimpleMatch
Add-Result 'rule' 'No tunnel route for untilnokidinneed.com' $(if ($bad) { 'DOWN' } else { 'UP' }) $(if ($bad) { "$(@($bad).Count) route line(s) still in config.yml" } else { 'none' })

# 6. Tools the node needs.
foreach ($c in 'hermes', 'claude', 'codex', 'gemini', 'agy', 'grok', 'opencode', 'pi', 'wrangler', 'cloudflared', 'supabase', 'vercel', 'paperclipai') {
  $g = Get-Command $c
  Add-Result 'tool' $c $(if ($g) { 'UP' } else { 'NOT CONFIGURED' }) $(if ($g) { 'installed' } else { 'not installed' })
}

$summary = [ordered]@{
  checked = (Get-Date).ToString('s')
  node    = $env:COMPUTERNAME
  total   = $results.Count
  up      = @($results | Where-Object status -eq 'UP').Count
  notUp   = @($results | Where-Object status -ne 'UP').Count
  results = $results
}
$summary | ConvertTo-Json -Depth 4 | Set-Content -Path $out -Encoding UTF8
$results | ForEach-Object { '{0,-15} {1,-9} {2,-42} {3}' -f $_.status, $_.group, $_.name, $_.detail }
"`n$($summary.up) of $($summary.total) UP. Written to $out"
