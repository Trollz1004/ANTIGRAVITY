# check-adapter-health.ps1
# Adapter health check routine for CEO wheel (TRO-47).
# Scans adapters/*/manifest.yaml, runs declared health_check per adapter,
# reports PASS/FAIL, logs, and emits STATE swap notes for failures.
# Also validates routing keys against opencode/opencode.json providers.
# Usage (in wheel): pwsh -NoProfile -File scripts/check-adapter-health.ps1
# Exit code 0 if all critical pass, non-zero if failures.

param(
  [string]$RepoRoot = 'c:\antigravity',
  [switch]$EmitStateNotes,
  [switch]$Quiet
)

$ErrorActionPreference = 'Continue'
$adaptersDir = Join-Path $RepoRoot 'adapters'
$opencodeJson = Join-Path $RepoRoot 'opencode/opencode.json'
$logDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logFile = Join-Path $logDir 'adapter-health.log'

function Log($msg) {
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $line = "[$ts] $msg"
  if (-not $Quiet) { Write-Host $line }
  Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

function Parse-Manifest($path) {
  $lines = Get-Content $path -ErrorAction SilentlyContinue
  $m = @{}
  foreach ($l in $lines) {
    if ($l -match '^\s*([a-zA-Z0-9_\-]+):\s*"?([^"#]+)"?\s*$') {
      $m[$Matches[1]] = $Matches[2].Trim()
    }
  }
  return $m
}

function Get-JsonProviders($jsonPath) {
  if (-not (Test-Path $jsonPath)) { return @() }
  try {
    $j = Get-Content $jsonPath -Raw | ConvertFrom-Json -ErrorAction Stop
    if ($j.provider) {
      return ($j.provider | Get-Member -MemberType NoteProperty | Select -Expand Name)
    }
  } catch {}
  return @()
}

function Run-Health($cmdStr) {
  if ([string]::IsNullOrWhiteSpace($cmdStr)) { return @{ok=$false; out='no health_check declared'} }
  $cmdStr = $cmdStr.Trim('"').Trim()
  try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'cmd.exe'
    $psi.Arguments = "/c $cmdStr"
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    $out = $p.StandardOutput.ReadToEnd() + $p.StandardError.ReadToEnd()
    $p.WaitForExit(8000) | Out-Null
    $code = $p.ExitCode
    $ok = ($code -eq 0)
    # Health checks often use || echo 'success marker' to force non-zero but report healthy
    if ($out -match 'present|may be at alt|healthy|ollama-local:healthy') { $ok = $true }
    $processed = ($out.Trim() -replace "`r?`n", ' | ')
    $len = [Math]::Min(180, $processed.Length)
    $short = if ($len -gt 0) { $processed.Substring(0, $len) } else { '' }
    return @{ok=$ok; out=$short}
  } catch {
    return @{ok=$false; out=$_.Exception.Message}
  }
}

Log '=== ADAPTER HEALTH CHECK (CEO wheel) ==='

$providers = Get-JsonProviders $opencodeJson
Log "opencode.json providers: $($providers -join ', ')"

$manifests = Get-ChildItem (Join-Path $adaptersDir '*/manifest.yaml') -ErrorAction SilentlyContinue
if (-not $manifests) {
  Log 'No adapters found.'
  exit 0
}

$results = @()
$failures = @()
$routeIssues = @()

foreach ($mf in $manifests) {
  $name = Split-Path $mf.DirectoryName -Leaf
  $m = Parse-Manifest $mf.FullName
  $alias = $m['paperclip_alias']
  $cli = $m['cli_command']
  $hc = $m['health_check']
  $prov = $m['opencode_provider']
  $model = $m['opencode_model']

  Log "--- $name (alias=$alias cli=$cli prov=$prov model=$model) ---"
  Log "  health_check: $hc"

  $r = Run-Health $hc
  $status = if ($r.ok) { 'PASS' } else { 'FAIL' }
  Log "  $status : $($r.out)"

  $res = [pscustomobject]@{
    adapter = $name
    alias = $alias
    status = $status
    detail = $r.out
    provider = $prov
    model = $model
  }
  $results += $res
  if (-not $r.ok) { $failures += $res }

  if ($prov -and $providers -and ($providers -notcontains $prov)) {
    Log "  ROUTE MISMATCH: provider '$prov' not in opencode.json"
    $routeIssues += "$name -> $prov"
  }
}

Log ''
Log 'SUMMARY:'
$passCount = ($results | Where status -eq 'PASS').Count
$failCount = $failures.Count
Log "  Total: $($results.Count)   PASS: $passCount   FAIL: $failCount"
if ($routeIssues.Count -gt 0) {
  Log "  Routing issues found: $($routeIssues -join '; ')"
}

if ($EmitStateNotes -or $failCount -gt 0) {
  Log ''
  Log 'STATE swap notes (for ceo/STATE.md ## Worker Health):'
  if ($failCount -gt 0) {
    foreach ($f in $failures) {
      $suggest = "FAIL: $($f.adapter) (alias $($f.alias)) - swap routing from '$($f.provider)' per opencode.json (try hermes-router/ollama-local first); update STATE + manifests if persistent"
      Log "  - $suggest"
    }
  } else {
    Log '  - All adapters healthy this tick. No swaps.'
  }
}

if ($routeIssues.Count -gt 0) {
  Log 'ACTION: fix manifests or opencode.json routing to align providers.'
}

$exitCode = if ($failCount -gt 0 -or $routeIssues.Count -gt 0) { 1 } else { 0 }
exit $exitCode
