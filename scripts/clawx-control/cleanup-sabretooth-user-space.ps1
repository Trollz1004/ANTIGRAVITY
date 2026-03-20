[CmdletBinding()]
param()

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

$results = New-Object System.Collections.Generic.List[object]
$startup = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$disabledRoot = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup.disabled\2026-03-07-codex-cleanup"

New-Item -ItemType Directory -Force -Path $disabledRoot | Out-Null

foreach ($name in @("Comet.lnk", "Facebook.lnk", "start-aidoesitall.bat")) {
    $source = Join-Path $startup $name
    if (Test-Path -LiteralPath $source) {
        $destination = Join-Path $disabledRoot $name
        Move-Item -LiteralPath $source -Destination $destination -Force
        $results.Add((Add-Result -Item $name -Action "startup-disable" -Status "OK" -Detail ("moved to {0}" -f $disabledRoot))) | Out-Null
    } else {
        $results.Add((Add-Result -Item $name -Action "startup-disable" -Status "SKIP" -Detail "not present")) | Out-Null
    }
}

$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$chromeAuto = "GoogleChromeAutoLaunch_A3EA2F89B9A5C288CCFB634C9CA0F871"
if (Get-ItemProperty -Path $runKey -Name $chromeAuto -ErrorAction SilentlyContinue) {
    Remove-ItemProperty -Path $runKey -Name $chromeAuto -ErrorAction SilentlyContinue
    $results.Add((Add-Result -Item $chromeAuto -Action "runkey-remove" -Status "OK" -Detail "removed HKCU Run value")) | Out-Null
} else {
    $results.Add((Add-Result -Item $chromeAuto -Action "runkey-remove" -Status "SKIP" -Detail "not present")) | Out-Null
}

try {
    $task = Get-ScheduledTask -TaskName "Clawdbot Gateway" -ErrorAction SilentlyContinue
    if ($null -ne $task) {
        try {
            Disable-ScheduledTask -TaskName "Clawdbot Gateway" -ErrorAction Stop | Out-Null
        } catch {
        }

        $taskState = (Get-ScheduledTask -TaskName "Clawdbot Gateway" -ErrorAction SilentlyContinue).State
        if ($taskState -eq "Disabled") {
            $results.Add((Add-Result -Item "Clawdbot Gateway" -Action "task-disable" -Status "OK" -Detail "disabled")) | Out-Null
        } else {
            $results.Add((Add-Result -Item "Clawdbot Gateway" -Action "task-disable" -Status "FAIL" -Detail ("still {0}; admin required" -f $taskState))) | Out-Null
        }
    } else {
        $results.Add((Add-Result -Item "Clawdbot Gateway" -Action "task-disable" -Status "SKIP" -Detail "not present")) | Out-Null
    }
} catch {
    $results.Add((Add-Result -Item "Clawdbot Gateway" -Action "task-disable" -Status "FAIL" -Detail $_.Exception.Message)) | Out-Null
}

$telegramUninstaller = "C:\Users\joshl\AppData\Roaming\Telegram Desktop\unins000.exe"
if (Test-Path -LiteralPath $telegramUninstaller) {
    $results.Add((Invoke-QuietProcess -FilePath $telegramUninstaller -ArgumentList "/SILENT" -Item "Telegram Desktop" -Action "uninstall")) | Out-Null
} else {
    $results.Add((Add-Result -Item "Telegram Desktop" -Action "uninstall" -Status "SKIP" -Detail "uninstaller missing")) | Out-Null
}

$chromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$edgeExe = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if (Test-Path -LiteralPath $chromeExe) {
    $results.Add((Invoke-QuietProcess -FilePath $chromeExe -ArgumentList '--profile-directory="Profile 1" --uninstall-app-id=hbblfifohofgngfbjbiimbbcimepbdcb' -Item "Create React App Sample" -Action "uninstall")) | Out-Null
    $results.Add((Invoke-QuietProcess -FilePath $chromeExe -ArgumentList '--profile-directory="Profile 1" --uninstall-app-id=kippjfofjhjlffjecoapiogbkgbpmgej' -Item "Facebook (Chrome PWA)" -Action "uninstall")) | Out-Null
    $results.Add((Invoke-QuietProcess -FilePath $chromeExe -ArgumentList '--profile-directory="Profile 1" --uninstall-app-id=cmkncekebbebpfilplodngbpllndjkfo' -Item "Chrome Remote Desktop (Chrome PWA)" -Action "uninstall")) | Out-Null
    $results.Add((Invoke-QuietProcess -FilePath $chromeExe -ArgumentList '--profile-directory="Profile 1" --uninstall-app-id=aghbiahbpaijignceidepookljebhfak' -Item "Google Drive (Chrome PWA)" -Action "uninstall")) | Out-Null
    $results.Add((Invoke-QuietProcess -FilePath $chromeExe -ArgumentList '--profile-directory="Profile 1" --uninstall-app-id=ejjefgjnimbklpdgenehmplpccdknekl' -Item "Azure Portal (Chrome PWA)" -Action "uninstall")) | Out-Null
} else {
    $results.Add((Add-Result -Item "Chrome PWAs" -Action "uninstall" -Status "SKIP" -Detail "chrome.exe missing")) | Out-Null
}

if (Test-Path -LiteralPath $edgeExe) {
    $results.Add((Invoke-QuietProcess -FilePath $edgeExe -ArgumentList '--profile-directory=Default --uninstall-app-id=kippjfofjhjlffjecoapiogbkgbpmgej' -Item "Facebook (Edge PWA)" -Action "uninstall")) | Out-Null
} else {
    $results.Add((Add-Result -Item "Facebook (Edge PWA)" -Action "uninstall" -Status "SKIP" -Detail "msedge.exe missing")) | Out-Null
}

$chromeDefaultPwas = @(
    @{ Item = "Chrome Remote Desktop (Default PWA)"; AppId = "cmkncekebbebpfilplodngbpllndjkfo" },
    @{ Item = "Claude (Chrome PWA)"; AppId = "fmpnliohjhemenmnlpbfagaolkdacoja" }
)

if (Test-Path -LiteralPath $chromeExe) {
    foreach ($pwa in $chromeDefaultPwas) {
        $args = '--profile-directory=Default --uninstall-app-id={0}' -f $pwa.AppId
        $results.Add((Invoke-QuietProcess -FilePath $chromeExe -ArgumentList $args -Item $pwa.Item -Action "uninstall")) | Out-Null
    }
}

$facebookKeys = Get-ChildItem "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall" -ErrorAction SilentlyContinue |
    Where-Object {
        (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).DisplayName -eq "Facebook"
    }

if ($facebookKeys) {
    foreach ($facebookKey in $facebookKeys) {
        Remove-Item -LiteralPath $facebookKey.PSPath -Recurse -Force
    }
    $results.Add((Add-Result -Item "Facebook" -Action "registry-clean" -Status "OK" -Detail "removed stale uninstall entries")) | Out-Null
} else {
    $results.Add((Add-Result -Item "Facebook" -Action "registry-clean" -Status "SKIP" -Detail "no uninstall entries remain")) | Out-Null
}

$staleUserUninstallNames = @(
    "Chrome Remote Desktop",
    "Claude",
    "Google Drive",
    "Microsoft Azure portal (PWA)"
)

foreach ($displayName in $staleUserUninstallNames) {
    $keys = Get-ChildItem "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall" -ErrorAction SilentlyContinue |
        Where-Object {
            (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).DisplayName -eq $displayName
        }

    if ($keys) {
        foreach ($key in $keys) {
            Remove-Item -LiteralPath $key.PSPath -Recurse -Force
        }
        $results.Add((Add-Result -Item $displayName -Action "registry-clean" -Status "OK" -Detail "removed stale uninstall entries")) | Out-Null
    } else {
        $results.Add((Add-Result -Item $displayName -Action "registry-clean" -Status "SKIP" -Detail "no uninstall entries remain")) | Out-Null
    }
}

$postmanUpdate = "C:\Users\joshl\AppData\Local\Postman\Update.exe"
$postmanKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Postman"
if (Test-Path -LiteralPath $postmanUpdate) {
    $results.Add((Invoke-QuietProcess -FilePath $postmanUpdate -ArgumentList "--uninstall -s" -Item "Postman x64" -Action "uninstall")) | Out-Null
} elseif (Test-Path -LiteralPath $postmanKey) {
    Remove-Item -LiteralPath $postmanKey -Recurse -Force
    $results.Add((Add-Result -Item "Postman x64" -Action "registry-clean" -Status "OK" -Detail "removed stale uninstall entry")) | Out-Null
} else {
    $results.Add((Add-Result -Item "Postman x64" -Action "registry-clean" -Status "SKIP" -Detail "not present")) | Out-Null
}

$powerToysUserQuiet = "C:\Users\joshl\AppData\Local\Package Cache\{7A5BDE4E-DE29-4438-ADE9-2EA9A8CAF202}\PowerToysUserSetup-0.97.2-x64.exe"
$powerToysUserKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\{7A5BDE4E-DE29-4438-ADE9-2EA9A8CAF202}"
if (Test-Path -LiteralPath $powerToysUserQuiet) {
    $results.Add((Invoke-QuietProcess -FilePath $powerToysUserQuiet -ArgumentList "/uninstall /quiet" -Item "PowerToys (Preview) x64" -Action "uninstall")) | Out-Null
} elseif (Test-Path -LiteralPath $powerToysUserKey) {
    Remove-Item -LiteralPath $powerToysUserKey -Recurse -Force
    $results.Add((Add-Result -Item "PowerToys (Preview) x64" -Action "registry-clean" -Status "OK" -Detail "removed stale uninstall entry")) | Out-Null
} else {
    $results.Add((Add-Result -Item "PowerToys (Preview) x64" -Action "registry-clean" -Status "SKIP" -Detail "not present")) | Out-Null
}

$gitHubDesktopUpdate = "C:\Users\joshl\AppData\Local\GitHubDesktop\Update.exe"
$gitHubDesktopKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\GitHubDesktop"
if (Test-Path -LiteralPath $gitHubDesktopUpdate) {
    $results.Add((Invoke-QuietProcess -FilePath $gitHubDesktopUpdate -ArgumentList "--uninstall -s" -Item "GitHub Desktop" -Action "uninstall")) | Out-Null
} elseif (Test-Path -LiteralPath $gitHubDesktopKey) {
    Remove-Item -LiteralPath $gitHubDesktopKey -Recurse -Force
    $results.Add((Add-Result -Item "GitHub Desktop" -Action "registry-clean" -Status "OK" -Detail "removed stale uninstall entry")) | Out-Null
} else {
    $results.Add((Add-Result -Item "GitHub Desktop" -Action "registry-clean" -Status "SKIP" -Detail "not present")) | Out-Null
}

$bunKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Bun"
$bunPath = "C:\Users\joshl\.bun"
if (Test-Path -LiteralPath $bunPath) {
    $results.Add((Add-Result -Item "Bun" -Action "cleanup" -Status "SKIP" -Detail ".bun folder still present; left installed")) | Out-Null
} elseif (Test-Path -LiteralPath $bunKey) {
    Remove-Item -LiteralPath $bunKey -Recurse -Force
    $results.Add((Add-Result -Item "Bun" -Action "registry-clean" -Status "OK" -Detail "removed stale uninstall entry")) | Out-Null
} else {
    $results.Add((Add-Result -Item "Bun" -Action "registry-clean" -Status "SKIP" -Detail "not present")) | Out-Null
}

$results | Sort-Object Item, Action | Format-Table -Wrap -Auto
