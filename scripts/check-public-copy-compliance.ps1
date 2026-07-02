#!/usr/bin/env pwsh
<#
.SYNOPSIS
Pre-push / CI check for public copy TOS compliance (business-only doctrine for YouAndINotAI).

Scopes strictly to active customer surfaces.
Blocks pushes containing disallowed language (ownership/voting/control claims from purchases, non-product fundraising, legacy entity language in public copy, etc.).

Install:
  Copy-Item scripts/check-public-copy-compliance.ps1 .git/hooks/pre-push -Force
  # (or use the .sh/.ps1 wrappers in this dir)
#>

param(
    [string[]]$Paths = @(),
    [switch]$CheckAll,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$disallowed = @(
    '\bownership\s*(rights?|claims?|stakes?)\b',
    '\bvoting\s*(rights?|power|control)\b',
    '\bcontrol\s*(rights?|mechanics?|promises?)\b',
    '\binvestment\s*(return|returns|yield)\b',
    '(?i)(non-product|private)\s*(fundraising|giving|tax)',
    '(?i)kids?\s*(fund|allocation|giving)',
    '(?i)charity|donation\s*(to|for)\s*(kids|cause)',
    'Trash Or Treasure.*(Recycler|LLC)',
    '(?i)\bDAO\b.*(ownership|vote|control)',
    'receipt.*(creates|grants)\s*(control|ownership|vote)'
)

# Active customer / public copy paths only
$publicPaths = @(
    'apps/youandinotai-frontend',
    'content',
    '_deploy/youandinotai'
)

function Get-Files {
    if ($CheckAll) {
        git ls-files -- $publicPaths 2>$null | Where-Object { Test-Path $_ }
    } elseif ($Paths) {
        $Paths | Where-Object { Test-Path $_ } | ForEach-Object { Resolve-Path $_ }
    } else {
        $staged = git diff --cached --name-only 2>$null
        $recent = git diff --name-only HEAD~1 2>$null
        ($staged + $recent) | Sort-Object -Unique | Where-Object {
            $f = $_
            $publicPaths | Where-Object { $f -like "$_*" }
        } | ForEach-Object { if (Test-Path $_) { $_ } }
    }
}

$files = Get-Files | Select-Object -Unique
if (-not $files) {
    if (-not $Quiet) { Write-Host "No relevant public/customer files to check." }
    exit 0
}

$violations = @()
foreach ($f in $files) {
    if ($f -notmatch '\.(md|mdx|tsx?|jsx?|html|txt)$') { continue }
    $txt = Get-Content $f -Raw -ErrorAction SilentlyContinue
    if (-not $txt) { continue }
    foreach ($p in $disallowed) {
        if ($txt -match $p) {
            $violations += [pscustomobject]@{File=$f; Pattern=$p; Match = ($matches[0] -replace '\s+',' ').Trim()}
        }
    }
}

if ($violations) {
    Write-Host "Public copy / TOS compliance violations (business-only rules):" -ForegroundColor Red
    $violations | Format-Table -AutoSize | Out-String | Write-Host
    Write-Host "Fix and retry. See briefings/TOS_AUDIT_YOUANDINOTAI_*.md and CLAUDE.md/AGENTS.md"
    exit 1
}

if (-not $Quiet) { Write-Host "Public copy TOS compliance check passed (youandinotai surfaces)." -ForegroundColor Green }
exit 0
