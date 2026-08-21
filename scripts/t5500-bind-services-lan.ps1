# T5500 LAN-bind script — paste into an ELEVATED PowerShell on T5500.
#
# What it does:
#   For each cockpit-watched service on T5500 (postgres, qdrant, redis, openclaw),
#   adds a Windows TCP portproxy that forwards 0.0.0.0:<port> -> 127.0.0.1:<port>,
#   and opens a Private-profile firewall rule on that port. Non-destructive — no
#   Docker container is touched, no data is moved. Reversible (see UNDO at bottom).
#
# Run as Administrator (right-click PowerShell -> Run as Administrator), then paste
# this whole file in. Idempotent: safe to paste again any time.
#
# Verify from Sabretooth after running:
#   Test-NetConnection 192.168.0.8 -Port 5432  ->  TcpTestSucceeded : True
#   Invoke-WebRequest http://localhost:8787/health/t5500 (Mission Control API
#   on Sabretooth)  ->  status:"ok", every sub-service status:"ok"

# ---- guardrail: must be elevated ----
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
    Write-Host 'FAIL: this script must run from an ELEVATED PowerShell.' -ForegroundColor Red
    Write-Host '  Right-click PowerShell -> Run as Administrator, then paste again.' -ForegroundColor Yellow
    return
}

# ---- IP Helper service must be running for portproxy ----
$svc = Get-Service iphlpsvc -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -ne 'Running') {
    Write-Host 'starting IP Helper service (required for portproxy)' -ForegroundColor Cyan
    Start-Service iphlpsvc
}

# ---- service map ----
$services = @(
    @{ name = 'postgres';    port = 5432; label = 'uandinotai-postgres' },
    @{ name = 'qdrant';      port = 6333; label = 'qdrant vector' },
    @{ name = 'qdrant_grpc'; port = 6334; label = 'qdrant grpc' },
    @{ name = 'redis';       port = 6379; label = 'redis cache' },
    @{ name = 'openclaw';    port = 3200; label = 'openclaw api' }
)

# ---- snapshot existing portproxy state ----
$existingProxy = (& netsh interface portproxy show v4tov4) -join "`n"

Write-Host ''
Write-Host '=== T5500 LAN-bind (portproxy + firewall) ===' -ForegroundColor Cyan

foreach ($s in $services) {
    $port  = $s.port
    $label = $s.label

    # --- portproxy ---
    $proxyMatch = $existingProxy -match ("\b" + [regex]::Escape("0.0.0.0") + "\s+" + $port + "\b")
    if ($proxyMatch) {
        Write-Host ("  [{0,-5}] {1,-22} portproxy already present" -f $port, $label) -ForegroundColor DarkGreen
    } else {
        $null = & netsh interface portproxy add v4tov4 `
            listenaddress=0.0.0.0 listenport=$port `
            connectaddress=127.0.0.1 connectport=$port 2>&1
        Write-Host ("  [{0,-5}] {1,-22} portproxy ADDED  0.0.0.0:{0} -> 127.0.0.1:{0}" -f $port, $label) -ForegroundColor Green
    }

    # --- firewall rule (Private profile only — keep public-network deny in place) ---
    $ruleName = "T5500 LAN $label ($port)"
    $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($rule) {
        Write-Host ("         {0} firewall rule already present" -f ' '.PadRight(22)) -ForegroundColor DarkGreen
    } else {
        $null = New-NetFirewallRule -DisplayName $ruleName `
            -Direction Inbound -Protocol TCP -LocalPort $port `
            -Action Allow -Profile Private -ErrorAction SilentlyContinue
        Write-Host ("         {0} firewall rule ADDED (Private profile)" -f ' '.PadRight(22)) -ForegroundColor Green
    }
}

Write-Host ''
Write-Host '=== verify state ===' -ForegroundColor Cyan
Write-Host ''
Write-Host '--- portproxy table ---' -ForegroundColor Yellow
& netsh interface portproxy show v4tov4
Write-Host ''
Write-Host '--- firewall rules added ---' -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName 'T5500 LAN *' | Format-Table DisplayName, Enabled, Direction, Action -AutoSize
Write-Host ''
Write-Host '--- 0.0.0.0 listeners on the watched ports ---' -ForegroundColor Yellow
Get-NetTCPConnection -State Listen |
    Where-Object { $_.LocalPort -in @(5432, 6333, 6334, 6379, 3200) -and $_.LocalAddress -eq '0.0.0.0' } |
    Format-Table LocalAddress, LocalPort, OwningProcess -AutoSize
Write-Host ''
Write-Host '=== done ===' -ForegroundColor Green
Write-Host ''
Write-Host 'From Sabretooth (192.168.0.8), Mission Control should now go green:' -ForegroundColor White
Write-Host '  Test-NetConnection 192.168.0.8 -Port 5432' -ForegroundColor Gray
Write-Host '  Invoke-WebRequest http://localhost:8787/health/t5500 -UseBasicParsing | Select Content' -ForegroundColor Gray
Write-Host ''
Write-Host 'UNDO (paste this into elevated PS to reverse):' -ForegroundColor White
Write-Host '  foreach ($p in 5432,6333,6334,6379,3200) {' -ForegroundColor Gray
Write-Host '      netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$p' -ForegroundColor Gray
Write-Host '  }' -ForegroundColor Gray
Write-Host '  Get-NetFirewallRule -DisplayName "T5500 LAN *" | Remove-NetFirewallRule' -ForegroundColor Gray
