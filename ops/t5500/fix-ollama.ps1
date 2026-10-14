# Fix Ollama on the T5500 and make `ollama serve` come back on every logon/reboot.
# Written by Opus (Claude) in the Antigravity IDE, 2026-10-12.
# Run ONCE from an ADMIN PowerShell: the running ollama.exe is elevated and only admin can stop it.
#   powershell -ExecutionPolicy Bypass -File C:\ANTIGRAVITY\ops\t5500\fix-ollama.ps1
$ErrorActionPreference = 'Continue'
$user  = 'joshi'
$setup = Join-Path $env:TEMP 'OllamaSetup.exe'

Write-Host '1/4 stopping every ollama process (elevated ones included)'
Get-Process ollama, 'ollama app' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

Write-Host '2/4 downloading + reinstalling Ollama (restores the missing llama-server.exe)'
Invoke-WebRequest https://ollama.com/download/OllamaSetup.exe -OutFile $setup -UseBasicParsing
Start-Process $setup -ArgumentList '/VERYSILENT', '/NORESTART', '/SUPPRESSMSGBOXES' -Wait
Get-Process ollama, 'ollama app' -ErrorAction SilentlyContinue | Stop-Process -Force   # installer auto-starts it elevated

$exe = "C:\Users\$user\AppData\Local\Programs\Ollama\ollama.exe"
if (-not (Test-Path "C:\Users\$user\AppData\Local\Programs\Ollama\lib\ollama\llama-server.exe")) { Write-Host 'llama-server.exe still missing - stop and tell Opus' -ForegroundColor Red; exit 1 }

Write-Host '3/4 logon task "ANTIGRAVITY Ollama" (NOT elevated): ollama serve on 127.0.0.1:11434'
$cmd = "`$env:OLLAMA_HOST='127.0.0.1:11434'; & '$exe' serve *>> 'C:\ANTIGRAVITY\logs\ollama-serve.log'"
$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -Command `"$cmd`""
$t = New-ScheduledTaskTrigger -AtLogOn -User $user
$s = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit 0 -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$p = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask 'ANTIGRAVITY Ollama' -Action $a -Trigger $t -Settings $s -Principal $p -Force | Out-Null
# stop the tray app from also auto-starting an elevated copy
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Ollama.lnk" -ErrorAction SilentlyContinue
Remove-Item "C:\Users\$user\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Ollama.lnk" -ErrorAction SilentlyContinue
Start-ScheduledTask 'ANTIGRAVITY Ollama'
Start-Sleep 8

Write-Host '4/4 checks: root, /v1, /api/tags, Fable load'
foreach ($u in 'http://127.0.0.1:11434/', 'http://127.0.0.1:11434/v1/models', 'http://127.0.0.1:11434/api/tags') {
    try { $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 10; "{0}  {1}" -f $r.StatusCode, $u } catch { "FAIL  $u" }
}
try {
    Invoke-RestMethod http://127.0.0.1:11434/api/generate -Method Post -ContentType application/json -Body '{"model":"joshlcoleman/Fable:latest","keep_alive":-1}' -TimeoutSec 180 | Out-Null
    'Fable loaded and pinned'
} catch { "Fable load FAILED: $($_.ErrorDetails.Message)" }
