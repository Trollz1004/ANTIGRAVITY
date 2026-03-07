[CmdletBinding()]
param(
    [string]$RepoRoot,
    [string]$WorkspaceRoot
)

$ErrorActionPreference = "Continue"

if (-not $RepoRoot) {
    $RepoRoot = Split-Path -Parent $PSScriptRoot
}
if (-not $WorkspaceRoot) {
    $WorkspaceRoot = Join-Path $RepoRoot "CodeX"
}

function Write-Result {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][ValidateSet("PASS", "WARN", "FAIL")][string]$Status,
        [Parameter(Mandatory = $true)][string]$Detail
    )

    $color = switch ($Status) {
        "PASS" { "Green" }
        "WARN" { "DarkYellow" }
        default { "Red" }
    }

    Write-Host ("[{0}] {1} :: {2}" -f $Status, $Label, $Detail) -ForegroundColor $color
}

function Test-CommandExists {
    param([Parameter(Mandatory = $true)][string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-CodexTrust {
    param(
        [Parameter(Mandatory = $true)][string]$ConfigPath,
        [Parameter(Mandatory = $true)][string]$ProjectPath
    )

    if (-not (Test-Path $ConfigPath)) {
        return $false
    }

    $text = Get-Content -Raw $ConfigPath
    return $text -match [regex]::Escape("[projects.'$ProjectPath']")
}

function Test-SshAlias {
    param(
        [Parameter(Mandatory = $true)][string]$Alias,
        [Parameter(Mandatory = $true)][string]$ExpectedOk
    )

    $output = & ssh -o BatchMode=yes -o ConnectTimeout=8 $Alias "echo $ExpectedOk && hostname && whoami" 2>&1
    $code = $LASTEXITCODE
    $text = ($output | Out-String).Trim()

    return [PSCustomObject]@{
        Alias = $Alias
        ExitCode = $code
        Output = $text
        Success = ($code -eq 0 -and $text -match [regex]::Escape($ExpectedOk))
    }
}

function Test-TcpPortQuick {
    param(
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutMs = 1500
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
            return $false
        }

        $client.EndConnect($async)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

Write-Host ""
Write-Host "=== Codex Doctor ===" -ForegroundColor Cyan
Write-Host ("Time      : {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"))
Write-Host ("Hostname  : {0}" -f $env:COMPUTERNAME)
Write-Host ("RepoRoot  : {0}" -f $RepoRoot)
Write-Host ("Workspace : {0}" -f $WorkspaceRoot)
Write-Host ""

$codexConfig = Join-Path $env:USERPROFILE ".codex\config.toml"
$sshConfig = Join-Path $env:USERPROFILE ".ssh\config"
$mcpPath = Join-Path $RepoRoot ".mcp.json"
$workspaceMcpPath = Join-Path $WorkspaceRoot ".mcp.json"
$geminiMcpPath = Join-Path $env:USERPROFILE ".gemini\antigravity\mcp_config.json"
$memoryComposePath = Join-Path $RepoRoot "infra\codex-memory\docker-compose.yml"
$localMemoryRequested = $env:CODEX_ENABLE_LOCAL_MEMORY_STACK -eq "1"
$qdrantUp = Test-TcpPortQuick -HostName "127.0.0.1" -Port 6333
$redisUp = Test-TcpPortQuick -HostName "127.0.0.1" -Port 6379

if (Test-Path $codexConfig) {
    if (Test-CodexTrust -ConfigPath $codexConfig -ProjectPath $RepoRoot) {
        Write-Result -Label "Codex Trust" -Status "PASS" -Detail "$RepoRoot is trusted"
    } else {
        Write-Result -Label "Codex Trust" -Status "FAIL" -Detail "$RepoRoot missing from $codexConfig"
    }

    if (Test-CodexTrust -ConfigPath $codexConfig -ProjectPath $WorkspaceRoot) {
        Write-Result -Label "Codex Trust" -Status "PASS" -Detail "$WorkspaceRoot is trusted"
    } else {
        Write-Result -Label "Codex Trust" -Status "FAIL" -Detail "$WorkspaceRoot missing from $codexConfig"
    }
} else {
    Write-Result -Label "Codex Trust" -Status "FAIL" -Detail "Missing $codexConfig"
}

if (Test-Path $mcpPath) {
    try {
        $mcp = Get-Content -Raw $mcpPath | ConvertFrom-Json
        $names = @($mcp.mcpServers.PSObject.Properties.Name)
        if ($names.Count -gt 0) {
            Write-Result -Label "Project MCP" -Status "PASS" -Detail ("{0} servers configured: {1}" -f $names.Count, ($names -join ", "))
        } else {
            Write-Result -Label "Project MCP" -Status "WARN" -Detail "No servers found in $mcpPath"
        }
    } catch {
        Write-Result -Label "Project MCP" -Status "FAIL" -Detail "Invalid JSON in $mcpPath"
    }
} else {
    Write-Result -Label "Project MCP" -Status "FAIL" -Detail "Missing $mcpPath"
}

if (Test-Path $workspaceMcpPath) {
    try {
        $workspaceMcp = Get-Content -Raw $workspaceMcpPath | ConvertFrom-Json
        $workspaceNames = @($workspaceMcp.mcpServers.PSObject.Properties.Name)
        if ($workspaceNames.Count -gt 0) {
            Write-Result -Label "Workspace MCP" -Status "PASS" -Detail ("{0} servers configured: {1}" -f $workspaceNames.Count, ($workspaceNames -join ", "))
        } else {
            Write-Result -Label "Workspace MCP" -Status "WARN" -Detail "No servers found in $workspaceMcpPath"
        }
    } catch {
        Write-Result -Label "Workspace MCP" -Status "FAIL" -Detail "Invalid JSON in $workspaceMcpPath"
    }
} else {
    Write-Result -Label "Workspace MCP" -Status "WARN" -Detail "Missing $workspaceMcpPath"
}

if (Test-Path $geminiMcpPath) {
    Write-Result -Label "Gemini MCP" -Status "PASS" -Detail "Found $geminiMcpPath"
} else {
    Write-Result -Label "Gemini MCP" -Status "WARN" -Detail "Missing $geminiMcpPath"
}

if (Test-Path $sshConfig) {
    Write-Result -Label "SSH Config" -Status "PASS" -Detail "Found $sshConfig"
} else {
    Write-Result -Label "SSH Config" -Status "FAIL" -Detail "Missing $sshConfig"
}

$requiredPackages = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-puppeteer",
    "@modelcontextprotocol/server-github"
)

if (Test-CommandExists -Name "npm") {
    $pkgOutput = & npm ls -g $requiredPackages --depth=0 2>&1
    $pkgText = ($pkgOutput | Out-String)
    foreach ($pkg in $requiredPackages) {
        if ($pkgText -match [regex]::Escape($pkg)) {
            Write-Result -Label "MCP Package" -Status "PASS" -Detail "$pkg installed globally"
        } else {
            Write-Result -Label "MCP Package" -Status "WARN" -Detail "$pkg not detected globally"
        }
    }
} else {
    Write-Result -Label "MCP Package" -Status "FAIL" -Detail "npm not available"
}

if (Test-Path $memoryComposePath) {
    Write-Result -Label "Memory Compose" -Status "PASS" -Detail "Optional local-memory compose file present at $memoryComposePath"
} else {
    if ($localMemoryRequested) {
        Write-Result -Label "Memory Compose" -Status "WARN" -Detail "Local memory stack requested but compose file is missing: $memoryComposePath"
    } else {
        Write-Result -Label "Memory Compose" -Status "PASS" -Detail "Optional local-memory compose is not configured on this node"
    }
}

if (Test-CommandExists -Name "docker") {
    $dockerContext = (& docker context show 2>$null | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($dockerContext)) {
        Write-Result -Label "Docker" -Status "PASS" -Detail "Installed, but docker context is not currently readable"
    } else {
        Write-Result -Label "Docker" -Status "PASS" -Detail "Installed (context: $dockerContext)"
    }
} else {
    Write-Result -Label "Docker" -Status "PASS" -Detail "Not installed on this desktop-app-first node"
}

if ($localMemoryRequested -or $qdrantUp -or $redisUp) {
    if ($qdrantUp) {
        Write-Result -Label "Memory Port 6333" -Status "PASS" -Detail "qdrant is listening on localhost:6333"
    } else {
        Write-Result -Label "Memory Port 6333" -Status "WARN" -Detail "qdrant is not listening on localhost:6333"
    }

    if ($redisUp) {
        Write-Result -Label "Memory Port 6379" -Status "PASS" -Detail "redis is listening on localhost:6379"
    } else {
        Write-Result -Label "Memory Port 6379" -Status "WARN" -Detail "redis is not listening on localhost:6379"
    }
} else {
    Write-Result -Label "Local Memory Stack" -Status "PASS" -Detail "Not enabled on this node"
}

if (Test-CommandExists -Name "ssh") {
    $t5500 = Test-SshAlias -Alias "t5500" -ExpectedOk "OK-T5500"
    if ($t5500.Success) {
        Write-Result -Label "SSH t5500" -Status "PASS" -Detail $t5500.Output
    } else {
        Write-Result -Label "SSH t5500" -Status "FAIL" -Detail $t5500.Output
    }

    $n9020 = Test-SshAlias -Alias "9020" -ExpectedOk "OK-9020"
    if ($n9020.Success) {
        Write-Result -Label "SSH 9020" -Status "PASS" -Detail $n9020.Output
    } else {
        Write-Result -Label "SSH 9020" -Status "FAIL" -Detail $n9020.Output
    }
} else {
    Write-Result -Label "SSH" -Status "FAIL" -Detail "ssh.exe not available"
}

Write-Host ""
Write-Host ("If Codex desktop still cannot see project MCP servers, restart the app and open a fresh thread in {0}." -f $RepoRoot) -ForegroundColor Cyan
