<#
.SYNOPSIS
  Asks Square's SANDBOX whether the saved sandbox token works. Prints one plain line.

.DESCRIPTION
  Loads the sandbox env file in memory only, calls Square's sandbox host for the list of locations
  with the token, and prints exactly one of:
    accepted by the sandbox
    refused by the sandbox
    no token saved yet
  If accepted and the saved location is not in the list, it prints instead:
    location not found in this sandbox account
  It never prints the token, the response body or any id.

  It refuses to call any Square host other than https://connect.squareupsandbox.com (the address in
  the env file is checked first, and the call itself refuses any other address).

  Exit codes: 0 accepted (and location found or none saved). 1 refused by the sandbox. 2 not the
  sandbox host (nothing sent). 3 no token saved yet. 4 could not reach the sandbox. 5 accepted, but
  the saved location is not in this sandbox account.

.PARAMETER EnvFile
  Override the env file path (used by the test only). Default:
  %USERPROFILE%\antigravity\selfhost\dateapp-sandbox\env.sandbox
#>
[CmdletBinding()]
param(
    [string]$EnvFile = ''
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'sandbox-common.ps1')
if (-not $EnvFile) { $EnvFile = Get-SandboxEnvFile }

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Output 'no token saved yet'
    exit 3
}

$values = Read-SandboxEnv -Path $EnvFile

# Refusal: the env file must name Square's sandbox host. The call below only ever uses the constant.
if (-not (Test-SandboxSquareHost $values)) {
    Write-Output "REFUSED: SQUARE_API_BASE_URL is not Square's sandbox host. Nothing was sent."
    exit 2
}

$token = Get-Setting $values 'SQUARE_ACCESS_TOKEN'
if (-not $token) {
    Write-Output 'no token saved yet'
    exit 3
}
$location = Get-Setting $values 'SQUARE_LOCATION_ID'
$version = Get-Setting $values 'SQUARE_API_VERSION'

try {
    $result = Invoke-SandboxSquareGet -Uri ($script:SandboxSquareHost + '/v2/locations') -Token $token -ApiVersion $version
}
catch {
    Write-Output "REFUSED: not Square's sandbox host. Nothing was sent."
    exit 2
}
finally {
    $token = $null
}

if ($result.Status -eq 401 -or $result.Status -eq 403) {
    Write-Output 'refused by the sandbox'
    exit 1
}
if ($result.Status -ne 200) {
    Write-Output 'could not get an answer from the sandbox; try again in a minute'
    exit 4
}

if ($location) {
    $found = $false
    try {
        $parsed = $result.Body | ConvertFrom-Json
        if ($parsed.PSObject.Properties.Name -contains 'locations') {
            foreach ($loc in @($parsed.locations)) {
                if ($loc.PSObject.Properties.Name -contains 'id' -and [string]$loc.id -ceq $location) { $found = $true; break }
            }
        }
    }
    catch { $found = $false }
    if (-not $found) {
        Write-Output 'accepted by the sandbox'
        Write-Output 'location not found in this sandbox account'
        exit 5
    }
}
Write-Output 'accepted by the sandbox'
exit 0
