# User Directory Cleanup Script (T5500 Node)
# Archives and safely removes legacy agent debris, temp files, and accidental installs in C:\Users\joshi.

$ErrorActionPreference = 'Continue'
$BackupDir = 'C:\ARCHIVE_BACKUPS'
$ZipFile = Join-Path $BackupDir 'user_debris_2026-10-06.zip'
$LogFile = Join-Path $BackupDir 'cleanup.log'
$UserHome = 'C:\Users\joshi'

function Write-Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

# 1. Identify all abandoned dot folders in C:\Users\joshi
$abandonedDotNames = @(
    '.actual', '.adal', '.agent-browser', '.agent-reach', '.aider', '.aider-desk',
    '.AIDevGallery', '.aitk', '.amr', '.antigravity-ref-backups', '.antigravity-vault',
    '.astrbot', '.augment', '.autohand', '.autonoma', '.bob', '.buzz', '.cagent',
    '.claude-server-commander', '.codeartsdoer', '.codebuddy', '.codegpt', '.codeium',
    '.codemaker', '.codestudio', '.commandcode', '.continue', '.copilot-studio-cli',
    '.cua-driver', '.dsh', '.env-backups', '.factory', '.forge', '.freebuff',
    '.github-copilot-cli', '.herdr', '.idl', '.iflow', '.inferencesh', '.jazz',
    '.junie', '.kilocode', '.kiro', '.kode', '.lingma', '.luci', '.manus', '.mcpjam',
    '.mcporter', '.minimax', '.miopen', '.moxby', '.mux', '.neovate', '.next-devtools-mcp',
    '.obsidian-copilot', '.ona', '.opencli', '.opencode', '.openhands', '.openviking',
    '.openwork', '.paperclip', '.pi', '.playwright-mcp', '.pochi', '.posit', '.qoder',
    '.qoder-cn', '.qwen', '.reasonix', '.remember', '.roo', '.rovodev', '.snowflake',
    '.sonar', '.sonarlint', '.superagent', '.supermemory-claude', '.tabnine',
    '.terramind', '.tinycloud', '.trae', '.trae-cn', '.triton', '.unsloth', '.vibe',
    '.wso2-integrator', '.zcode', '.zencoder', '.Life', '.bash_completion.d'
)

$targetPaths = @()

foreach ($name in $abandonedDotNames) {
    $p = Join-Path $UserHome $name
    if (Test-Path $p) {
        $targetPaths += $p
    }
}

# 2. Add obsolete user folders and old backups
$obsoleteFolders = @(
    (Join-Path $UserHome 'projects'),
    (Join-Path $UserHome 'scratch'),
    (Join-Path $UserHome 'workspace'),
    (Join-Path $UserHome 'hermes'),
    (Join-Path $UserHome 'pgsql16-data.bak-2026-10-05'),
    (Join-Path $UserHome 'redis-win'),
    (Join-Path $UserHome 'node_modules')
)

foreach ($p in $obsoleteFolders) {
    if (Test-Path $p) {
        $targetPaths += $p
    }
}

# 3. Add loose stray files in C:\Users\joshi
$looseFiles = @(
    (Join-Path $UserHome 'package.json'),
    (Join-Path $UserHome 'package-lock.json'),
    (Join-Path $UserHome 'skills-lock.json'),
    (Join-Path $UserHome 'du_results.txt'),
    (Join-Path $UserHome 'route_run.txt'),
    (Join-Path $UserHome 'pgsql16-data.log')
)

foreach ($p in $looseFiles) {
    if (Test-Path $p) {
        $targetPaths += $p
    }
}

$prepurgFiles = Get-ChildItem -Path $UserHome -Filter "ANTIGRAVITY-pre-purge-*" -File -ErrorAction SilentlyContinue
foreach ($f in $prepurgFiles) {
    $targetPaths += $f.FullName
}

Write-Log ("Found {0} user directories/files to archive." -f $targetPaths.Count)

# Use tar to archive all target paths
Write-Log "Archiving user debris to: $ZipFile"
# Write list of paths to a manifest file for tar
$manifest = Join-Path $BackupDir 'user_debris_manifest.txt'
$targetPaths | Out-File -FilePath $manifest -Encoding utf8

$tarArgs = @('-a', '-c', '-f', $ZipFile, '-T', $manifest)
& tar.exe @tarArgs

if (-not (Test-Path $ZipFile) -or (Get-Item $ZipFile).Length -eq 0) {
    Write-Log "ERROR: User archive creation failed. Aborting deletion."
    exit 1
}

$zipSizeMB = [math]::Round((Get-Item $ZipFile).Length / 1MB, 2)
Write-Log "User archive verified successfully: $ZipFile ($zipSizeMB MB)"

# Now remove the archived items
foreach ($p in $targetPaths) {
    try {
        Remove-Item -Path $p -Recurse -Force -ErrorAction Stop
        Write-Log "Removed: $p"
    } catch {
        Write-Log "WARNING: Could not remove $($p): $_"
    }
}

# Clean all .claude.json.tmp.* files
$tmpFiles = Get-ChildItem -Path $UserHome -Filter ".claude.json.tmp.*" -Force -ErrorAction SilentlyContinue
Write-Log ("Cleaning {0} temporary claude json files in C:\Users\joshi..." -f $tmpFiles.Count)
foreach ($f in $tmpFiles) {
    try {
        Remove-Item -Path $f.FullName -Force -ErrorAction Stop
    } catch {}
}
Write-Log "Temporary claude json files cleaned."

Write-Log "User home cleanup completed successfully."
