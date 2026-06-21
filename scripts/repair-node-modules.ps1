param(
  [string]$RepoPath = 'C:\antigravity'
)

if (-not (Test-Path $RepoPath)) { Write-Error "Repo path not found: $RepoPath"; exit 1 }

$nm = Join-Path $RepoPath 'node_modules'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

# Admin check
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error "Run PowerShell *As Administrator* and re-run this script."
  exit 1
}

try {
  if (Test-Path $nm) {
    Write-Output "Taking ownership of node_modules..."
    & takeown /f $nm /r /d Y | Out-Null
    & icacls $nm "/grant:$($env:USERNAME):F" /t | Out-Null

    $bak = Join-Path $RepoPath "node_modules_backup_$timestamp"
    Write-Output "Backing up node_modules -> $bak"
    Move-Item -LiteralPath $nm -Destination $bak -Force -ErrorAction SilentlyContinue

    if (Test-Path $nm) {
      Write-Output "Attempting to remove remaining node_modules..."
      Remove-Item -LiteralPath $nm -Recurse -Force -ErrorAction Stop
    }
    Write-Output "node_modules removed/backed up."
  } else {
    Write-Output "No node_modules folder found; continuing to install."
  }

  Set-Location $RepoPath

  if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Output "Pruning pnpm store (if any)..."
    pnpm store prune
    if ($LASTEXITCODE -ne 0) { Write-Output "pnpm store prune returned non-zero (continuing)." }
  } else {
    Write-Warning "pnpm not found in PATH. Install pnpm (https://pnpm.io/installation) or run this script after installing pnpm."
    exit 2
  }

  Write-Output "Running pnpm install --frozen-lockfile..."
  pnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) {
    Write-Error "pnpm install failed. Inspect output above."
    exit 1
  }

  Write-Output "Install finished. Inspect backup at: $bak"
  exit 0
}
catch {
  Write-Error "Error: $($_.Exception.Message)"
  exit 1
}
