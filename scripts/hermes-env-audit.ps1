param(
    [string[]]$Paths
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$targets = if ($Paths -and $Paths.Count -gt 0) {
    $Paths
} else {
    @((Join-Path $root "services\health-aggregator"))
}

$blocked = @(
    ("ANTHROPIC" + "_API_KEY"),
    ("CLAUDE" + "_API_KEY")
)
$pattern = ($blocked | ForEach-Object { [regex]::Escape($_) }) -join "|"
$hits = @()

foreach ($target in $targets) {
    if (Test-Path $target) {
        $files = Get-ChildItem $target -Recurse -File -ErrorAction SilentlyContinue
        if ($files) {
            $hits += $files | Select-String -Pattern $pattern -CaseSensitive -ErrorAction SilentlyContinue
        }
    }
}

if ($hits.Count -gt 0) {
    $hits | ForEach-Object {
        Write-Error "$($_.Path):$($_.LineNumber) blocked key string present"
    }
    exit 1
}

Write-Host "Hermes env audit passed: no blocked Anthropic key strings found."
