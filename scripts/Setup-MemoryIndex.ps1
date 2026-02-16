<# 
    Setup-MemoryIndex.ps1
    Build a global OPUS_MEMORY_INDEX.json for OPUS.

    SCANS memory folders:
    - E:\OPUSONLY\memory\         (SABRETOOTH)
    - G:\OPUSONLY\memory\         (T5500)
    - H:\OPUSONLY\memory\         (OPTIPLEX9020)
#>

Write-Host "=== OPUS MEMORY INDEX BUILD START ===" -ForegroundColor Cyan

$memoryRoots = @(
    @{ Letter = 'E'; NodeName = 'SABRETOOTH'   },
    @{ Letter = 'G'; NodeName = 'T5500'        },
    @{ Letter = 'H'; NodeName = 'OPTIPLEX9020' }
)

$entries = @()

foreach ($m in $memoryRoots) {
    $letter  = $m.Letter
    $node    = $m.NodeName

    $drive = Get-PSDrive -Name $letter -ErrorAction SilentlyContinue
    if (-not $drive) {
        Write-Warning ("Drive {0}: not found, skipping memory scan for node {1}." -f $letter, $node)
        continue
    }

    $memRoot = "$letter`:\OPUSONLY\memory"

    if (-not (Test-Path $memRoot)) {
        Write-Host ("No memory folder at {0}, creating..." -f $memRoot) -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $memRoot -Force | Out-Null
        continue  # nothing to index yet
    }

    Write-Host ("Scanning memory folder: {0} (node {1})" -f $memRoot, $node) -ForegroundColor Yellow

    # Index JSON / text-like files only to keep it clean
    $patterns = @("*.json","*.md","*.log","*.txt")

    foreach ($pattern in $patterns) {
        $files = Get-ChildItem -Path $memRoot -Recurse -File -Filter $pattern -ErrorAction SilentlyContinue
        foreach ($f in $files) {
            $entries += [PSCustomObject]@{
                path          = $f.FullName
                fileName      = $f.Name
                driveLetter   = $letter
                node          = $node
                sizeBytes     = $f.Length
                lastWriteTime = $f.LastWriteTime.ToString("o")
                ext           = $f.Extension
            }
        }
    }
}

if (-not $entries) {
    Write-Warning "No memory files discovered yet. OPUS_MEMORY_INDEX.json will be empty."
}

# Ensure config dir on E:
$configDir = "E:\OPUSONLY\config"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$indexPath = Join-Path $configDir "OPUS_MEMORY_INDEX.json"

$indexObj = @{
    generatedOn = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
    hostMachine = $env:COMPUTERNAME
    entries     = $entries
}

$indexJson = $indexObj | ConvertTo-Json -Depth 5
$indexJson | Out-File -FilePath $indexPath -Encoding utf8

Write-Host ""
Write-Host "Memory index written to:" -ForegroundColor Green
Write-Host "  $indexPath" -ForegroundColor Green
Write-Host ("Total memory files indexed: {0}" -f $entries.Count) -ForegroundColor Green

Write-Host ""
Write-Host "=== OPUS MEMORY INDEX BUILD COMPLETE ===" -ForegroundColor Cyan
