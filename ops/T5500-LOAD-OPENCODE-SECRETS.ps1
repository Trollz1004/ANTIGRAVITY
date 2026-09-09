param(
  [string]$SecretFile = "$env:USERPROFILE\OneDrive\Desktop\opencode.txt",
  [switch]$PersistUserEnv
)

$ErrorActionPreference = 'Stop'

function Get-FirstMapValue {
  param(
    [hashtable]$Map,
    [string[]]$Names
  )

  foreach ($name in $Names) {
    if ($Map.ContainsKey($name) -and $Map[$name]) {
      return $Map[$name]
    }
  }

  return $null
}

if (-not (Test-Path -LiteralPath $SecretFile)) {
  throw "Secret file not found: $SecretFile"
}

$map = @{}
foreach ($line in Get-Content -LiteralPath $SecretFile) {
  if (-not $line -or $line.TrimStart().StartsWith('#')) { continue }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { continue }
  $name = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()
  if ($name -and $value) { $map[$name] = $value }
}

$exports = @{
  SUPABASE_URL = $map['SUPABASE_URL']
  SUPABASE_SECRET_KEY = $map['SUPABASE_SECRET_KEY']
  SUPABASE_PUBLISHABLE_KEY = $map['SUPABASE_PUBLISHABLE_KEY']
  OLLAMA_API_KEY = Get-FirstMapValue -Map $map -Names @('OLLAMA_API_KEY', 'OLLAMA_API')
  OMNIROUTE_API_KEY = Get-FirstMapValue -Map $map -Names @('OMNIROUTE_API_KEY', 'OMNIROUTE_API', 'OMNIRIOUTE_API')
}

foreach ($entry in $exports.GetEnumerator()) {
  if (-not $entry.Value) { continue }
  Set-Item -Path "Env:\$($entry.Key)" -Value $entry.Value
  if ($PersistUserEnv) {
    [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'User')
  }
}

'Loaded opencode secret environment variables without printing values.'
if ($PersistUserEnv) {
  'Persisted values to User environment. Open a new terminal for all processes to inherit them.'
} else {
  'Values are set only in this PowerShell process. Use -PersistUserEnv to save for future terminals.'
}

'Expected variables now available when present in the file:'
foreach ($name in @('OMNIROUTE_API_KEY','OLLAMA_API_KEY','SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_PUBLISHABLE_KEY')) {
  if (Test-Path "Env:\$name") { "$name=<set>" } else { "$name=<missing>" }
}
