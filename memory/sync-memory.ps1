$source = "$PSScriptRoot"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host " MEMORY SYNC - $timestamp" -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan
$targets = @("D:\OPUSONLY\memory", "C:\OPUSONLY\memory")
$synced = 0
foreach ($target in $targets) {
    $drive = $target.Substring(0, 2)
    if (Test-Path $drive) {
        if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }
        Get-ChildItem $source -Filter "*.md" -File | ForEach-Object { Copy-Item $_.FullName $target -Force }
        Copy-Item "$source\sync-memory.ps1" $target -Force -ErrorAction SilentlyContinue
        $count = (Get-ChildItem $target -Filter "*.md" -File).Count
        Write-Host "[OK] $target - $count files synced" -ForegroundColor Green
        $synced++
    }
    else {
        Write-Host "[--] $drive not mounted, skipping" -ForegroundColor DarkGray
    }
}
Write-Host ""
Write-Host "Synced to $synced drives. Memory is safe." -ForegroundColor Cyan