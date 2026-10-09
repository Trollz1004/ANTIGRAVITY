# Agent windows supervisor (2026-10-09).
#
# Runs at Joshua's logon (scheduled task "ANTIGRAVITY Agent Windows", interactive) and keeps
# two visible terminals open on the T5500 desktop:
#   HERMES   - customer support desk   (ops\t5500\hermes-support.ps1 -Console)
#   OPENCLAW - node watchdog           (ops\t5500\openclaw-sentry.ps1)
# If either window is closed or crashes it is reopened within ~20 s.
#
# Before logon, the keepalive runs Hermes hidden so support never waits on a login.
# Once this supervisor is up it replaces that hidden copy with the visible one, and the
# keepalive defers to it (see the hermes stage in keepalive.ps1).
$ErrorActionPreference = 'Continue'
$Repo = 'C:\ANTIGRAVITY'
$Dir  = Join-Path $Repo 'ops\t5500'
$Log  = Join-Path $Repo 'logs\agent-windows.log'

$created = $true
try {
    $mutex = New-Object System.Threading.Mutex($true, 'Local\ANTIGRAVITY-Agent-Windows', [ref]$created)
    if (-not $created) { exit 0 }
} catch {}

function Log([string]$m) { try { Add-Content $Log ('[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m) } catch {} }

function Get-Ps([string]$pattern) {
    @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -match $pattern })
}

function Open-Window([string]$script, [string[]]$extra) {
    $argv = @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Dir $script)) + $extra
    Start-Process -FilePath powershell.exe -ArgumentList $argv -WorkingDirectory $Repo -WindowStyle Normal
}

Log "supervisor started (pid=$PID)"
while ($true) {
    # HERMES: want exactly one visible (-Console) copy; retire any hidden pre-logon copy.
    $h = Get-Ps 'hermes-support\.ps1'
    $visible = @($h | Where-Object { $_.CommandLine -match '-Console' })
    if ($visible.Count -eq 0) {
        foreach ($p in $h) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue; Log "retired hidden Hermes PID $($p.ProcessId)" }
        Open-Window 'hermes-support.ps1' @('-Console')
        Log 'opened HERMES window'
    }

    # OPENCLAW
    if ((Get-Ps 'openclaw-sentry\.ps1').Count -eq 0) {
        Open-Window 'openclaw-sentry.ps1' @()
        Log 'opened OPENCLAW window'
    }

    # OBSIDIAN: the one vault (C:\ANTIGRAVITY\Antigravity) + its Local REST API on :27123 are an
    # AI-team memory backup. It is a desktop app, so this interactive supervisor owns it.
    if (-not (Get-Process Obsidian -ErrorAction SilentlyContinue)) {
        $obs = 'C:\Program Files\Obsidian\Obsidian.exe'
        if (Test-Path $obs) { Start-Process -FilePath $obs -ArgumentList 'obsidian://open?vault=Antigravity' -WindowStyle Minimized; Log 'opened Obsidian (vault Antigravity)' }
    }

    Start-Sleep -Seconds 20
}
