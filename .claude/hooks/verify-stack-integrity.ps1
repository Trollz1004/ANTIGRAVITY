# verify-stack-integrity.ps1 - checks the stack for every failure mode that
# has actually taken it down. Read-only: starts nothing, kills nothing.
#
#   stack-status.ps1  answers "is it running?"
#   this script       answers "is it running CORRECTLY?"
#
# Exit 0 = clean, 1 = at least one FAIL. Safe to run any time, any node.

$ErrorActionPreference = 'SilentlyContinue'
$fail = 0; $warn = 0

function Ok   ($m){ Write-Host "  PASS  $m" -ForegroundColor Green }
function Bad  ($m,$fix){ Write-Host "  FAIL  $m" -ForegroundColor Red; if($fix){Write-Host "        fix: $fix" -ForegroundColor DarkGray}; $script:fail++ }
function Warn ($m,$fix){ Write-Host "  WARN  $m" -ForegroundColor Yellow; if($fix){Write-Host "        fix: $fix" -ForegroundColor DarkGray}; $script:warn++ }
function Head ($m){ Write-Host ''; Write-Host "  $m" -ForegroundColor Cyan }

Write-Host ''
Write-Host '  ANTIGRAVITY STACK INTEGRITY' -ForegroundColor Cyan

# ── 1. shell environment ──────────────────────────────────────────────────
# A leaked PORT is what caused the 2026-07-31 crash loop: process env beats
# every config file, so services bound the wrong port and restarted forever.
Head 'Environment'
if ($env:PORT) { Bad "PORT=$env:PORT is set in this shell" 'open a fresh terminal before starting any service' }
else { Ok 'no leaked PORT in this shell' }

# ── 2. secrets that are not actually secrets ──────────────────────────────
# A dashboard can save its own redaction back over a live key. The config
# then looks configured and fails authentication silently.
Head 'Credentials'
$cfgs = @(
  "$env:LOCALAPPDATA\hermes\config.yaml",
  "$env:USERPROFILE\.omniroute\.env",
  "$env:USERPROFILE\.env",
  'C:\ANTIGRAVITY\mission-control-v5\server\.env'
)
$masked = 0
foreach ($c in $cfgs) {
  if (-not (Test-Path $c)) { continue }
  foreach ($line in Get-Content $c) {
    if ($line -match '(api_key|_KEY|_TOKEN)\s*[:=]\s*\S*\.\.\.\S*') {
      Bad "masked value saved as a real credential in $(Split-Path $c -Leaf): $($matches[1])" 'replace with the real key - dots mean a UI redaction was written back'
      $masked++
    }
  }
}
if ($masked -eq 0) { Ok 'no masked/redacted values saved as credentials' }

# ── 3. one of everything ──────────────────────────────────────────────────
# Two gateways on one config file is how openclaw.json got clobbered.
Head 'Single-instance rules'
$gw = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'openclaw.*gateway' })
if ($gw.Count -gt 1) { Bad "$($gw.Count) OpenClaw gateways running" 'OpenClaw owns :18789 (factory port) - kill the extras' } else { Ok 'single OpenClaw gateway' }
$omni = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'omniroute.*(serve|server-ws)' })
if ($omni.Count -gt 2) { Warn "$($omni.Count) OmniRoute processes - desktop app AND CLI may both be running" 'run one or the other, not both' } else { Ok 'OmniRoute instance count sane' }

# ── 4. paths that point at nothing real ───────────────────────────────────
Head 'Paths'
# C:\ANTIGRAVITY is the one live root. An ANTIGRAVITY tree on any other drive is
# an archive clone from an older disk - writing there loses work silently.
$clones = @(Get-Volume | Where-Object { $_.DriveLetter -and $_.DriveLetter -ne 'C' } |
            ForEach-Object { "$($_.DriveLetter):\ANTIGRAVITY" } | Where-Object { Test-Path $_ })
if ($clones) { foreach ($c in $clones) { Warn "archive clone on disk: $c" 'live root is C:\ANTIGRAVITY - agents writing to the clone lose work silently' } }
else { Ok 'no ANTIGRAVITY archive clone on a second drive' }
$hermesCfg = "$env:LOCALAPPDATA\hermes\config.yaml"
if (Test-Path $hermesCfg) {
  $raw = Get-Content $hermesCfg -Raw
  if ($raw -match 'cwd:\s*(\S+)') {
    $cwd = $matches[1]
    if ($cwd -match '^[A-Za-z]:[^\\/]') { Bad "Hermes cwd '$cwd' is missing its separator" 'a drive letter without a backslash means "current dir on that drive"' }
    elseif ($cwd -notmatch '(?i)^C:\\ANTIGRAVITY') { Warn "Hermes cwd is '$cwd'" 'expected C:\ANTIGRAVITY' }
    else { Ok "Hermes cwd = $cwd" }
  }
  if ($raw -match 'db_path:\s*(\S+)') {
    $db = $matches[1] -replace '^~', $env:USERPROFILE
    $dbExp = [Environment]::ExpandEnvironmentVariables($db) -replace '/', '\'
    if (-not (Test-Path $dbExp)) { Bad "Hermes memory db_path points at a file that does not exist: $($matches[1])" 'repoint db_path at a live profile, or memory silently starts empty' }
    else { Ok 'Hermes memory db_path resolves to a real file' }
  }
}

# ── 5. model tags that do not exist ───────────────────────────────────────
# A bare tag like "ornith" 404s where "ornith:9b" works, killing the whole
# fallback chain the moment the primary provider hiccups.
Head 'Model routing'
$tags = @()
try { $tags = (Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 6).models.name } catch {}
if ($tags.Count -eq 0) { Warn 'Ollama not reachable - cannot verify local model tags' 'ollama serve' }
else {
  $referenced = @()
  foreach ($f in @($hermesCfg, 'C:\ANTIGRAVITY\mission-control-v5\server\.env')) {
    if (Test-Path $f) { $referenced += ([regex]::Matches((Get-Content $f -Raw), '(?m)(?:EXEC_\w*MODEL=|model:\s*)([a-z0-9._\-]+:?[a-z0-9._\-]*)') | ForEach-Object { $_.Groups[1].Value }) }
  }
  $local = $referenced | Where-Object { $_ -match '^(ornith|gemma|qwen|llama|nomic)' } | Select-Object -Unique
  $bad = $local | Where-Object { $_ -notin $tags }
  if ($bad) { foreach ($b in $bad) { Bad "model '$b' is referenced but not installed in Ollama" "installed: $($tags -join ', ')" } }
  else { Ok "all referenced local models exist ($($local.Count) checked)" }
}

# ── 6. backups exist and are recent ───────────────────────────────────────
Head 'Backups'
$vault = "$env:USERPROFILE\OneDrive\Personal Vault-Laptop\hermes-memory-rescue-20260731"
$arch  = "$env:USERPROFILE\hermes-archive-20260731"
foreach ($b in @(@{p=$vault;n='memory rescue'}, @{p=$arch;n='session archive'})) {
  if (Test-Path $b.p) {
    $newest = (Get-ChildItem $b.p -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
    $age = [math]::Round(((Get-Date) - $newest.LastWriteTime).TotalDays,1)
    if ($age -gt 7) { Warn "$($b.n) backup is $age days old" 'run backup-critical.ps1' } else { Ok "$($b.n) backup is $age days old" }
  } else { Warn "$($b.n) backup missing" 'run backup-critical.ps1' }
}

# ── 7. config files still parse ───────────────────────────────────────────
Head 'Config syntax'
foreach ($j in @("$env:USERPROFILE\.openclaw\openclaw.json", 'C:\ANTIGRAVITY\.mcp.json')) {
  if (Test-Path $j) {
    try { Get-Content $j -Raw | ConvertFrom-Json | Out-Null; Ok "$(Split-Path $j -Leaf) parses" }
    catch { Bad "$(Split-Path $j -Leaf) is invalid JSON" 'restore from the newest .bak beside it' }
  }
}

# ── 8. public edge actually serves ────────────────────────────────────────
# A healthy tunnel still 403s when the origin rejects the hostname, so check
# the public URL, never just the tunnel process.
Head 'Public edge'
try {
  $r = Invoke-WebRequest 'https://youandinotai.com/' -UseBasicParsing -TimeoutSec 20
  if ($r.StatusCode -eq 200) { Ok 'youandinotai.com serves HTTP 200' } else { Warn "youandinotai.com returns HTTP $($r.StatusCode)" }
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq 403) { Bad 'youandinotai.com returns 403 - tunnel is up but the origin rejects the hostname' "add the host to server.allowedHosts in frontend\react-app\server.ts" }
  else { Warn "youandinotai.com unreachable ($code)" 'check the cloudflared tunnel' }
}

Write-Host ''
if ($fail -eq 0 -and $warn -eq 0) { Write-Host '  INTEGRITY: clean' -ForegroundColor Green }
elseif ($fail -eq 0) { Write-Host "  INTEGRITY: $warn warning(s), no failures" -ForegroundColor Yellow }
else { Write-Host "  INTEGRITY: $fail failure(s), $warn warning(s)" -ForegroundColor Red }
Write-Host ''
exit $(if ($fail -gt 0) { 1 } else { 0 })
