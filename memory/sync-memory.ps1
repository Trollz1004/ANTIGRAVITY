$source = "$PSScriptRoot"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host " MEMORY SYNC - $timestamp" -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan

# Canonical memory targets (ANTIGRAVITY naming).
$targets = @(
    "D:\ANTIGRAVITY\memory",
    "H:\ANTIGRAVITY\memory",
    "C:\ANTIGRAVITY\memory",
    "J:\ANTIGRAVITY\memory"
)

# The E: mirror is retired by default now that C: is the live Codex base.
if ($env:MEMORY_SYNC_INCLUDE_RETIRED_E -eq "1") {
    $targets += "E:\ANTIGRAVITY\memory"
}

# Optional legacy mirror targets. Set MEMORY_SYNC_INCLUDE_LEGACY_OPUSONLY=1 to keep writing them.
if ($env:MEMORY_SYNC_INCLUDE_LEGACY_OPUSONLY -eq "1") {
    $targets += @(
        "D:\OPUSONLY\memory",
        "H:\OPUSONLY\memory",
        "E:\OPUSONLY\memory",
        "C:\OPUSONLY\memory",
        "J:\OPUSONLY\memory"
    )
}

# Prevent duplicate paths if canonical and legacy overlap.
$targets = $targets | Select-Object -Unique

$synced = 0
foreach ($target in $targets) {
    if ((Resolve-Path -LiteralPath $target -ErrorAction SilentlyContinue) -and ((Resolve-Path -LiteralPath $target).Path -eq (Resolve-Path -LiteralPath $source).Path)) {
        Write-Host "[--] $target is source path, skipping" -ForegroundColor DarkGray
        continue
    }

    $drive = $target.Substring(0, 2)
    if (Test-Path $drive) {
        if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }
        Get-ChildItem $source -Filter "*.md" -File | ForEach-Object { Copy-Item $_.FullName $target -Force }
        Copy-Item "$source\sync-memory.ps1" $target -Force -ErrorAction SilentlyContinue
        $count = (Get-ChildItem $target -Filter "*.md" -File).Count
        Write-Host "[OK] $target - $count files synced" -ForegroundColor Green
        $synced++
    } else {
        Write-Host "[--] $drive not mounted, skipping" -ForegroundColor DarkGray
    }
}
Write-Host ""
Write-Host "Synced to $synced drives. Memory is safe." -ForegroundColor Cyan
