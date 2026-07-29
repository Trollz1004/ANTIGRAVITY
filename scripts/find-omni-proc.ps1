$ErrorActionPreference='SilentlyContinue'
$p=Get-Process -Id 25276 -ErrorAction SilentlyContinue
if ($p) {
  Write-Host ('proc=' + $p.ProcessName + ' path=' + $p.Path)
  $w=Get-WmiObject Win32_Process -Filter 'ProcessId=25276'
  Write-Host ('cmdline=' + $w.CommandLine)
} else {
  Write-Host 'process gone'
}
