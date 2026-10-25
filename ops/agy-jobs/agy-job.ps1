<#
  agy-job.ps1 - fire-and-poll runner for agy.

  agy is slow enough that a blocking call times out any remote shell, and a
  PowerShell background job dies when the SSH session closes. So this writes a
  standalone worker script and launches it as a fully detached process, which
  survives the session that started it.

  The prompt is read from a file, so no quoting ever crosses a shell boundary.

  Usage:
     powershell -NoProfile -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\ops\agy-jobs\agy-job.ps1 -JobId t1
     ... -JobId t1 -Model claude-opus-5-5-high -Effort high

  Writes <JobId>.out, <JobId>.err, <JobId>.done, <JobId>.meta beside itself.
  Poll for <JobId>.done; its contents are the exit code.
#>
param(
  [Parameter(Mandatory=$true)][string]$JobId,
  [string]$Model  = 'claude-opus-5-5-high',
  [string]$Effort = 'high',
  [string]$WorkDir = 'C:\ANTIGRAVITY'
)

$ErrorActionPreference = 'Continue'
$jobs = 'C:\ANTIGRAVITY\ops\agy-jobs'
New-Item -ItemType Directory -Force -Path $jobs | Out-Null

$promptFile = Join-Path $jobs "$JobId.prompt"
if (-not (Test-Path $promptFile)) { Write-Output "ERROR: no prompt file at $promptFile"; exit 1 }

$out    = Join-Path $jobs "$JobId.out"
$err    = Join-Path $jobs "$JobId.err"
$done   = Join-Path $jobs "$JobId.done"
$meta   = Join-Path $jobs "$JobId.meta"
$worker = Join-Path $jobs "$JobId.worker.ps1"
Remove-Item $out,$err,$done -ErrorAction SilentlyContinue

@{ jobId=$JobId; model=$Model; effort=$Effort; started=(Get-Date).ToString('o') } |
  ConvertTo-Json | Set-Content $meta -Encoding utf8

# The worker reads the prompt itself, so the text never has to be escaped.
@"
`$ErrorActionPreference = 'Continue'
Set-Location '$WorkDir'
`$p = Get-Content '$promptFile' -Raw
try {
  `$r = `$p | & agy --model=$Model --effort=$Effort --print 2>&1
  (`$r | Out-String) | Set-Content -Path '$out' -Encoding utf8
  "exit=`$LASTEXITCODE" | Set-Content '$done'
} catch {
  (`$_ | Out-String) | Set-Content -Path '$err' -Encoding utf8
  'exit=exception' | Set-Content '$done'
}
"@ | Set-Content $worker -Encoding utf8

$task = "AGY-JOB-$JobId"
schtasks /create /tn $task /tr "powershell -NoProfile -ExecutionPolicy Bypass -File `"$worker`"" /sc once /st 00:00 /f /rl highest | Out-Null
schtasks /run /tn $task | Out-Null

Write-Output "LAUNCHED $JobId  model=$Model  effort=$Effort"
Write-Output "poll:   $out"
Write-Output "marker: $done"

