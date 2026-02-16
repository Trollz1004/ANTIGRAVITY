<# 
    Setup-ProjectIndex.ps1
    Build a simple project_index.json for OPUS.

    SCANS:
    - E:\  (SABRETOOTH)
    - G:\  (T5500)
    - H:\  (9020)

    Only considers top-level directories (to avoid node_modules hell).
#>

Write-Host "=== OPUS PROJECT INDEX BUILD START ===" -ForegroundColor Cyan

$drivesToScan = @(
    @{ Letter = 'E'; NodeName = 'SABRETOOTH'  },
    @{ Letter = 'G'; NodeName = 'T5500'       },
    @{ Letter = 'H'; NodeName = 'OPTIPLEX9020'}
)

$projects = @()

foreach ($d in $drivesToScan) {
    $letter  = $d.Letter
    $node    = $d.NodeName

    $drive = Get-PSDrive -Name $letter -ErrorAction SilentlyContinue
    if (-not $drive) {
        Write-Warning ("Drive {0}: not found, skipping for project index." -f $letter)
        continue
    }

    $root = "$letter`:\"

    Write-Host ("Scanning drive {0}: for top-level folders (node {1})..." -f $letter, $node) -ForegroundColor Yellow

    # Get top-level directories, ignore Windows/System roots
    try {
        $dirs = Get-ChildItem -Path $root -Directory -ErrorAction Stop
    } catch {
        # FIXED: avoid "$root:" parsing issue
        Write-Warning ("Could not enumerate root {0} - Error: {1}" -f $root, $_.Exception.Message)
        continue
    }

    foreach ($dir in $dirs) {
        # skip obvious system / temp directories
        if ($dir.Name -in @(
            "Windows",
            "Program Files",
            "Program Files (x86)",
            "ProgramData",
            "Users",
            "System Volume Information",
            "$Recycle.Bin"
        )) {
            continue
        }

        $proj = [PSCustomObject]@{
            name        = $dir.Name
            driveLetter = $letter
            fullPath    = $dir.FullName
            node        = $node
            # simple guess for type (can be refined later)
            typeGuess   = if ($dir.Name -match "CUPID|DATING") { "dating-app" }
                          elseif ($dir.Name -match "CROSSLISTER") { "crosslister" }
                          elseif ($dir.Name -match "OPUSONLY") { "opus-root" }
                          else { "generic-project" }
        }

        $projects += $proj
    }
}

if (-not $projects) {
    Write-Warning "No projects discovered. project_index.json will be empty."
}

# Ensure config dir on E:
$configDir = "E:\OPUSONLY\config"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$indexPath = Join-Path $configDir "project_index.json"

$indexObj = @{
    generatedOn = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
    hostMachine = $env:COMPUTERNAME
    projects    = $projects
}

$indexJson = $indexObj | ConvertTo-Json -Depth 5
$indexJson | Out-File -FilePath $indexPath -Encoding utf8

Write-Host ""
Write-Host "Project index written to:" -ForegroundColor Green
Write-Host "  $indexPath" -ForegroundColor Green
Write-Host ("Total projects found: {0}" -f $projects.Count) -ForegroundColor Green

Write-Host ""
Write-Host "=== OPUS PROJECT INDEX BUILD COMPLETE ===" -ForegroundColor Cyan
