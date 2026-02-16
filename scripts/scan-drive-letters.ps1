# Quick scan for hardcoded G: or H: paths on both drives
Write-Host "=== SCANNING G:\OPUSONLY ===" -ForegroundColor Cyan
$gFiles = Get-ChildItem "G:\OPUSONLY" -Recurse -Include *.ps1,*.json,*.md -File
foreach ($f in $gFiles) {
    $lines = Select-String -Path $f.FullName -Pattern "G:\\","H:\\" -SimpleMatch
    if ($lines) {
        foreach ($l in $lines) {
            Write-Host "$($f.Name):$($l.LineNumber) -> $($l.Line.TrimStart())" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== SCANNING H:\OPUSONLY ===" -ForegroundColor Cyan
$hFiles = Get-ChildItem "H:\OPUSONLY" -Recurse -Include *.ps1,*.json,*.md -File
foreach ($f in $hFiles) {
    $lines = Select-String -Path $f.FullName -Pattern "G:\\","H:\\" -SimpleMatch
    if ($lines) {
        foreach ($l in $lines) {
            Write-Host "$($f.Name):$($l.LineNumber) -> $($l.Line.TrimStart())" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== SCAN COMPLETE ===" -ForegroundColor Green
