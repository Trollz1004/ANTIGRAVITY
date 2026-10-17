<#
.SYNOPSIS
    Unattended entrypoint for the Hermes daily video. Task Scheduler calls this.

.DESCRIPTION
    Rebuilt 2026-10-09 after the 2026-09-13 wipe took the original wrapper and
    register-daily-task.ps1 with it (see ops/hermes/RECOVERY-STATE.md).

    Task Scheduler starts processes with a stale environment block, so PATH is
    rebuilt from the registry here before anything runs -- that is how ffmpeg
    went missing from the chain's point of view even when it was installed.

    Everything the run prints is teed to ops/hermes/logs/daily-<stamp>.log with
    the header/footer format the pre-wipe logs used, so the existing logs and
    the new ones read as one series.

    The pipeline's exit code is passed straight through, because Task Scheduler
    surfaces it as "Last Run Result" -- that is the status the user sees without
    opening anything:
        0  video produced and (if upload was armed) shipped
        2  a stage or a gate failed -- nothing shipped
        3  video produced and verified, but upload is not armed (no credentials)
        4  bad invocation / environment (no ffmpeg, no day folder, ...)

.PARAMETER PipelineArgs
    Passed through to `python -m newsvideo.daily` verbatim. --unattended is
    always added.

.EXAMPLE
    .\run-daily.ps1
    .\run-daily.ps1 --date 20261004 --no-source --upload off
#>
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $PipelineArgs = @()
)

$ErrorActionPreference = 'Continue'

$repo    = 'C:\ANTIGRAVITY'
$hermes  = Join-Path $repo 'ops\hermes'
$logDir  = Join-Path $hermes 'logs'
$stamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$logFile = Join-Path $logDir "daily-$stamp.log"

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

# --- environment -----------------------------------------------------------
# Rebuild PATH from the registry; a scheduled task does not inherit the PATH
# edits winget made after the session's environment block was created.
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath    = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path    = "$machinePath;$userPath"

# ffmpeg is the one dependency that cannot be pip-installed and the one that
# was missing after the wipe. If PATH still does not have it, look in the
# winget package dir before giving up.
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    $pkgRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    $ffBin = Get-ChildItem -Path $pkgRoot -Filter 'ffmpeg.exe' -Recurse -File -ErrorAction SilentlyContinue |
             Select-Object -First 1 -ExpandProperty DirectoryName
    if ($ffBin) { $env:Path = "$ffBin;$env:Path" }
}

# --- run -------------------------------------------------------------------
$header = "=== hermes daily $(Get-Date -Format 'ddd MM/dd/yyyy  HH:mm:ss.ff') === "
Write-Output $header
$header | Out-File -FilePath $logFile -Encoding utf8

$exitCode = 4
try {
    Push-Location $hermes

    if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
        # Fail loudly rather than let the chain start and emit a broken mp4.
        $msg = "$(Get-Date -Format 'HH:mm:ss') [ERROR] preflight: ffmpeg not on PATH and not found under WinGet\Packages -- nothing rendered"
        Write-Output $msg
        $msg | Out-File -FilePath $logFile -Append -Encoding utf8
        $exitCode = 4
    }
    else {
        $argList = @('-m', 'newsvideo.daily', '--unattended') + $PipelineArgs
        & python @argList 2>&1 | ForEach-Object {
            $line = [string]$_
            Write-Output $line
            $line | Out-File -FilePath $logFile -Append -Encoding utf8
        }
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 4 }
    }
}
catch {
    $msg = "$(Get-Date -Format 'HH:mm:ss') [ERROR] wrapper: $($_.Exception.Message)"
    Write-Output $msg
    $msg | Out-File -FilePath $logFile -Append -Encoding utf8
    $exitCode = 4
}
finally {
    Pop-Location
}

$footer = "=== exit $exitCode === "
Write-Output $footer
$footer | Out-File -FilePath $logFile -Append -Encoding utf8

exit $exitCode
