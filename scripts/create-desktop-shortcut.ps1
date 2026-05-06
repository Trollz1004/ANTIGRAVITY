# Creates an ANTIGRAVITY desktop shortcut that launches everything
# Run once — no admin needed

$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$Desktop\ANTIGRAVITY Launch.lnk"

$WScript = New-Object -ComObject WScript.Shell
$Shortcut = $WScript.CreateShortcut($ShortcutPath)

# Target: PowerShell running the autostart script elevated
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -Command `"Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File C:\ANTIGRAVITY\scripts\autostart.ps1'`""
$Shortcut.WorkingDirectory = "C:\ANTIGRAVITY"
$Shortcut.Description = "Launch ANTIGRAVITY stack: Docker, LiteLLM, Paperclip, Claude Code"

# Use a built-in Windows icon that looks decent (shell32 has many)
# 23 = computer/server icon, 43 = lightning bolt area, 77 = globe
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,23"

$Shortcut.Save()

Write-Host ""
Write-Host "Desktop shortcut created: $ShortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "Double-click 'ANTIGRAVITY Launch' on your desktop."
Write-Host "Click Yes on the UAC prompt — it needs admin for Docker."
Write-Host ""
