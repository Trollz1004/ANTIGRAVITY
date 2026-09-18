param(
    [ValidateSet("marketing-pack", "reply-draft")]
    [string]$Mode = "marketing-pack",
    [ValidateSet("general", "dropoff", "pickup")]
    [string]$Kind = "general",
    [string]$Source,
    [string]$Model
)

$scriptPath = Join-Path $PSScriptRoot "onlinerecycle-local-worker.js"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw "Node.js was not found in PATH."
}

$command = @("node")

$command += @($scriptPath, $Mode)
if ($Model) {
    $command += @("--model", $Model)
}
if ($Mode -eq "reply-draft") {
    if (-not $Source) {
        throw "reply-draft requires -Source pointing to a text or markdown file."
    }
    $command += @("--kind", $Kind, "--source", $Source)
}

& $command[0] $command[1..($command.Length - 1)]
