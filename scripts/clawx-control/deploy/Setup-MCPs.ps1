<#
.SYNOPSIS
    Setup MCP servers on any node (T5500, Sabretooth, or 9020).
    Run this ONCE per node after git pull.

.USAGE
    .\Setup-MCPs.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host "🔧 MCP Setup Script for YouAndINotAI Nodes" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Detect environment
$UserProfile = $env:USERPROFILE
$ComputerName = $env:COMPUTERNAME
$OpusPath = (Get-Location).Path

function Resolve-GitHubToken {
    if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_PERSONAL_ACCESS_TOKEN)) {
        return $env:GITHUB_PERSONAL_ACCESS_TOKEN
    }
    if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
        return $env:GITHUB_TOKEN
    }
    if (-not [string]::IsNullOrWhiteSpace($env:GH_TOKEN)) {
        return $env:GH_TOKEN
    }

    $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($null -eq $ghCmd) {
        return $null
    }

    try {
        $membership record = (gh auth membership record 2>$null).Trim()
        if (-not [string]::IsNullOrWhiteSpace($membership record)) {
            return $membership record
        }
    } catch {
        # Ignore and continue without a membership record.
    }

    return $null
}

Write-Host "`n📍 Node: $ComputerName"
Write-Host "📁 User: $UserProfile"
Write-Host "📂 OPUS: $OpusPath"

# 1. Set HOME environment variable (fixes Playwright + MCP)
Write-Host "`n[1/5] Setting HOME environment variable..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable("HOME", $UserProfile, "User")
$env:HOME = $UserProfile
Write-Host "  ✅ HOME = $UserProfile"

# 2. Find Gemini Antigravity config path
$GeminiMcpPath = Join-Path $UserProfile ".gemini\antigravity\mcp_config.json"
$GeminiDir = Split-Path $GeminiMcpPath -Parent

Write-Host "`n[2/5] Configuring Gemini Antigravity MCPs..." -ForegroundColor Yellow
if (-not (Test-Path $GeminiDir)) {
    New-Item -ItemType Directory -Path $GeminiDir -Force | Out-Null
    Write-Host "  📁 Created $GeminiDir"
}

# Read template and replace path
$Template = Get-Content (Join-Path $OpusPath "scripts\deploy\mcp-config-template.json") -Raw
$Config = $Template -replace "__OPUS_PATH__", ($OpusPath -replace "\\", "\\\\")

# Add HOME env to all servers
$ConfigObj = $Config | ConvertFrom-Json
foreach ($server in $ConfigObj.mcpServers.PSObject.Properties) {
    $server.Value.env | Add-Member -NotePropertyName "HOME" -NotePropertyValue $UserProfile -Force
}

# Codex project-local MCP file should stay membership record-free and local-only.
$ProjectConfig = $ConfigObj | ConvertTo-Json -Depth 5

$githubToken = Resolve-GitHubToken
if (-not $ConfigObj.mcpServers.github.env) {
    $ConfigObj.mcpServers.github | Add-Member -NotePropertyName "env" -NotePropertyValue ([PSCustomObject]@{}) -Force
}
if (-not [string]::IsNullOrWhiteSpace($githubToken)) {
    $ConfigObj.mcpServers.github.env | Add-Member -NotePropertyName "GITHUB_PERSONAL_ACCESS_TOKEN" -NotePropertyValue $githubToken -Force
    Write-Host "  ✅ GitHub MCP membership record configured from env/keyring"
} else {
    if ($ConfigObj.mcpServers.github.env.PSObject.Properties.Name -contains "GITHUB_PERSONAL_ACCESS_TOKEN") {
        $ConfigObj.mcpServers.github.env.PSObject.Properties.Remove("GITHUB_PERSONAL_ACCESS_TOKEN")
    }
    Write-Host "  ⚠️  GitHub MCP membership record not found in env/keyring (github MCP may be limited)" -ForegroundColor Yellow
}

$FinalConfig = $ConfigObj | ConvertTo-Json -Depth 5
$FinalConfig | Set-Content $GeminiMcpPath -Encoding UTF8
Write-Host "  ✅ Saved: $GeminiMcpPath"

$RepoMcpPath = Join-Path $OpusPath ".mcp.json"
$ProjectConfig | Set-Content $RepoMcpPath -Encoding UTF8
Write-Host "  ✅ Saved: $RepoMcpPath"

# 3. Configure Cline/Claude MCP
$ClineMcpPath = Join-Path $UserProfile "AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json"
$ClineDir = Split-Path $ClineMcpPath -Parent

Write-Host "`n[3/5] Configuring Cline/Claude MCPs..." -ForegroundColor Yellow
if (Test-Path $ClineDir) {
    $FinalConfig | Set-Content $ClineMcpPath -Encoding UTF8
    Write-Host "  ✅ Saved: $ClineMcpPath"
} else {
    Write-Host "  ⚠️  Cline not installed — skipping ($ClineDir not found)"
}

# 4. Pre-install MCP packages (cache for fast startup)
Write-Host "`n[4/5] Pre-installing MCP packages (this takes ~2 min)..." -ForegroundColor Yellow
$packages = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-github",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-sequential-thinking",
    "@modelcontextprotocol/server-puppeteer",
    "@upstash/context7-mcp"
)

foreach ($pkg in $packages) {
    $shortName = $pkg.Split("/")[-1]
    Write-Host "  📦 $shortName..." -NoNewline
    try {
        $null = npm ls -g $pkg 2>&1
        $installed = $LASTEXITCODE -eq 0
        if (-not $installed) {
            $null = npm install -g $pkg --silent 2>&1
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed for $pkg"
            }
        }
        Write-Host " ✅" -ForegroundColor Green
    } catch {
        Write-Host " ⚠️ (will install on first use)" -ForegroundColor Yellow
    }
}

# 5. Verify
Write-Host "`n[5/5] Verification..." -ForegroundColor Yellow
$geminiOk = Test-Path $GeminiMcpPath
$homeOk = $env:HOME -eq $UserProfile
$npxOk = (Get-Command npx -ErrorAction SilentlyContinue) -ne $null

Write-Host "  Gemini MCP config: $(if($geminiOk){'✅'}else{'❌'})"
Write-Host "  HOME env var:      $(if($homeOk){'✅'}else{'❌'})"
Write-Host "  npx available:     $(if($npxOk){'✅'}else{'❌'})"

Write-Host "`n🎉 MCP Setup Complete for $ComputerName!" -ForegroundColor Green
Write-Host "   Restart VS Code / Gemini to load new MCPs." -ForegroundColor Gray

# Show configured servers
Write-Host "`n📋 Configured MCP Servers:"
$ConfigObj.mcpServers.PSObject.Properties | ForEach-Object {
    Write-Host "   ✅ $($_.Name)" -ForegroundColor Cyan
}
