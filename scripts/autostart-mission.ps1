# Mission stack unified bootstrap.
#
# Brings up the entire stack in dependency order, HIDDEN, no cursor movement:
#   1. Ollama
#   2. OmniRoute LB
#   3. Paperclip loopback
#   4. Auth proxy
#   5. OpenClaw / MCP gateway
#   6. Cloudflare tunnel
#   7. Date app frontend :3200
#   8. Date app backend :8000
#   9. Mission Control :8787
#   10. Red/Green dashboard :5678
#
# All services start hidden. No terminal windows. No cursor movement.
# Logs to E:\ANTIGRAVITY\logs\autostart-YYYY-MM-DD.log
#
# Triggered automatically at user login via Scheduled Task.
#

$ErrorActionPreference = 'Continue'
$Repo   = 'E:\ANTIGRAVITY'
$LogDir = "$Repo\logs"
$Log    = "$LogDir\autostart-$(Get-Date -Format 'yyyy-MM-dd').log"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content -Path $Log -Value $line -ErrorAction SilentlyContinue
    Write-Host $line
}

function Test-LocalPort($port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $async  = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok     = $async.AsyncWaitHandle.WaitOne(1500, $false)
        $client.Close()
        return $ok
    } catch { return $false }
}

function Wait-ForPort($port, $timeoutSec, $label) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-LocalPort $port) {
            Log "$label up on :$port"
            return $true
        }
        Start-Sleep -Seconds 2
    }
    Log "$label DID NOT come up on :$port within ${timeoutSec}s — continuing"
    return $false
}

function Start-Hidden($exe, $args, $label) {
    if (-not $exe) { Log "$label skipped: exe missing"; return }
    if ($null -eq $args) { $args = @() }
    if ($args -isnot [System.Collections.IEnumerable] -or $args -is [string]) { $args = @($args) }
    $clean = @($args | Where-Object { $_ -ne $null })
    if (-not $clean) { $clean = @('') }
    try {
        Start-Process -FilePath $exe -ArgumentList $clean -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
        Log "$label started"
    } catch {
        Log "$label failed: $_"
    }
}

Log '=========================================='
Log '=== mission stack autostart begin ========'
Log '=========================================='

# 1. Ollama
if (Test-LocalPort 11434) {
    Log '[1/10] Ollama already up on :11434'
} else {
    Log '[1/10] starting Ollama'
    $ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
    if (Test-Path $ollama) {
        Start-Hidden $ollama @('serve') 'Ollama'
        Wait-ForPort 11434 30 'Ollama' | Out-Null
    } else {
        Log '      ollama.exe not found'
    }
}

# 2. OmniRoute LB
if (Test-LocalPort 20128) {
    Log '[2/10] OmniRoute already up on :20128'
} else {
    Log '[2/10] starting OmniRoute'
    $omni = Get-Command omniroute -ErrorAction SilentlyContinue
    if ($omni) {
        Start-Hidden $omni.Source @() 'OmniRoute'
        Wait-ForPort 20128 30 'OmniRoute' | Out-Null
    } else {
        Log '      omniroute not found on PATH'
    }
}

# 3. Paperclip loopback
if (Test-LocalPort 3120) {
    Log '[3/10] Paperclip already up on :3120'
} else {
    Log '[3/10] starting Paperclip loopback'
    $loop = "$Repo\ops\paperclip-runtime\run-paperclip-loopback.ps1"
    if (Test-Path $loop) {
        Start-Hidden 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$loop) 'Paperclip'
        Wait-ForPort 3120 60 'Paperclip' | Out-Null
    } else {
        Log "      loopback script missing: $loop"
    }
}

# 4. Auth proxy
if (Test-LocalPort 3110) {
    Log '[4/10] Auth proxy already up on :3110'
} else {
    Log '[4/10] starting Auth proxy'
    $proxy = "$Repo\ops\paperclip-runtime\run-paperclip-auth-proxy.ps1"
    if (Test-Path $proxy) {
        Start-Hidden 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$proxy) 'AuthProxy'
        Wait-ForPort 3110 30 'AuthProxy' | Out-Null
    } else {
        Log "      proxy script missing: $proxy"
    }
}

# 5. OpenClaw / MCP gateway
if (Test-LocalPort 18789) {
    Log '[5/10] OpenClaw already up on :18789'
} else {
    Log '[5/10] starting OpenClaw gateway'
    $oc = "$env:USERPROFILE\.openclaw\gateway.cmd"
    if (Test-Path $oc) {
        Start-Hidden 'cmd.exe' @('/c',$oc) 'OpenClaw'
        Wait-ForPort 18789 60 'OpenClaw' | Out-Null
    } else {
        Log "      openclaw gateway.cmd missing"
    }
}

# 6. Cloudflare tunnel
if (-not (Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue)) {
    Log '[6/10] starting Cloudflare tunnel'
    $cf = "$Repo\scripts\start-t5500-dateapp-cloudflared.ps1"
    if (Test-Path $cf) {
        Start-Hidden 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$cf) 'Cloudflared'
        Start-Sleep -Seconds 5
    } else {
        Log "      cloudflared script missing: $cf"
    }
} else {
    Log '[6/10] Cloudflare tunnel already running'
}

# 7. Date app frontend :3200
if (Test-LocalPort 3200) {
    Log '[7/10] Frontend already up on :3200'
} else {
    Log '[7/10] starting Frontend'
    $fe = "$Repo\scripts\start-dateapp-frontend-3200.ps1"
    if (Test-Path $fe) {
        Start-Hidden 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$fe,'-RepoRoot',$Repo) 'Frontend'
        Wait-ForPort 3200 60 'Frontend' | Out-Null
    } else {
        Log "      frontend script missing: $fe"
    }
}

# 8. Date app backend :8000
if (Test-LocalPort 8000) {
    Log '[8/10] Backend already up on :8000'
} else {
    Log '[8/10] starting Backend'
    $be = "$Repo\scripts\t5500\Start-YouAndINotAI-Tunnel.ps1"
    if (Test-Path $be) {
        Start-Hidden 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$be,'-RepoRoot',$Repo) 'Backend'
        Wait-ForPort 8000 60 'Backend' | Out-Null
    } else {
        Log "      backend script missing: $be"
    }
}

# 9. Mission Control :8787
if (Test-LocalPort 8787) {
    Log '[9/10] Mission Control already up on :8787'
} else {
    Log '[9/10] starting Mission Control'
    $mc = "$Repo\scripts\start-mission-control.ps1"
    if (Test-Path $mc) {
        Start-Hidden 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$mc,'-RepoRoot',$Repo,'-Port',8787) 'MissionControl'
        Wait-ForPort 8787 30 'MissionControl' | Out-Null
    } else {
        Log "      mission control script missing: $mc"
    }
}

# 10. Red/Green dashboard :5678
if (Test-LocalPort 5678) {
    Log '[10/10] Dashboard already up on :5678'
} else {
    Log '[10/10] starting Dashboard'
    $dash = "$Repo\scripts\start-dashboard.ps1"
    if (Test-Path $dash) {
        Start-Hidden 'powershell.exe' @('-NoProfile','-ExecutionPolicy','Bypass','-File',$dash) 'Dashboard'
        Wait-ForPort 5678 30 'Dashboard' | Out-Null
    } else {
        Log "      dashboard script missing: $dash"
    }
}

Log '=========================================='
Log '=== mission stack autostart complete ====='
Log '=== Mission Control: http://127.0.0.1:8787/'
Log '=== Dashboard:       http://127.0.0.1:5678/'
Log '=== OpenClaw:        http://127.0.0.1:18789/'
Log '=========================================='
