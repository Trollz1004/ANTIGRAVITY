# ═══════════════════════════════════════════════════════════════════════════════
# OPUS Node Launcher v2.0 — ENIGMA EDITION
# Location: E:\OPUSONLY\scripts\OpusGuiLauncher.ps1
# Author: ENIGMA for Joshua Coleman (Trollz1004)
# Purpose: Complete control panel for SABRETOOTH orchestration
#          Now includes DateApp + Marketing Engine controls
# Safety: READ-ONLY on configs. No secrets. No deletes.
# ═══════════════════════════════════════════════════════════════════════════════

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

# ── CONFIG PATHS ──────────────────────────────────────────────
$opusRoot = "E:\OPUSONLY"
$nodeManifest = "$opusRoot\config\node_manifest.json"
$projectIndex = "$opusRoot\config\project_index.json"
$scriptsDir = "$opusRoot\scripts"
$logsDir = "$opusRoot\logs"

# ── DATA LOADERS ──────────────────────────────────────────────
function Load-NodeManifest {
  if (Test-Path $nodeManifest) {
    $raw = Get-Content $nodeManifest -Raw | ConvertFrom-Json
    return $raw.nodes
  }
  return @()
}

function Load-ProjectIndex {
  if (Test-Path $projectIndex) {
    $raw = Get-Content $projectIndex -Raw | ConvertFrom-Json
    return $raw.projects
  }
  return @()
}

# ── UTILITY FUNCTIONS ─────────────────────────────────────────
function Write-StatusLog {
  param([string]$Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $logFile = Join-Path $logsDir "opus-gui-$(Get-Date -Format 'yyyyMMdd').log"
  Add-Content -Path $logFile -Value "[$timestamp] $Message" -ErrorAction SilentlyContinue
}

function Invoke-SafeScript {
  param([string]$ScriptPath, [string]$Label)
  if (Test-Path $ScriptPath) {
    try {
      Write-StatusLog "Launching: $Label"
      Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`"" -Verb RunAs
      [System.Windows.MessageBox]::Show("Launched: $Label", "OPUS Launcher", "OK", "Information")
    }
    catch {
      [System.Windows.MessageBox]::Show("Error running ${Label}:`n$($_.Exception.Message)", "OPUS Launcher", "OK", "Error")
    }
  }
  else {
    [System.Windows.MessageBox]::Show("Script not found:`n$ScriptPath`n`nCreate it first.", "OPUS Launcher", "OK", "Warning")
  }
}

function Test-ServiceRunning {
  param([string]$ServiceName)
  $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  return ($svc -and $svc.Status -eq "Running")
}

function Test-DockerContainerRunning {
  param([string]$ContainerName)
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) { return $null }
  $status = docker inspect --format='{{.State.Running}}' $ContainerName 2>$null
  return $status -eq "true"
}

function Test-HttpEndpoint {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

# ── SERVICE CONTROL FUNCTIONS ─────────────────────────────────
function Start-DateAppServices {
  $script = Join-Path $scriptsDir "deploy\T5500-Windows\Start-DateAppServices.ps1"
  if (Test-Path $script) {
    Invoke-SafeScript $script "Start DateApp Services"
  }
  else {
    # Fallback: start directly
    Write-StatusLog "Starting DateApp services..."
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
      docker start dateapp-postgres dateapp-redis dateapp-ollama 2>$null
      Start-Sleep -Seconds 3
    }
    Get-Service -Name "DateApp*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -ne "Running" } | Start-Service
    [System.Windows.MessageBox]::Show("DateApp services started.", "OPUS Launcher", "OK", "Information")
  }
}

function Stop-DateAppServices {
  $script = Join-Path $scriptsDir "deploy\T5500-Windows\Stop-DateAppServices.ps1"
  if (Test-Path $script) {
    Invoke-SafeScript $script "Stop DateApp Services"
  }
  else {
    Write-StatusLog "Stopping DateApp services..."
    Get-Service -Name "DateApp*" -ErrorAction SilentlyContinue | Stop-Service -Force -ErrorAction SilentlyContinue
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
      docker stop dateapp-postgres dateapp-redis dateapp-ollama 2>$null
    }
    [System.Windows.MessageBox]::Show("DateApp services stopped.", "OPUS Launcher", "OK", "Information")
  }
}

function Start-MarketingEngine {
  Write-StatusLog "Starting Marketing Engine..."
  $svc = Get-Service -Name "DateAppMarketing" -ErrorAction SilentlyContinue
  if ($svc) {
    Start-Service -Name "DateAppMarketing" -ErrorAction SilentlyContinue
    [System.Windows.MessageBox]::Show("Marketing Engine started.", "OPUS Launcher", "OK", "Information")
  }
  else {
    # Try Docker
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
      docker start dateapp-marketing 2>$null
      if ($LASTEXITCODE -eq 0) {
        [System.Windows.MessageBox]::Show("Marketing Engine container started.", "OPUS Launcher", "OK", "Information")
      }
      else {
        [System.Windows.MessageBox]::Show("Marketing Engine not installed as service or container.`nInstall it first.", "OPUS Launcher", "OK", "Warning")
      }
    }
    else {
      [System.Windows.MessageBox]::Show("Marketing Engine service not found.`nRun Install-DateAppServices.ps1 first.", "OPUS Launcher", "OK", "Warning")
    }
  }
}

function Stop-MarketingEngine {
  Write-StatusLog "Stopping Marketing Engine..."
  $svc = Get-Service -Name "DateAppMarketing" -ErrorAction SilentlyContinue
  if ($svc) {
    Stop-Service -Name "DateAppMarketing" -Force -ErrorAction SilentlyContinue
  }
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if ($docker) {
    docker stop dateapp-marketing 2>$null
  }
  [System.Windows.MessageBox]::Show("Marketing Engine stopped.", "OPUS Launcher", "OK", "Information")
}

function Start-OllamaLocal {
  Write-StatusLog "Starting Ollama..."
  try {
    $ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
    if ($ollamaPath) {
      Start-Process powershell.exe -ArgumentList "-NoProfile -Command ollama serve" -WindowStyle Normal
      [System.Windows.MessageBox]::Show("Ollama serve started in new window.`nWait a few seconds, then click 'Test Ollama'.", "OPUS Launcher", "OK", "Information")
    }
    else {
      [System.Windows.MessageBox]::Show("'ollama' not found in PATH.`nInstall from https://ollama.com or add to PATH.", "OPUS Launcher", "OK", "Warning")
    }
  }
  catch {
    [System.Windows.MessageBox]::Show("Error starting Ollama:`n$($_.Exception.Message)", "OPUS Launcher", "OK", "Error")
  }
}

function Test-OllamaLocal {
  Write-StatusLog "Testing Ollama..."
  Invoke-SafeScript "$scriptsDir\Test-Ollama.ps1" "Test Ollama"
}

function Test-DateAppHealth {
  Write-StatusLog "Testing DateApp Health..."
  Invoke-SafeScript "$scriptsDir\Test-DateApp.ps1" "Test DateApp"
}

function Test-MarketingHealth {
  Write-StatusLog "Testing Marketing Health..."
  Invoke-SafeScript "$scriptsDir\Test-Marketing.ps1" "Test Marketing"
}

# ── GET STATUS SUMMARY ────────────────────────────────────────
function Get-ServiceStatusSummary {
  $status = @()
    
  # DateApp Backend
  $backendUp = Test-HttpEndpoint "http://localhost:3000/health"
  $status += "Backend API: " + $(if ($backendUp) { "✅ RUNNING" } else { "❌ DOWN" })
    
  # AI Services
  $aiUp = Test-HttpEndpoint "http://localhost:3002/health"
  $status += "AI Services: " + $(if ($aiUp) { "✅ RUNNING" } else { "❌ DOWN" })
    
  # Marketing
  $marketingUp = Test-HttpEndpoint "http://localhost:4000/health"
  $status += "Marketing:   " + $(if ($marketingUp) { "✅ RUNNING" } else { "❌ DOWN" })
    
  # Ollama
  $ollamaUp = Test-HttpEndpoint "http://localhost:11434/api/tags"
  $status += "Ollama:      " + $(if ($ollamaUp) { "✅ RUNNING" } else { "❌ DOWN" })
    
  # Docker containers
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if ($docker) {
    $pgUp = Test-DockerContainerRunning "dateapp-postgres"
    $redisUp = Test-DockerContainerRunning "dateapp-redis"
    $status += "PostgreSQL:  " + $(if ($pgUp) { "✅ RUNNING" } elseif ($pgUp -eq $null) { "⚠️ NO DOCKER" } else { "❌ DOWN" })
    $status += "Redis:       " + $(if ($redisUp) { "✅ RUNNING" } elseif ($redisUp -eq $null) { "⚠️ NO DOCKER" } else { "❌ DOWN" })
  }
    
  return $status -join "`n"
}

# ── LOAD DATA ─────────────────────────────────────────────────
$nodes = Load-NodeManifest
$projects = Load-ProjectIndex

# Filter to meaningful projects
$skipNames = @('.vs', 'PerfLogs', 'Intel', 'inetpub', 'IIS', 'IIS Express', 'ClickToRun',
  'dotnet', 'RUXIM', 'Application Verifier', 'Microsoft Identity Extensions',
  '.pnpm-store', '.claude', '.github', 'Unity Hub', 'temp', 'tmp', 'Git', 'WSL')
$realProjects = $projects | Where-Object { $skipNames -notcontains $_.name }

# Group projects by node
$sabProjects = $realProjects | Where-Object { $_.node -eq 'SABRETOOTH' }
$t55Projects = $realProjects | Where-Object { $_.node -eq 'T5500' }
$op9Projects = $realProjects | Where-Object { $_.node -eq 'OPTIPLEX9020' }

# ── XAML LAYOUT ───────────────────────────────────────────────
[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="OPUS Control Center — ENIGMA Edition" Width="800" Height="900"
        Background="#1e1e2e" WindowStartupLocation="CenterScreen">
  <Window.Resources>
    <Style TargetType="Button">
      <Setter Property="Background" Value="#313244"/>
      <Setter Property="Foreground" Value="#cdd6f4"/>
      <Setter Property="FontSize" Value="12"/>
      <Setter Property="Padding" Value="12,8"/>
      <Setter Property="Margin" Value="4,3"/>
      <Setter Property="BorderBrush" Value="#45475a"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="Cursor" Value="Hand"/>
    </Style>
    <Style TargetType="TextBlock">
      <Setter Property="Foreground" Value="#cdd6f4"/>
      <Setter Property="FontSize" Value="12"/>
    </Style>
  </Window.Resources>
  <ScrollViewer VerticalScrollBarVisibility="Auto">
  <StackPanel Margin="16">

    <!-- HEADER -->
    <TextBlock Text="OPUS CONTROL CENTER" FontSize="24" FontWeight="Bold"
               Foreground="#89b4fa" Margin="0,0,0,4"/>
    <TextBlock Text="ENIGMA Edition — Joshua Coleman (Trollz1004)"
               Foreground="#6c7086" FontSize="11" Margin="0,0,0,4"/>
    <TextBlock Text="SABRETOOTH Orchestrator"
               Foreground="#a6e3a1" FontSize="11" Margin="0,0,0,12"/>

    <!-- SERVICE STATUS -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="SERVICE STATUS" FontSize="14" FontWeight="Bold" Foreground="#f38ba8" Margin="0,0,0,6"/>
        <TextBlock x:Name="ServiceStatus" TextWrapping="Wrap" Foreground="#bac2de" FontFamily="Consolas" FontSize="11"/>
        <Button x:Name="BtnRefreshStatus" Content="🔄 Refresh Status" Margin="0,8,0,0" HorizontalAlignment="Left"/>
      </StackPanel>
    </Border>

    <!-- DATEAPP CONTROLS -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="DATEAPP — YouAndINotAI Platform" FontSize="14" FontWeight="Bold" Foreground="#f9e2af" Margin="0,0,0,6"/>
        <TextBlock Text="Start/stop the dating platform backend, frontend, and AI services."
                   Foreground="#6c7086" FontSize="10" Margin="0,0,0,6"/>
        <WrapPanel>
          <Button x:Name="BtnStartDateApp" Content="▶️ Start DateApp" Background="#1e6632"/>
          <Button x:Name="BtnStopDateApp" Content="⏹️ Stop DateApp" Background="#662222"/>
          <Button x:Name="BtnTestDateApp" Content="🩺 Health Check"/>
        </WrapPanel>
      </StackPanel>
    </Border>

    <!-- MARKETING ENGINE -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="MARKETING ENGINE" FontSize="14" FontWeight="Bold" Foreground="#89dceb" Margin="0,0,0,6"/>
        <TextBlock Text="Lead generation, email campaigns, and traffic automation."
                   Foreground="#6c7086" FontSize="10" Margin="0,0,0,6"/>
        <WrapPanel>
          <Button x:Name="BtnStartMarketing" Content="▶️ Start Marketing" Background="#1e6632"/>
          <Button x:Name="BtnStopMarketing" Content="⏹️ Stop Marketing" Background="#662222"/>
          <Button x:Name="BtnTestMarketing" Content="🩺 Health Check"/>
        </WrapPanel>
      </StackPanel>
    </Border>

    <!-- OLLAMA -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="OLLAMA (LOCAL LLM)" FontSize="14" FontWeight="Bold" Foreground="#cba6f7" Margin="0,0,0,6"/>
        <TextBlock Text="Primary AI engine — free, self-hosted. Start here before using any AI features."
                   Foreground="#6c7086" FontSize="10" Margin="0,0,0,6"/>
        <WrapPanel>
          <Button x:Name="BtnStartOllama" Content="▶️ Start Ollama" Background="#1e6632"/>
          <Button x:Name="BtnTestOllama" Content="🧪 Test Ollama"/>
          <Button x:Name="BtnPullModel" Content="📥 Pull llama3.2"/>
        </WrapPanel>
      </StackPanel>
    </Border>

    <!-- NODES SECTION -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="NODES" FontSize="14" FontWeight="Bold" Foreground="#a6e3a1" Margin="0,0,0,6"/>
        <TextBlock x:Name="NodeInfo" TextWrapping="Wrap" Foreground="#bac2de" FontFamily="Consolas" FontSize="11"/>
      </StackPanel>
    </Border>

    <!-- OPEN OPUS FOLDERS -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="OPEN OPUS FOLDERS" FontSize="14" FontWeight="Bold" Foreground="#f9e2af" Margin="0,0,0,6"/>
        <WrapPanel>
          <Button x:Name="BtnOpenE" Content="📂 SABRETOOTH (E:\OPUSONLY)"/>
          <Button x:Name="BtnOpenG" Content="📂 T5500 (G:\OPUSONLY)"/>
          <Button x:Name="BtnOpenH" Content="📂 9020 (H:\OPUSONLY)"/>
          <Button x:Name="BtnOpenLogs" Content="📋 Logs"/>
        </WrapPanel>
      </StackPanel>
    </Border>

    <!-- PROJECTS SECTION -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="PROJECTS" FontSize="14" FontWeight="Bold" Foreground="#89dceb" Margin="0,0,0,6"/>
        <TextBlock x:Name="ProjectInfo" TextWrapping="Wrap" Foreground="#bac2de" FontFamily="Consolas" FontSize="11"/>
      </StackPanel>
    </Border>

    <!-- SETUP SCRIPTS -->
    <Border Background="#181825" CornerRadius="6" Padding="12" Margin="0,0,0,10">
      <StackPanel>
        <TextBlock Text="SETUP SCRIPTS" FontSize="14" FontWeight="Bold" Foreground="#fab387" Margin="0,0,0,6"/>
        <WrapPanel>
          <Button x:Name="BtnSetupDrives" Content="Run Setup-OpusDrives.ps1"/>
          <Button x:Name="BtnSetupProject" Content="Run Setup-ProjectIndex.ps1"/>
          <Button x:Name="BtnSetupMemory" Content="Run Setup-MemoryIndex.ps1"/>
          <Button x:Name="BtnInstallServices" Content="Install DateApp Services"/>
        </WrapPanel>
      </StackPanel>
    </Border>

    <!-- STATUS BAR -->
    <Border Background="#11111b" CornerRadius="4" Padding="8" Margin="0,8,0,0">
      <TextBlock x:Name="StatusBar" Text="Ready." Foreground="#585b70" FontSize="10" FontFamily="Consolas"/>
    </Border>

  </StackPanel>
  </ScrollViewer>
</Window>
"@

# ── CREATE WINDOW FROM XAML ───────────────────────────────────
$reader = New-Object System.Xml.XmlNodeReader $xaml
$window = [System.Windows.Markup.XamlReader]::Load($reader)

# ── GET UI ELEMENTS ───────────────────────────────────────────
$nodeInfoBox = $window.FindName("NodeInfo")
$projectInfoBox = $window.FindName("ProjectInfo")
$statusBar = $window.FindName("StatusBar")
$serviceStatusBox = $window.FindName("ServiceStatus")

# ── POPULATE NODE INFO ────────────────────────────────────────
$nodeText = ""
foreach ($n in $nodes) {
  $driveExists = Test-Path "$($n.opusRoot)"
  $status = if ($driveExists) { "[ONLINE]" } else { "[OFFLINE]" }
  $nodeText += "$status  $($n.name) | Role: $($n.role) | Drive: $($n.driveLetter):\ | OPUS: $($n.opusRoot)`n"
}
if (-not $nodeText) { $nodeText = "No nodes found in node_manifest.json" }
$nodeInfoBox.Text = $nodeText.TrimEnd()

# ── POPULATE PROJECT INFO ─────────────────────────────────────
$projText = ""
$grouped = @{
  "SABRETOOTH (E:)"   = $sabProjects
  "T5500 (G:)"        = $t55Projects
  "OPTIPLEX9020 (H:)" = $op9Projects
}
foreach ($label in @("SABRETOOTH (E:)", "T5500 (G:)", "OPTIPLEX9020 (H:)")) {
  $items = $grouped[$label]
  if ($items) {
    $projText += "--- $label ---`n"
    foreach ($p in $items) {
      $exists = Test-Path $p.fullPath
      $mark = if ($exists) { "+" } else { "?" }
      $projText += "  [$mark] $($p.name) -> $($p.fullPath)`n"
    }
    $projText += "`n"
  }
}
if (-not $projText) { $projText = "No projects found in project_index.json" }
$projectInfoBox.Text = $projText.TrimEnd()

# ── POPULATE SERVICE STATUS ───────────────────────────────────
function Update-ServiceStatus {
  $serviceStatusBox.Text = Get-ServiceStatusSummary
  $statusBar.Text = "Status updated: $(Get-Date -Format 'HH:mm:ss')"
}
Update-ServiceStatus

# ── WIRE UP BUTTONS ───────────────────────────────────────────

# Service status refresh
$window.FindName("BtnRefreshStatus").Add_Click({ Update-ServiceStatus })

# DateApp controls
$window.FindName("BtnStartDateApp").Add_Click({ Start-DateAppServices; Update-ServiceStatus })
$window.FindName("BtnStopDateApp").Add_Click({ Stop-DateAppServices; Update-ServiceStatus })
$window.FindName("BtnTestDateApp").Add_Click({ Test-DateAppHealth })

# Marketing controls
$window.FindName("BtnStartMarketing").Add_Click({ Start-MarketingEngine; Update-ServiceStatus })
$window.FindName("BtnStopMarketing").Add_Click({ Stop-MarketingEngine; Update-ServiceStatus })
$window.FindName("BtnTestMarketing").Add_Click({ Test-MarketingHealth })

# Ollama controls
$window.FindName("BtnStartOllama").Add_Click({ Start-OllamaLocal; Update-ServiceStatus })
$window.FindName("BtnTestOllama").Add_Click({ Test-OllamaLocal })
$window.FindName("BtnPullModel").Add_Click({
    Start-Process powershell.exe -ArgumentList "-NoProfile -Command `"ollama pull llama3.2; Read-Host 'Press Enter to close'`"" -WindowStyle Normal
  })

# Open folder buttons
$window.FindName("BtnOpenE").Add_Click({
    if (Test-Path "E:\OPUSONLY") { Start-Process explorer.exe "E:\OPUSONLY" }
    else { [System.Windows.MessageBox]::Show("E:\OPUSONLY not found", "OPUS Launcher", "OK", "Warning") }
  })
$window.FindName("BtnOpenG").Add_Click({
    if (Test-Path "G:\OPUSONLY") { Start-Process explorer.exe "G:\OPUSONLY" }
    else { [System.Windows.MessageBox]::Show("G:\OPUSONLY not found (T5500 SSD not mounted?)", "OPUS Launcher", "OK", "Warning") }
  })
$window.FindName("BtnOpenH").Add_Click({
    if (Test-Path "H:\OPUSONLY") { Start-Process explorer.exe "H:\OPUSONLY" }
    else { [System.Windows.MessageBox]::Show("H:\OPUSONLY not found (9020 SSD not mounted?)", "OPUS Launcher", "OK", "Warning") }
  })
$window.FindName("BtnOpenLogs").Add_Click({
    if (Test-Path $logsDir) { Start-Process explorer.exe $logsDir }
    else { [System.Windows.MessageBox]::Show("Logs folder not found", "OPUS Launcher", "OK", "Warning") }
  })

# Setup script buttons
$window.FindName("BtnSetupDrives").Add_Click({
    Invoke-SafeScript "$scriptsDir\Setup-OpusDrives.ps1" "Setup-OpusDrives"
  })
$window.FindName("BtnSetupProject").Add_Click({
    Invoke-SafeScript "$scriptsDir\Setup-ProjectIndex.ps1" "Setup-ProjectIndex"
  })
$window.FindName("BtnSetupMemory").Add_Click({
    Invoke-SafeScript "$scriptsDir\Setup-MemoryIndex.ps1" "Setup-MemoryIndex"
  })
$window.FindName("BtnInstallServices").Add_Click({
    Invoke-SafeScript "$scriptsDir\deploy\T5500-Windows\Install-DateAppServices.ps1" "Install DateApp Services"
  })

# ── UPDATE STATUS AND SHOW ────────────────────────────────────
$statusBar.Text = "Loaded: $($nodes.Count) nodes, $($realProjects.Count) projects | $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

Write-StatusLog "GUI Launcher started"

$window.ShowDialog() | Out-Null
