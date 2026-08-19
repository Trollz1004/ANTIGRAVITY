# scripts/merge-env.ps1
# Merge a secrets vault .env into server/.env ON DISK. Secret values never
# print in full: only *_API_KEY / *_TOKEN / *_KEY are masked; ports, URLs,
# models and other non-secret values are shown so topology can be verified.
#
# Vault keys overwrite server/.env; keys unique to server/.env (brain and catalog
# configuration) are preserved. Idempotent — safe to re-run after rotating.
#
#   pwsh -File scripts/merge-env.ps1
#   pwsh -File scripts/merge-env.ps1 -Vault <path> -Target <path>
[CmdletBinding()]
param(
  [string]$Vault = '',
  [string]$Target = (Join-Path $PSScriptRoot "..\server\.env")
)
$ErrorActionPreference = 'Stop'

if (-not $Vault) { throw 'Pass -Vault with the approved local vault path; no profile-specific default is configured.' }
if (-not (Test-Path $Vault))  { throw "vault not found: $Vault" }
if (-not (Test-Path $Target)) { throw "target .env not found: $Target" }
$Target = (Resolve-Path $Target).Path

# Parse KEY=VALUE lines (skip comments/blank). Value = everything after first '='.
function Parse-Env($path) {
  $h = [ordered]@{}
  foreach ($line in Get-Content -LiteralPath $path) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*$') { continue }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $h[$matches[1]] = $matches[2]
    }
  }
  return $h
}

$vaultKeys  = Parse-Env $Vault
$targetKeys = Parse-Env $Target

$out  = [System.Collections.Generic.List[string]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new()

# Walk target lines; replace values for keys the vault also defines.
foreach ($line in Get-Content -LiteralPath $Target) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $k = $matches[1]
    if ($vaultKeys.Contains($k)) {
      $out.Add("$k=$($vaultKeys[$k])")
      [void]$seen.Add($k)
    } else {
      $out.Add($line)
    }
  } else {
    $out.Add($line)
  }
}
# Append vault keys not already present in target.
foreach ($k in $vaultKeys.Keys) {
  if (-not $seen.Contains($k)) { $out.Add("$k=$($vaultKeys[$k])") }
}

# Atomic write (UTF-8 no BOM, CRLF).
$tmp = "$Target.tmp"
[System.IO.File]::WriteAllLines($tmp, $out, (New-Object System.Text.UTF8Encoding $false))
Move-Item -LiteralPath $tmp -Destination $Target -Force

function Format-Val($k, $v) {
  if ($null -eq $v -or $v -eq '') { return '(blank)' }
  if ($k -match 'API_KEY$|TOKEN$|_KEY$') {
    if ($v.Length -le 8) { return ('*' * $v.Length) }
    return ($v.Substring(0, 4) + '...' + $v.Substring($v.Length - 4))
  }
  return $v
}

$preserved = ($targetKeys.Keys | Where-Object { -not $vaultKeys.Contains($_) }) -join ', '
Write-Host "merged $($vaultKeys.Count) keys from vault -> $Target"
Write-Host "preserved target-only keys: $preserved"
foreach ($k in $vaultKeys.Keys) {
  Write-Host ("  {0,-28} = {1}" -f $k, (Format-Val $k $vaultKeys[$k]))
}
