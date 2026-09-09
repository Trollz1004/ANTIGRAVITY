[CmdletBinding()]
param(
    [switch]$KeepOBS
)

$ErrorActionPreference = "Continue"

function Add-Result {
    param(
        [Parameter(Mandatory = $true)][string]$Item,
        [Parameter(Mandatory = $true)][string]$Action,
        [Parameter(Mandatory = $true)][string]$Status,
        [Parameter(Mandatory = $true)][string]$Detail
    )

    [PSCustomObject]@{
        Item   = $Item
        Action = $Action
        Status = $Status
        Detail = $Detail
    }
}

function Invoke-QuietProcess {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$ArgumentList,
        [Parameter(Mandatory = $true)][string]$Item,
        [Parameter(Mandatory = $true)][string]$Action
    )

    try {
        $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -Wait -PassThru -WindowStyle Hidden
        return Add-Result -Item $Item -Action $Action -Status "OK" -Detail ("exit={0}" -f $process.ExitCode)
    } catch {
        return Add-Result -Item $Item -Action $Action -Status "FAIL" -Detail $_.Exception.Message
    }
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).
    IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    throw "Run this script from an elevated PowerShell session."
}

$results = New-Object System.Collections.Generic.List[object]

try {
    $task = Get-ScheduledTask -TaskName "Clawdbot Gateway" -ErrorAction SilentlyContinue
    if ($null -ne $task) {
        Disable-ScheduledTask -TaskName "Clawdbot Gateway" -ErrorAction Stop | Out-Null
        $results.Add((Add-Result -Item "Clawdbot Gateway" -Action "task-disable" -Status "OK" -Detail "disabled")) | Out-Null
    } else {
        $results.Add((Add-Result -Item "Clawdbot Gateway" -Action "task-disable" -Status "SKIP" -Detail "not present")) | Out-Null
    }
} catch {
    $results.Add((Add-Result -Item "Clawdbot Gateway" -Action "task-disable" -Status "FAIL" -Detail $_.Exception.Message)) | Out-Null
}

$machineUninstalls = @(
    @{
        Item = "AWS Command Line Interface v2"
        File = "msiexec.exe"
        Args = "/x {D79BC79F-91B7-4EEE-A90E-626F0E2AAB56} /qn /norestart"
    },
    @{
        Item = "Google Cloud SDK"
        File = "C:\Program Files (x86)\Google\Cloud SDK\uninstaller.exe"
        Args = "/S"
    },
    @{
        Item = "Microsoft Azure CLI (64-bit)"
        File = "msiexec.exe"
        Args = "/x {19007AFE-AF2E-4320-9269-E4ED92B73B20} /qn /norestart"
    },
    @{
        Item = "PowerToys (Preview)"
        File = "msiexec.exe"
        Args = "/x {4F468D0D-C586-4689-AE5D-AE5790DC2281} /qn /norestart"
    }
)

if (-not $KeepOBS) {
    $machineUninstalls += @{
        Item = "OBS Studio"
        File = "C:\Program Files\obs-studio\uninstall.exe"
        Args = "/S"
    }
}

foreach ($entry in $machineUninstalls) {
    if (($entry.File -eq "msiexec.exe") -or (Test-Path -LiteralPath $entry.File -ErrorAction SilentlyContinue -PathType Leaf)) {
        $results.Add((Invoke-QuietProcess -FilePath $entry.File -ArgumentList $entry.Args -Item $entry.Item -Action "uninstall")) | Out-Null
    } else {
        $results.Add((Add-Result -Item $entry.Item -Action "uninstall" -Status "SKIP" -Detail "installer/uninstaller not found")) | Out-Null
    }
}

$results | Sort-Object Item, Action | Format-Table -Wrap -Auto
