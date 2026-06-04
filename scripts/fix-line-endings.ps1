param([string]$Path)
if (-not $Path) { Write-Error 'Usage: -Path <file>'; exit 1 }
$content = [System.IO.File]::ReadAllText($Path)
$cr = [char]13
$lf = [char]10
$content = $content -replace [regex]::Escape("$cr$lf"), "$lf"
$content = $content -replace [regex]::Escape("$lf"), "$cr$lf"
[System.IO.File]::WriteAllText($Path, $content)
Write-Host ("Converted to CRLF: " + $Path)
