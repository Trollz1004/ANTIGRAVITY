<#
.SYNOPSIS
T5500 runtime ops bootstrap: canonical path now E:\ANTIGRAVITY
#>
param([string]$RepoRoot = 'E:\ANTIGRAVITY')
$ErrorActionPreference = 'Continue'
$LogDir = Join-Path $RepoRoot 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$log = Join-Path $LogDir 't5500-runtime-ops.log'
function L($m){ Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format o), $m) -Encoding utf8 }
L '=== T5500 RuntimeOps bootstrap ==='
if (-not (Test-Path $RepoRoot)) { L "Repo missing: $RepoRoot"; exit 1 }
$stack = Join-Path $RepoRoot 'ops\startup\start-stack.ps1'
if (-not (Test-Path $stack)) { L "start-stack missing: $stack"; exit 1 }
L "running $stack"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $stack -RepoRoot $RepoRoot
exit 0
