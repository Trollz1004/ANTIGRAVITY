<#
.SYNOPSIS
    Copy the Hermes pipeline out of the repo so a second wipe is survivable.

.DESCRIPTION
    The 2026-09-13 wipe cost 26 days of mornings because the only copy of the
    pipeline's logic lived in ops/hermes, which is untracked, and the .pyc files
    that carry that logic are matched by .gitignore's `*.pyc`. There was nothing
    to restore from.

    Until the bytecode is force-added to git (a repo-policy call for the user),
    this script is the stopgap: a timestamped copy outside C:\ANTIGRAVITY of
    everything that cannot be regenerated.

    Nothing here is destructive -- it only reads the repo and writes a new
    timestamped folder.

.PARAMETER Destination
    Backup root. Default is the runtime root, which the wipe did not touch.

.PARAMETER Keep
    How many timestamped backups to retain. Default 10.

.EXAMPLE
    .\backup-pipeline.ps1
    .\backup-pipeline.ps1 -Destination E:\hermes-backups
#>
[CmdletBinding()]
param(
    [string] $Destination = (Join-Path $env:USERPROFILE 'Documents\ANTIGRAVITY-RUNTIME\hermes-pipeline-backup'),
    [int]    $Keep = 10
)

$ErrorActionPreference = 'Stop'

$repo = 'C:\ANTIGRAVITY'

# Only things that cannot be regenerated from the repo or the feed.
$sources = @(
    'ops\hermes\newsvideo',
    'ops\hermes\_recovery',
    'ops\hermes\tests',
    'ops\hermes\RECOVERY-STATE.md',
    'ops\hermes\UNATTENDED.md',
    'ops\hermes\requirements-recovered.txt',
    'scripts\hermes-youtube'
)

$stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path $Destination $stamp
New-Item -ItemType Directory -Path $target -Force | Out-Null

$copied = 0
foreach ($rel in $sources) {
    $src = Join-Path $repo $rel
    if (-not (Test-Path $src)) {
        Write-Output "  skip (absent): $rel"
        continue
    }
    $dst = Join-Path $target $rel
    $dstParent = Split-Path $dst -Parent
    if (-not (Test-Path $dstParent)) { New-Item -ItemType Directory -Path $dstParent -Force | Out-Null }

    # -Force so the gitignored .pyc files are included; they are the point.
    Copy-Item -Path $src -Destination $dst -Recurse -Force
    $n = @(Get-ChildItem -Path $dst -Recurse -File -Force).Count
    $copied += $n
    Write-Output "  copied $rel ($n files)"
}

# Also record the interpreter the bytecode is locked to. The .pyc files only
# import on this exact CPython minor version.
$pyVersion = (& python --version 2>&1) -join ''
@"
Hermes pipeline backup
taken:       $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
source repo: $repo
interpreter: $pyVersion
files:       $copied

The newsvideo/*.pyc and scripts/hermes-youtube/*.pyc files are sourceless
bytecode and import ONLY on this CPython minor version. A Python upgrade makes
them unloadable with no way to recompile. See RECOVERY-STATE.md.
"@ | Out-File -FilePath (Join-Path $target 'BACKUP-INFO.txt') -Encoding utf8

Write-Output "backup complete: $target ($copied files)"

# Prune old backups, newest kept.
$all = Get-ChildItem -Path $Destination -Directory | Sort-Object Name -Descending
if ($all.Count -gt $Keep) {
    $all | Select-Object -Skip $Keep | ForEach-Object {
        Remove-Item $_.FullName -Recurse -Force
        Write-Output "pruned old backup: $($_.Name)"
    }
}
