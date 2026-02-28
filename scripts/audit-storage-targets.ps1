[CmdletBinding()]
param(
    [string[]]$SourceRoots = @(
        "C:\Users\joshl\.docker",
        "C:\Users\joshl\AppData\Roaming\Docker",
        "C:\Users\joshl\AppData\Local\Docker",
        "C:\ProgramData\DockerDesktop"
    ),
    [string]$Label = "storage-targets",
    [string]$RepoRoot = "C:\OPUSONLY",
    [int]$MaxFileMB = 10,
    [string[]]$ExcludePathPatterns = @(
        "\\node_modules\\",
        "\\.git\\",
        "\\dist\\",
        "\\build\\",
        "\\.next\\",
        "\\AppData\\Local\\Temp\\",
        "\\Windows\\",
        "\\Program Files\\",
        "\\Program Files \(x86\)\\"
    ),
    [string[]]$IncludeExtensions = @(
        ".txt", ".md", ".env", ".json", ".yml", ".yaml", ".toml", ".ini",
        ".conf", ".config", ".xml", ".log", ".ps1", ".bat", ".sh",
        ".js", ".ts", ".py", ".sol", ".csv"
    )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Normalize-Label {
    param([Parameter(Mandatory = $true)][string]$Value)
    return ($Value -replace "[^A-Za-z0-9\-]", "-").ToLowerInvariant()
}

function Scan-TargetFiles {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string[]]$Extensions,
        [Parameter(Mandatory = $true)][long]$MaxBytes
    )

    $items = @()
    try {
        $items = Get-ChildItem -LiteralPath $Root -Recurse -File -Force -ErrorAction SilentlyContinue
    } catch {
        $items = @()
    }

    $candidates = @(
        $items |
        Where-Object { $_.Extension -and ($Extensions -contains $_.Extension.ToLowerInvariant()) } |
        Where-Object { $_.Length -le $MaxBytes }
    )

    if ($ExcludePathPatterns.Count -gt 0) {
        $candidates = @(
            $candidates | Where-Object {
                $path = $_.FullName
                $exclude = $false
                foreach ($pattern in $ExcludePathPatterns) {
                    if ($path -match $pattern) {
                        $exclude = $true
                        break
                    }
                }
                -not $exclude
            }
        )
    }

    return $candidates
}

$existingRoots = @()
$missingRoots = @()
foreach ($root in $SourceRoots) {
    if (Test-Path -LiteralPath $root) {
        $existingRoots += $root
    } else {
        $missingRoots += $root
    }
}

if ($existingRoots.Count -eq 0) {
    throw "None of the requested SourceRoots exist."
}

$maxBytes = [int64]$MaxFileMB * 1024 * 1024
$dateStamp = Get-Date -Format "yyyy-MM-dd"
$labelSafe = Normalize-Label -Value $Label

$archiveDir = Join-Path $RepoRoot "_ARCHIVE\audit-$labelSafe-$dateStamp"
$memoryDir = Join-Path $RepoRoot "memory"

Ensure-Directory -Path $archiveDir
Ensure-Directory -Path $memoryDir

$manifestPath = Join-Path $archiveDir "manifest.json"
$secretFindingsPath = Join-Path $archiveDir "secret-findings.txt"
$summaryPath = Join-Path $archiveDir "summary.md"
$promptPath = Join-Path $archiveDir "gemini-handoff-prompt.txt"
$memorySummaryPath = Join-Path $memoryDir "STORAGE-AUDIT-SUMMARY-$labelSafe-$dateStamp.md"
$memoryPromptPath = Join-Path $memoryDir "GEMINI-HANDOFF-PROMPT-$labelSafe-$dateStamp.txt"

$secretPattern = "(?im)(sk-proj-[A-Za-z0-9_\-]+|sk-ant-[A-Za-z0-9_\-]+|xox[baprs]-[A-Za-z0-9\-]+|(?:api[_-]?key|secret|token|private[_\s-]?key|pass(word|phrase)|mnemonic)\s*[:=]\s*\S+|BEGIN (?:RSA )?PRIVATE KEY|SQUARE_ACCESS_TOKEN\s*=\s*\S+|STRIPE_SECRET_KEY\s*=\s*\S+|PLAID_SECRET\s*=\s*\S+|TELEGRAM_BOT_TOKEN\s*=\s*\S+|OPENAI_API_KEY\s*=\s*\S+)"

$allFiles = @()
foreach ($root in $existingRoots) {
    $allFiles += Scan-TargetFiles -Root $root -Extensions $IncludeExtensions -MaxBytes $maxBytes
}

$allFiles = @($allFiles | Sort-Object FullName -Unique)

$records = foreach ($file in $allFiles) {
    $content = ""
    $readError = $false
    $hash = ""
    $hashError = $false
    try {
        $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
    } catch {
        $content = ""
        $readError = $true
    }

    $hasSecret = [bool]($content -match $secretPattern)
    $lineCount = if ([string]::IsNullOrEmpty($content)) { 0 } else { ($content -split "`r?`n").Count }
    try {
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256 -ErrorAction Stop).Hash
    } catch {
        $hash = ""
        $hashError = $true
    }

    [PSCustomObject]@{
        Path            = $file.FullName
        SizeBytes       = $file.Length
        Extension       = $file.Extension
        Lines           = $lineCount
        SHA256          = $hash
        HasSecretMarker = $hasSecret
        ReadError       = $readError
        HashError       = $hashError
    }
}

$secretFiles = @($records | Where-Object { $_.HasSecretMarker })
$stats = [PSCustomObject]@{
    Label                     = $Label
    ExistingRoots             = $existingRoots
    MissingRoots              = $missingRoots
    MaxFileMB                 = $MaxFileMB
    IncludeExtensions         = $IncludeExtensions
    ExcludePathPatterns       = $ExcludePathPatterns
    ScannedFileCount          = $records.Count
    SecretMarkerFileCount     = $secretFiles.Count
    ReadErrorFileCount        = (@($records | Where-Object { $_.ReadError })).Count
    HashErrorFileCount        = (@($records | Where-Object { $_.HashError })).Count
    ArchiveGeneratedAt        = (Get-Date).ToString("s")
}

$manifest = [PSCustomObject]@{
    Meta  = $stats
    Files = $records
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
($secretFiles | Select-Object -ExpandProperty Path) | Set-Content -LiteralPath $secretFindingsPath -Encoding UTF8

$summaryLines = @()
$summaryLines += "# Storage Audit Summary ($Label, $dateStamp)"
$summaryLines += ""
$summaryLines += "Existing roots scanned:"
foreach ($r in $existingRoots) { $summaryLines += "- $r" }
$summaryLines += ""
$summaryLines += "Missing roots:"
if ($missingRoots.Count -eq 0) {
    $summaryLines += "- None"
} else {
    foreach ($r in $missingRoots) { $summaryLines += "- $r" }
}
$summaryLines += ""
$summaryLines += "Scan policy:"
$summaryLines += "- Extension allowlist only"
$summaryLines += "- Max file size: $MaxFileMB MB"
$summaryLines += "- Non-destructive, metadata-first audit"
$summaryLines += ""
$summaryLines += "Counts:"
$summaryLines += "- Candidate files scanned: $($records.Count)"
$summaryLines += "- Files with secret markers: $($secretFiles.Count)"
$summaryLines += "- Files with read errors: $($stats.ReadErrorFileCount)"
$summaryLines += "- Files with hash errors: $($stats.HashErrorFileCount)"
$summaryLines += ""
$summaryLines += "Artifacts:"
$summaryLines += "- Manifest: $manifestPath"
$summaryLines += "- Secret findings: $secretFindingsPath"
$summaryLines += ""
$summaryLines += "Policy:"
$summaryLines += "- Secret-bearing files remain archive-only."
$summaryLines += "- Do not ingest raw secrets into prompts."

$summaryContent = [string]::Join("`r`n", $summaryLines)
$summaryContent | Set-Content -LiteralPath $summaryPath -Encoding UTF8
$summaryContent | Set-Content -LiteralPath $memorySummaryPath -Encoding UTF8

$promptLines = @()
$promptLines += "Gemini handoff - storage audit complete"
$promptLines += ""
$promptLines += "Codex completed a non-destructive storage audit on $dateStamp."
$promptLines += ""
$promptLines += "Target label: $Label"
$promptLines += "Existing roots scanned:"
foreach ($r in $existingRoots) { $promptLines += "- $r" }
$promptLines += ""
$promptLines += "Missing requested roots:"
if ($missingRoots.Count -eq 0) {
    $promptLines += "- None"
} else {
    foreach ($r in $missingRoots) { $promptLines += "- $r" }
}
$promptLines += ""
$promptLines += "Results:"
$promptLines += "- Candidate files scanned: $($records.Count)"
$promptLines += "- Files with secret markers: $($secretFiles.Count)"
$promptLines += ""
$promptLines += "Artifacts:"
$promptLines += "- $manifestPath"
$promptLines += "- $secretFindingsPath"
$promptLines += "- $summaryPath"
$promptLines += ""
$promptLines += "Operational rule:"
$promptLines += "- Treat flagged files as archive-only."
$promptLines += "- Use sanitized summaries instead of raw secret-bearing content."

$promptContent = [string]::Join("`r`n", $promptLines)
$promptContent | Set-Content -LiteralPath $promptPath -Encoding UTF8
$promptContent | Set-Content -LiteralPath $memoryPromptPath -Encoding UTF8

Write-Output "Storage audit complete."
Write-Output "Summary: $summaryPath"
Write-Output "Prompt: $promptPath"
Write-Output "Memory summary: $memorySummaryPath"
Write-Output "Memory prompt: $memoryPromptPath"
