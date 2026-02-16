# Final Audit - All OPUSONLY drives
Write-Host "FINAL AUDIT - ALL OPUSONLY DRIVES" -ForegroundColor Cyan
Write-Host ""

# E: Drive
Write-Host "=== E: SABRETOOTH ===" -ForegroundColor Yellow
$eFiles = @(
    "E:\OPUSONLY\config\node_manifest.json",
    "E:\OPUSONLY\config\project_index.json",
    "E:\OPUSONLY\memory\CONSOLIDATED_USER_PREFERENCES.md",
    "E:\OPUSONLY\memory\OPUS-STATUS.md"
)
foreach ($f in $eFiles) {
    if (Test-Path $f) { Write-Host "  OK: $f" -ForegroundColor Green }
    else { Write-Host "  MISSING: $f" -ForegroundColor Red }
}

# G: Drive
Write-Host ""
Write-Host "=== G: T5500 ===" -ForegroundColor Yellow
$gFiles = @(
    "G:\OPUSONLY\config\node_manifest.json",
    "G:\OPUSONLY\config\project_index.json",
    "G:\OPUSONLY\config\node_identity.json",
    "G:\OPUSONLY\config\sabretooth_pubkey.pub",
    "G:\OPUSONLY\memory\CONSOLIDATED_USER_PREFERENCES.md",
    "G:\OPUSONLY\memory\OPUS-STATUS.md",
    "G:\OPUSONLY\memory\NODE_CONTEXT.md",
    "G:\OPUSONLY\scripts\Setup-SSHServer.ps1",
    "G:\OPUSONLY\scripts\Start-DateAppServices.ps1"
)
foreach ($f in $gFiles) {
    if (Test-Path $f) { Write-Host "  OK: $f" -ForegroundColor Green }
    else { Write-Host "  MISSING: $f" -ForegroundColor Red }
}

# H: Drive
Write-Host ""
Write-Host "=== H: 9020 ===" -ForegroundColor Yellow
$hFiles = @(
    "H:\OPUSONLY\config\node_manifest.json",
    "H:\OPUSONLY\config\project_index.json",
    "H:\OPUSONLY\config\node_identity.json",
    "H:\OPUSONLY\config\sabretooth_pubkey.pub",
    "H:\OPUSONLY\memory\CONSOLIDATED_USER_PREFERENCES.md",
    "H:\OPUSONLY\memory\OPUS-STATUS.md",
    "H:\OPUSONLY\memory\NODE_CONTEXT.md",
    "H:\OPUSONLY\scripts\Setup-SSHServer.ps1"
)
foreach ($f in $hFiles) {
    if (Test-Path $f) { Write-Host "  OK: $f" -ForegroundColor Green }
    else { Write-Host "  MISSING: $f" -ForegroundColor Red }
}

# SSH Key Match
Write-Host ""
Write-Host "=== SSH KEY CHECK ===" -ForegroundColor Yellow
$sabKey = Get-Content "C:\Users\joshl\.ssh\id_ed25519.pub" -ErrorAction SilentlyContinue
$gKey = Get-Content "G:\OPUSONLY\config\sabretooth_pubkey.pub" -ErrorAction SilentlyContinue
$hKey = Get-Content "H:\OPUSONLY\config\sabretooth_pubkey.pub" -ErrorAction SilentlyContinue
if ($sabKey -and ($sabKey.Trim() -eq $gKey.Trim()) -and ($sabKey.Trim() -eq $hKey.Trim())) {
    Write-Host "  OK: SSH pubkey matches all drives" -ForegroundColor Green
} else {
    Write-Host "  FAIL: SSH key mismatch" -ForegroundColor Red
}

# Drive letter scan
Write-Host ""
Write-Host "=== DRIVE LETTER SAFETY ===" -ForegroundColor Yellow
$badCount = 0
foreach ($drive in @("G:\OPUSONLY", "H:\OPUSONLY")) {
    $files = Get-ChildItem $drive -Recurse -Include *.ps1,*.json,*.md -File -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        if ($f.FullName -match "node_modules") { continue }
        $hits = Select-String -Path $f.FullName -Pattern "G:\\","H:\\" -SimpleMatch
        if ($hits) {
            $badCount += $hits.Count
            Write-Host "  BAD: $($f.Name)" -ForegroundColor Red
        }
    }
}
if ($badCount -eq 0) {
    Write-Host "  OK: Zero hardcoded G:/H: on remote drives" -ForegroundColor Green
}

Write-Host ""
Write-Host "AUDIT COMPLETE" -ForegroundColor Cyan
