# T5500 Load Balancer Watchdog
# Monitors cloud model availability and falls back to local GPU when needed.
# Primary strategy: cloud-first (OpenCode Zen, OpenRouter free, Ollama Cloud)
# to minimize load on T5500 GTX 1050 Ti.

$config = Get-Content "$PSScriptRoot\t5500-lb-config.json" | ConvertFrom-Json
$logFile = "C:\ANTIGRAVITY\logs\t5500-lb-watchdog.log"
$lastStatus = @{}

function Test-CloudProvider {
    param($name, $endpoint)
    try {
        $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 10 -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Test-LocalService {
    param($port)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $statusLine = "[$timestamp]"

    # Check cloud providers
    $zenOk = Test-CloudProvider "opencode_zen" "https://api.opencode.ai/v1/models"
    $orOk = Test-CloudProvider "openrouter" "https://openrouter.ai/api/v1/models"
    $ocOk = Test-CloudProvider "ollama_cloud" "https://ollama.com/v1/models"

    $statusLine += " ZEN:$zenOk OR:$orOk OC:$ocOk"

    # Check local services
    $ollamaOk = Test-LocalService 11434
    $hermesOk = Test-LocalService 11435
    $paperclipOk = Test-LocalService 3101

    $statusLine += " OLLAMA:$ollamaOk HERMES:$hermesOk PC:$paperclipOk"

    # Routing decision
    if ($zenOk -or $orOk -or $ocOk) {
        $route = "cloud"
        $statusLine += " ROUTE:cloud"
    } elseif ($ollamaOk) {
        $route = "local"
        $statusLine += " ROUTE:local-fallback"
    } else {
        $route = "degraded"
        $statusLine += " ROUTE:DEGRADED"
    }

    $statusLine | Out-File -FilePath $logFile -Append
    Start-Sleep -Seconds 30
}
