# ==============================================================================
# GEMINI CLI LAUNCHER
# Node: Sabretooth C:\ Drive
# ==============================================================================

$RepoRoot = "c:\antigravity"
$RepoPromptFile = Join-Path $RepoRoot "GEMINI.md"

Write-Host "=========================" -ForegroundColor Cyan
Write-Host " STARTING GEMINI IN MAIN " -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Workspace: $RepoRoot" -ForegroundColor DarkGray

if (-not (Get-Command gemini -ErrorAction SilentlyContinue)) {
    Write-Host "Gemini CLI is not on PATH." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $RepoRoot)) {
    Write-Host "Repo root not found: $RepoRoot" -ForegroundColor Red
    exit 1
}

if (Test-Path $RepoPromptFile) {
    Write-Host "Repo-local GEMINI.md found." -ForegroundColor Green
} else {
    Write-Host "Repo-local GEMINI.md missing at $RepoPromptFile" -ForegroundColor Yellow
}

Set-Location $RepoRoot

Write-Host ""
Write-Host "Recommended first command inside Gemini: git pull origin main" -ForegroundColor Blue
Write-Host "Type 'exit' to leave Gemini." -ForegroundColor DarkMagenta
Write-Host ""

gemini
