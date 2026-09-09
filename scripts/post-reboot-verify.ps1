<#
Live post-reboot verification. No labels. No 200-OK-only claims.
#>
$ErrorActionPreference='SilentlyContinue'
$repo='E:\ANTIGRAVITY'

Write-Host '=== listening ports ==='
netstat -ano | Select-String -Pattern ':3110 |:3120 |:8787 |:3200 |:8000 |:11434 |:20128 |:18789 |:5432 |:54329 |:5678 ' | Select-String -Pattern 'LISTENING'

Write-Host '=== relevant processes ==='
Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node|npm|npx|tsx|cloudflared|ollama|omniroute|cmd|powershell' } | Select-Object ProcessId,Name,CommandLine | Format-List

Write-Host '=== relevant scheduled tasks ==='
Get-ScheduledTask | Where-Object { $_.TaskName -match 'ANTIGRAVITY|Paperclip|MissionControl|Watchdog|RuntimeOps|FullStack|PublicStack|OpsWatchdog|OmniRouter' } | Select-Object TaskName,State,@{N='Enabled';E={$_.Settings.Enabled}} | Format-Table -AutoSize

Write-Host '=== auth proxy log ==='
$proxyLog='C:\antigravity-paperclip-dateapp-ops\logs\paperclip-auth-proxy.log'
if (Test-Path $proxyLog) { Get-Content $proxyLog -Tail 30 } else { Write-Host 'missing proxy log' }

Write-Host '=== paperclip config ==='
$pc=Join-Path $repo '.paperclip-local\instances\default\config.json'
if (Test-Path $pc) { Get-Content $pc -Raw } else { Write-Host 'missing paperclip config' }

Write-Host '=== autostart log ==='
$al=Join-Path $repo 'logs\autostart-2026-07-27.log'
if (Test-Path $al) { Get-Content $al -Tail 50 } else { Write-Host 'no autostart log' }

Write-Host '=== dashboard status ==='
try {
  $r=Invoke-WebRequest -Uri 'http://127.0.0.1:5678/api/status' -UseBasicParsing -TimeoutSec 5
  Write-Host $r.Content
} catch {
  Write-Host ('dashboard api failed: '+$_.Exception.Message)
}
