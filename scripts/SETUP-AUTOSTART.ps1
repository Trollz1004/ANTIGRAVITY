# RETIRED — S1 runtime gate protection
#
# This legacy script previously registered a privileged Windows startup task
# against a superseded non-canonical path. It is intentionally non-executing.
# It must not register, modify, or start a scheduled task.

$ErrorActionPreference = "Stop"
$requiredGate = "LANDED_BY_JUDGE"
$runtimeGate = [Environment]::GetEnvironmentVariable("MISSION_CONTROL_RUNTIME_GATE", "Process")

if ($runtimeGate -ne $requiredGate) {
    Write-Host "BLOCKED: S1 runtime gate is not landed by the authorized judge lane." -ForegroundColor Red
    Write-Host "No startup task was created, modified, or executed." -ForegroundColor Yellow
    exit 1
}

Write-Host "BLOCKED: This legacy autostart installer is retired even when the S1 gate is present." -ForegroundColor Yellow
Write-Host "Use an explicitly reviewed, current release procedure after the authorized lane lands S1." -ForegroundColor Yellow
Write-Host "No startup task was created, modified, or executed." -ForegroundColor Yellow
exit 1
