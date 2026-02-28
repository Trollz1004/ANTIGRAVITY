[CmdletBinding()]
param(
    [string]$SourceRoot = "C:\Users\joshl\OneDrive\e-commerce-orchestrator-v2\Desktop\JOSHUA'sPERSONAL RECORDS NEVER COMIT TO GITHUB",
    [string]$RepoRoot = "C:\OPUSONLY"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Get-FileKind {
    param(
        [Parameter(Mandatory = $true)][System.IO.FileInfo]$File,
        [Parameter(Mandatory = $true)][bool]$HasChat,
        [Parameter(Mandatory = $true)][bool]$HasSolidity
    )

    if ($File.Extension -eq ".code-workspace") { return "workspace-link" }
    if ($HasSolidity) { return "solidity-spec-dump" }
    if ($HasChat) { return "chat-log" }
    if ($File.FullName -like "*\printful-ready\*") { return "design-print-asset" }
    if ($File.Extension -eq ".env") { return "secrets-env" }
    if ($File.Extension -eq ".bat") { return "launcher-script" }
    if ($File.Extension -eq ".json") { return "config-archive-json" }
    if ($File.Extension -eq ".md") { return "markdown-notes" }
    return "misc"
}

if (-not (Test-Path -LiteralPath $SourceRoot)) {
    throw "SourceRoot does not exist: $SourceRoot"
}

$dateStamp = Get-Date -Format "yyyy-MM-dd"
$archiveDir = Join-Path $RepoRoot "_ARCHIVE\personal-records-audit-$dateStamp"
$memoryDir = Join-Path $RepoRoot "memory"

Ensure-Directory -Path $archiveDir
Ensure-Directory -Path $memoryDir

$manifestPath = Join-Path $archiveDir "manifest.json"
$duplicatesPath = Join-Path $archiveDir "duplicates.json"
$secretListPath = Join-Path $archiveDir "secret-risk-files.txt"
$safeListPath = Join-Path $archiveDir "safe-reference-files.txt"
$summaryPath = Join-Path $archiveDir "summary.md"
$promptPath = Join-Path $archiveDir "gemini-handoff-prompt.txt"
$memorySummaryPath = Join-Path $memoryDir "PERSONAL-RECORDS-CLEANUP-SUMMARY-$dateStamp.md"
$memoryPromptPath = Join-Path $memoryDir "GEMINI-HANDOFF-PROMPT-PERSONAL-RECORDS-$dateStamp.txt"

$secretPattern = "(?im)(sk-proj-[A-Za-z0-9_\-]+|sk-ant-[A-Za-z0-9_\-]+|xox[baprs]-[A-Za-z0-9\-]+|(?:api[_-]?key|secret|token|private[_\s-]?key|pass(word|phrase)|mnemonic)\s*[:=]\s*\S+|BEGIN (?:RSA )?PRIVATE KEY|SQUARE_ACCESS_TOKEN\s*=\s*\S+|STRIPE_SECRET_KEY\s*=\s*\S+|PLAID_SECRET\s*=\s*\S+|TELEGRAM_BOT_TOKEN\s*=\s*\S+)"
$chatPattern = "(?im)(This session is being continued|Copilot Chat Conversation Export|Primary Request and Intent|Key Technical Concepts)"
$solidityPattern = "(?im)(pragma solidity|contract\s+[A-Za-z0-9_]+|import\s+""@openzeppelin)"

$files = Get-ChildItem -LiteralPath $SourceRoot -Recurse -File -Force | Sort-Object FullName

$records = foreach ($file in $files) {
    $content = ""
    try {
        $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
    } catch {
        $content = ""
    }

    $hasSecret = [bool]($content -match $secretPattern)
    $hasChat = [bool]($content -match $chatPattern)
    $hasSolidity = [bool]($content -match $solidityPattern)
    $lines = if ([string]::IsNullOrEmpty($content)) { 0 } else { ($content -split "`r?`n").Count }
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    $kind = Get-FileKind -File $file -HasChat $hasChat -HasSolidity $hasSolidity
    $relativePath = $file.FullName.Substring($SourceRoot.Length).TrimStart("\")

    [PSCustomObject]@{
        Path            = $file.FullName
        RelativePath    = $relativePath
        Extension       = $file.Extension
        SizeBytes       = $file.Length
        Lines           = $lines
        SHA256          = $hash
        Kind            = $kind
        HasSecretMarker = $hasSecret
        HasChatHistory  = $hasChat
        HasSolidity     = $hasSolidity
    }
}

$duplicateGroups = @()
$duplicateHashToGroup = @{}
$groupIndex = 0
foreach ($group in ($records | Group-Object SHA256 | Where-Object { $_.Count -gt 1 })) {
    $groupIndex++
    $groupId = "dup-$groupIndex"
    $duplicateHashToGroup[$group.Name] = $groupId
    $duplicateGroups += [PSCustomObject]@{
        GroupId = $groupId
        SHA256  = $group.Name
        Count   = $group.Count
        Files   = @($group.Group.Path)
    }
}

$recordsWithDup = foreach ($record in $records) {
    $dupGroup = if ($duplicateHashToGroup.ContainsKey($record.SHA256)) { $duplicateHashToGroup[$record.SHA256] } else { "" }
    [PSCustomObject]@{
        Path            = $record.Path
        RelativePath    = $record.RelativePath
        Extension       = $record.Extension
        SizeBytes       = $record.SizeBytes
        Lines           = $record.Lines
        SHA256          = $record.SHA256
        DuplicateGroup  = $dupGroup
        Kind            = $record.Kind
        HasSecretMarker = $record.HasSecretMarker
        HasChatHistory  = $record.HasChatHistory
        HasSolidity     = $record.HasSolidity
    }
}

$secretFiles = $recordsWithDup | Where-Object { $_.HasSecretMarker }
$safeReferenceFiles = $recordsWithDup | Where-Object { -not $_.HasSecretMarker }
$chatFiles = $recordsWithDup | Where-Object { $_.HasChatHistory }
$solidityFiles = $recordsWithDup | Where-Object { $_.HasSolidity }

$stats = [PSCustomObject]@{
    SourceRoot               = $SourceRoot
    TotalFiles               = $recordsWithDup.Count
    FilesWithSecretMarkers   = $secretFiles.Count
    FilesWithChatHistory     = $chatFiles.Count
    FilesWithSolidityContent = $solidityFiles.Count
    DuplicateGroups          = $duplicateGroups.Count
    DuplicateFiles           = ($duplicateGroups | Measure-Object -Property Count -Sum).Sum
    ArchiveGeneratedAt       = (Get-Date).ToString("s")
}

$manifest = [PSCustomObject]@{
    Meta          = $stats
    Files         = @($recordsWithDup)
    DuplicateSets = @($duplicateGroups)
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
$duplicateGroups | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $duplicatesPath -Encoding UTF8
($secretFiles | Select-Object -ExpandProperty Path) | Set-Content -LiteralPath $secretListPath -Encoding UTF8
($safeReferenceFiles | Select-Object -ExpandProperty Path) | Set-Content -LiteralPath $safeListPath -Encoding UTF8

$summaryLines = @()
$summaryLines += "# Personal Records Cleanup Summary ($dateStamp)"
$summaryLines += ""
$summaryLines += "Source scanned:"
$summaryLines += "- $SourceRoot"
$summaryLines += ""
$summaryLines += "Cleanup model:"
$summaryLines += "- Non-destructive cleanup"
$summaryLines += "- Built archive metadata and safety tagging"
$summaryLines += "- Excluded secret-bearing files from direct active-context recommendation"
$summaryLines += ""
$summaryLines += "Metrics:"
$summaryLines += "- Total files: $($stats.TotalFiles)"
$summaryLines += "- Files with secret markers: $($stats.FilesWithSecretMarkers)"
$summaryLines += "- Files with chat history markers: $($stats.FilesWithChatHistory)"
$summaryLines += "- Files with Solidity/spec content: $($stats.FilesWithSolidityContent)"
$summaryLines += "- Duplicate groups: $($stats.DuplicateGroups)"
$summaryLines += ""
$summaryLines += "Generated artifacts:"
$summaryLines += "- Manifest: $manifestPath"
$summaryLines += "- Duplicate sets: $duplicatesPath"
$summaryLines += "- Secret-risk files: $secretListPath"
$summaryLines += "- Safe-reference files: $safeListPath"
$summaryLines += ""
$summaryLines += "Duplicate groups:"
if ($duplicateGroups.Count -eq 0) {
    $summaryLines += "- None detected"
} else {
    foreach ($dup in $duplicateGroups) {
        $summaryLines += "- $($dup.GroupId): $($dup.Count) files"
        foreach ($path in $dup.Files) {
            $summaryLines += "  - $path"
        }
    }
}
$summaryLines += ""
$summaryLines += "Policy decisions:"
$summaryLines += "- Keep this folder as private archive only."
$summaryLines += "- Use sanitized summaries for assistant memory context."
$summaryLines += "- Do not ingest raw .env or secret-bearing mega-dumps into live prompts."
$summaryLines += ""
$summaryLines += "Recommended next step:"
$summaryLines += "- Build a single sanitized identity/context doc from approved snippets only."

$summaryContent = [string]::Join("`r`n", $summaryLines)
$summaryContent | Set-Content -LiteralPath $summaryPath -Encoding UTF8
$summaryContent | Set-Content -LiteralPath $memorySummaryPath -Encoding UTF8

$promptLines = @()
$promptLines += "Gemini handoff - personal records cleanup complete"
$promptLines += ""
$promptLines += "Codex completed a non-destructive cleanup and archive audit on $dateStamp."
$promptLines += ""
$promptLines += "Scope:"
$promptLines += "- Source: $SourceRoot"
$promptLines += "- Total files scanned: $($stats.TotalFiles)"
$promptLines += "- Secret-bearing files detected: $($stats.FilesWithSecretMarkers)"
$promptLines += "- Duplicate groups detected: $($stats.DuplicateGroups)"
$promptLines += ""
$promptLines += "What was done:"
$promptLines += "1. Built a full manifest with hash, file kind, and risk flags."
$promptLines += "2. Identified duplicate payloads and grouped them by hash."
$promptLines += "3. Generated secret-risk and safe-reference file lists."
$promptLines += "4. Archived all audit outputs to _ARCHIVE and memory for continuity."
$promptLines += ""
$promptLines += "Artifacts:"
$promptLines += "- $manifestPath"
$promptLines += "- $duplicatesPath"
$promptLines += "- $secretListPath"
$promptLines += "- $safeListPath"
$promptLines += "- $summaryPath"
$promptLines += ""
$promptLines += "Operational rule:"
$promptLines += "- Treat this dataset as private archive-only."
$promptLines += "- Do not ingest raw secret-bearing files into active prompts."
$promptLines += "- Use sanitized summaries only."
$promptLines += ""
$promptLines += "Requested from Gemini:"
$promptLines += "1. Confirm this archive policy is accepted for all future agent sessions."
$promptLines += "2. Use the generated summary as context baseline."
$promptLines += "3. Continue with sanitized-memory workflow only."

$promptContent = [string]::Join("`r`n", $promptLines)
$promptContent | Set-Content -LiteralPath $promptPath -Encoding UTF8
$promptContent | Set-Content -LiteralPath $memoryPromptPath -Encoding UTF8

Write-Output "Audit complete."
Write-Output "Summary: $summaryPath"
Write-Output "Prompt: $promptPath"
Write-Output "Memory summary: $memorySummaryPath"
Write-Output "Memory prompt: $memoryPromptPath"
