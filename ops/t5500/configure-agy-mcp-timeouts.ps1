<#
.SYNOPSIS
    Audits and configures timeoutSeconds for Antigravity (agy) MCP servers.

.DESCRIPTION
    Print-by-default (dry-run) configuration helper for mcp_config.json.
    Without -Apply, prints proposed timeoutSeconds additions/updates without modifying files or creating backups.
    With -Apply, creates a timestamped .bak-* byte-for-byte backup first, then writes valid JSON
    preserving all existing server fields, env maps, and headers untouched.
    Never opens, reads, or prints .env files, and never writes secret values to stdout.
#>
param(
    [string]$ConfigPath = (Join-Path $env:USERPROFILE '.gemini\config\mcp_config.json'),
    [switch]$Apply,
    [int]$DefaultTimeoutSeconds = 180,
    [int]$LongTimeoutSeconds = 300
)

$ErrorActionPreference = 'Stop'

if ($DefaultTimeoutSeconds -lt 1) {
    throw "DefaultTimeoutSeconds must be >= 1 (got $DefaultTimeoutSeconds)."
}
if ($LongTimeoutSeconds -lt 1) {
    throw "LongTimeoutSeconds must be >= 1 (got $LongTimeoutSeconds)."
}

if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
    throw "MCP config file not found: $ConfigPath"
}

$resolvedConfigPath = (Resolve-Path -LiteralPath $ConfigPath).Path
$rawText = [System.IO.File]::ReadAllText($resolvedConfigPath)

try {
    $configObj = $rawText | ConvertFrom-Json
} catch {
    throw "Failed to parse JSON in '$resolvedConfigPath': $($_.Exception.Message)"
}

$mcpServersProp = $configObj.PSObject.Properties['mcpServers']
if ($null -eq $mcpServersProp -or $null -eq $mcpServersProp.Value -or -not ($mcpServersProp.Value -is [PSCustomObject])) {
    throw "Expected a 'mcpServers' object in '$resolvedConfigPath'."
}

function Get-ServerTimeoutPlan {
    param([string]$ServerName)

    if ($ServerName -match '^omniroute' -or
        $ServerName -match '^(?:rea|remake|supermemory|playwright|supabase|kit|mission[-_]mcp|ai[-_]memory)(?:$|[-_].*)') {
        return [PSCustomObject]@{
            Tier          = 'long-running'
            TargetSeconds = $LongTimeoutSeconds
        }
    }

    return [PSCustomObject]@{
        Tier          = 'default'
        TargetSeconds = $DefaultTimeoutSeconds
    }
}

function Test-ValidIntegerValue {
    param($Value)

    if ($null -eq $Value -or $Value -is [bool] -or $Value -is [string]) {
        return $false
    }
    if ($Value -is [sbyte] -or $Value -is [byte] -or
        $Value -is [int16] -or $Value -is [uint16] -or
        $Value -is [int32] -or $Value -is [uint32] -or
        $Value -is [int64] -or $Value -is [uint64]) {
        return $true
    }
    if ($Value -is [single] -or $Value -is [double] -or $Value -is [decimal]) {
        $d = [double]$Value
        return (-not [double]::IsNaN($d)) -and (-not [double]::IsInfinity($d)) -and ([Math]::Floor($d) -eq $d)
    }
    return $false
}

function Format-JsonString {
    param([string]$Text)

    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append('"')
    foreach ($ch in $Text.ToCharArray()) {
        $code = [int][char]$ch
        switch ($code) {
            34 { [void]$sb.Append('\"') }
            92 { [void]$sb.Append('\\') }
            8  { [void]$sb.Append('\b') }
            12 { [void]$sb.Append('\f') }
            10 { [void]$sb.Append('\n') }
            13 { [void]$sb.Append('\r') }
            9  { [void]$sb.Append('\t') }
            default {
                if ($code -lt 32) {
                    [void]$sb.AppendFormat('\u{0:x4}', $code)
                } else {
                    [void]$sb.Append($ch)
                }
            }
        }
    }
    [void]$sb.Append('"')
    return $sb.ToString()
}

function ConvertTo-FormattedJson {
    param(
        $Value,
        [int]$IndentLevel = 0,
        [string]$NewLine = "`n"
    )

    if ($null -eq $Value) {
        return 'null'
    }
    if ($Value -is [bool]) {
        return $(if ($Value) { 'true' } else { 'false' })
    }
    if ($Value -is [string]) {
        return (Format-JsonString -Text $Value)
    }
    if ($Value -is [sbyte] -or $Value -is [byte] -or
        $Value -is [int16] -or $Value -is [uint16] -or
        $Value -is [int32] -or $Value -is [uint32] -or
        $Value -is [int64] -or $Value -is [uint64] -or
        $Value -is [single] -or $Value -is [double] -or $Value -is [decimal]) {
        return [Convert]::ToString($Value, [System.Globalization.CultureInfo]::InvariantCulture)
    }

    $indent = '  ' * $IndentLevel
    $childIndent = '  ' * ($IndentLevel + 1)

    if ($Value -is [System.Collections.IDictionary]) {
        if ($Value.Count -eq 0) {
            return '{}'
        }
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($key in $Value.Keys) {
            $kJson = Format-JsonString -Text ([string]$key)
            $vJson = ConvertTo-FormattedJson -Value $Value[$key] -IndentLevel ($IndentLevel + 1) -NewLine $NewLine
            $lines.Add("${childIndent}${kJson}: ${vJson}")
        }
        return '{' + $NewLine + ($lines -join (',' + $NewLine)) + $NewLine + $indent + '}'
    }

    if ($Value -is [PSCustomObject]) {
        $props = @($Value.PSObject.Properties | Where-Object { $_.MemberType -in @('NoteProperty', 'Property') })
        if ($props.Count -eq 0) {
            return '{}'
        }
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($p in $props) {
            $kJson = Format-JsonString -Text $p.Name
            $vJson = ConvertTo-FormattedJson -Value $p.Value -IndentLevel ($IndentLevel + 1) -NewLine $NewLine
            $lines.Add("${childIndent}${kJson}: ${vJson}")
        }
        return '{' + $NewLine + ($lines -join (',' + $NewLine)) + $NewLine + $indent + '}'
    }

    if ($Value -is [System.Collections.IEnumerable]) {
        $items = New-Object System.Collections.Generic.List[object]
        foreach ($item in $Value) {
            $items.Add($item)
        }
        if ($items.Count -eq 0) {
            return '[]'
        }
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($item in $items) {
            $itemJson = ConvertTo-FormattedJson -Value $item -IndentLevel ($IndentLevel + 1) -NewLine $NewLine
            $lines.Add("${childIndent}${itemJson}")
        }
        return '[' + $NewLine + ($lines -join (',' + $NewLine)) + $NewLine + $indent + ']'
    }

    return (Format-JsonString -Text ([string]$Value))
}

$modeLabel = if ($Apply) {
    'APPLY (writes updates after creating timestamped .bak-* backup)'
} else {
    'DRY-RUN / Print-only (pass -Apply to write changes)'
}

Write-Output '=================================================================='
Write-Output ' Antigravity (agy) MCP timeoutSeconds Configurator'
Write-Output '=================================================================='
Write-Output ("Mode:           " + $modeLabel)
Write-Output ("ConfigPath:     " + $resolvedConfigPath)
Write-Output ("DefaultTimeout: " + $DefaultTimeoutSeconds + "s")
Write-Output ("LongTimeout:    " + $LongTimeoutSeconds + "s")
Write-Output ''

$addCount = 0
$updateCount = 0
$keepCount = 0

$serverProps = @($mcpServersProp.Value.PSObject.Properties | Where-Object { $_.MemberType -in @('NoteProperty', 'Property') })
foreach ($serverProp in $serverProps) {
    $serverName = $serverProp.Name
    $serverCfg = $serverProp.Value
    if ($null -eq $serverCfg -or -not ($serverCfg -is [PSCustomObject])) {
        throw "Server entry '$serverName' in '$resolvedConfigPath' must be a JSON object."
    }

    $plan = Get-ServerTimeoutPlan -ServerName $serverName
    $targetTimeout = [int]$plan.TargetSeconds
    $tier = $plan.Tier

    $existingProp = $serverCfg.PSObject.Properties['timeoutSeconds']
    if ($null -eq $existingProp) {
        $addCount++
        $serverCfg | Add-Member -NotePropertyName 'timeoutSeconds' -NotePropertyValue $targetTimeout -Force
        Write-Output ("[ADD]    {0}: timeoutSeconds <unset> -> {1}s ({2})" -f $serverName, $targetTimeout, $tier)
    } elseif ((Test-ValidIntegerValue -Value $existingProp.Value) -and ([int64]$existingProp.Value -ge $targetTimeout)) {
        $keepCount++
        Write-Output ("[KEEP]   {0}: timeoutSeconds {1}s (already >= {2}s, {3})" -f $serverName, [int64]$existingProp.Value, $targetTimeout, $tier)
    } else {
        $updateCount++
        $prevDisplay = if ($null -eq $existingProp.Value) { '<null>' } else { "$($existingProp.Value)" }
        $serverCfg | Add-Member -NotePropertyName 'timeoutSeconds' -NotePropertyValue $targetTimeout -Force
        Write-Output ("[UPDATE] {0}: timeoutSeconds {1} -> {2}s ({3})" -f $serverName, $prevDisplay, $targetTimeout, $tier)
    }
}

Write-Output ''
Write-Output ("Summary: {0} to add, {1} to update, {2} already compliant ({3} total)." -f $addCount, $updateCount, $keepCount, $serverProps.Count)

$pendingChanges = $addCount + $updateCount
if (-not $Apply) {
    if ($pendingChanges -gt 0) {
        Write-Output 'Dry-run complete. No files were modified and no backup was created. Re-run with -Apply to write changes.'
    } else {
        Write-Output 'Dry-run complete. All configured MCP servers already meet timeoutSeconds targets.'
    }
    exit 0
}

if ($pendingChanges -eq 0) {
    Write-Output 'Apply skipped: no changes needed; config already satisfies timeoutSeconds targets.'
    exit 0
}

$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$backupPath = "$resolvedConfigPath.bak-$timestamp"
if (Test-Path -LiteralPath $backupPath) {
    $backupPath = "$resolvedConfigPath.bak-$(Get-Date -Format 'yyyyMMddHHmmssfff')"
}
[System.IO.File]::Copy($resolvedConfigPath, $backupPath, $false)

$newline = if ($rawText.Contains("`r`n")) { "`r`n" } else { "`n" }
$formattedJson = (ConvertTo-FormattedJson -Value $configObj -IndentLevel 0 -NewLine $newline) + $newline
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($resolvedConfigPath, $formattedJson, $utf8NoBom)

Write-Output ("Backup:  " + $backupPath)
Write-Output ("Applied: Updated {0} server(s) in {1}" -f $pendingChanges, $resolvedConfigPath)
exit 0
