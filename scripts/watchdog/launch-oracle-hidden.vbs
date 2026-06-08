' ANTIGRAVITY Oracle - zero-window launcher for Run key / manual double-click
' WindowStyle 0 = completely hidden (no focus steal)

Option Explicit
Dim sh, repo, boot, respawn
Set sh = CreateObject("WScript.Shell")

If CreateObject("Scripting.FileSystemObject").FolderExists("C:\antigravity") Then
  repo = "C:\antigravity"
Else
  repo = "C:\Antigravity"
End If

boot = repo & "\scripts\watchdog\bootstrap-sabretooth-hidden.ps1"
respawn = repo & "\scripts\watchdog\oracle-respawn.ps1"

sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & boot & """", 0, False
WScript.Sleep 3000
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & respawn & """", 0, False