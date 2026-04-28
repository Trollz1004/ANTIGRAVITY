$ErrorActionPreference = 'Continue'
Write-Output '=== PORTS ==='
foreach ($port in @(3100, 54329, 11434, 11435, 11436, 18789)) {
    Write-Output "PORT $port"
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object LocalAddress, LocalPort, State, OwningProcess |
        Format-Table -AutoSize
}

Write-Output '=== PROCESSES ==='
Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match 'paperclip|cloudflared|wrangler|ollama|openclaw|opencode' } |
    Select-Object ProcessId, Name, CommandLine |
    Format-List

Write-Output '=== COMMANDS ==='
foreach ($cmd in @('paperclipai','cloudflared','wrangler','ollama','opencode','codex','claude','gemini')) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found) { Write-Output "$cmd=$($found.Source)" }
    else { Write-Output "$cmd=MISSING" }
}

Write-Output '=== OLLAMA_MODELS ==='
Write-Output $env:OLLAMA_MODELS
