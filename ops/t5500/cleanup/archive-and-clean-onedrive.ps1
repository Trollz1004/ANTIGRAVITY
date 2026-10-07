# OneDrive & Desktop Sync Cleanup Script (T5500 Node)
# Archives and safely removes sync debris from OneDrive root and OneDrive Desktop.

$ErrorActionPreference = 'Continue'
$BackupDir = 'C:\ARCHIVE_BACKUPS'
$ZipFile = Join-Path $BackupDir 'onedrive_cleanup_2026-10-06.zip'
$LogFile = Join-Path $BackupDir 'cleanup.log'
$OneDriveRoot = 'C:\Users\joshi\OneDrive'
$DesktopDir = Join-Path $OneDriveRoot 'Desktop'

function Write-Log($msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

# 1. Desktop ComfyUI empty folders and debris
$emptyModelDirs = @(
    'audio_encoders', 'background_removal', 'checkpoints', 'clip', 'clip_vision',
    'configs', 'controlnet', 'detection', 'diffusers', 'diffusion_models',
    'embeddings', 'forbidden_vision', 'frame_interpolation', 'geometry_estimation',
    'gguf', 'gligen', 'hypernetworks', 'latent_upscale_models', 'LLM', 'loras',
    'model_patches', 'optical_flow', 'photomaker', 'prompt', 'prompt_generator',
    'Qwen3-ASR', 'style_models', 'text_encoders', 'Translate', 'unet',
    'upscale_models', 'vae', 'vae_approx', 'VLM', 'wildcards', 'workflow-config'
)

$desktopDebrisFiles = @(
    '.env',
    'ChatGPT Installer.exe',
    'chromeremotedesktophost.msi',
    'ChromeSetup.exe',
    'dating-app-social-marketing (1).zip',
    'dating-app-social-marketing.zip',
    'DREAM-GEMINI-PROMPTS-2026-09-30.html',
    'html-video-production (1).zip',
    'html-video-production (2).zip',
    'html-video-production (3).zip',
    'html-video-production (4).zip',
    'html-video-production.zip',
    'Microsoft.Services.Store.winmd',
    'MISSION-CONTROL-GOVERNANCE.md',
    'mission-control-judge-provenance.zip',
    'OPENCLAW-BOOTSTRAP-PROMPT.md',
    'similarweb-analytics.zip',
    'ULTRACODE-OPUS-MISSION-CONTROL-PROMPT.md'
)

# 2. OneDrive Root debris files & empty model folders
$oneDriveRootDebris = @(
    'AIRI-0.11.3-windows-x64-setup.exe',
    'Raycast Installer.exe',
    '_empty-model-folders-2026-09-30',
    'DREAM-ONLINE-PRIVATE-ARCHIVE-2026-09-19.zip',
    'MASTER-ENV.env',
    'MASTER-ENV.example',
    'xai-mfa-recovery-codes.txt',
    'gemini 2.5 pro google opencode install after windows clean state.ps1',
    'install-helper-node-after-windows-clean.ps1',
    'CONFLICTS-REPORT.md',
    'ONEDRIVE-INDEX.md',
    '_HOUSE-INDEX-2026-09-30.md',
    'workflow_api.json',
    'Microsoft.Services.Store.winmd',
    '.make-gamedev-junctions.ps1',
    '.master-env-merge.sh'
)

$allTargets = @()

foreach ($dirName in $emptyModelDirs) {
    $p = Join-Path $DesktopDir $dirName
    if (Test-Path $p) { $allTargets += $p }
}

foreach ($fileName in $desktopDebrisFiles) {
    $p = Join-Path $DesktopDir $fileName
    if (Test-Path $p) { $allTargets += $p }
}

foreach ($name in $oneDriveRootDebris) {
    $p = Join-Path $OneDriveRoot $name
    if (Test-Path $p) { $allTargets += $p }
}

Write-Log ("Found {0} OneDrive/Desktop debris targets to archive." -f $allTargets.Count)

$manifest = Join-Path $BackupDir 'onedrive_manifest.txt'
$allTargets | Out-File -FilePath $manifest -Encoding utf8

Write-Log "Archiving OneDrive debris to: $ZipFile"
$tarArgs = @('-a', '-c', '-f', $ZipFile, '-T', $manifest)
& tar.exe @tarArgs

if (-not (Test-Path $ZipFile) -or (Get-Item $ZipFile).Length -eq 0) {
    Write-Log "ERROR: OneDrive archive creation failed. Aborting deletion."
    exit 1
}

$zipSizeMB = [math]::Round((Get-Item $ZipFile).Length / 1MB, 2)
Write-Log "OneDrive archive verified successfully: $ZipFile ($zipSizeMB MB)"

# Safely remove the debris targets
foreach ($p in $allTargets) {
    try {
        Remove-Item -Path $p -Recurse -Force -ErrorAction Stop
        Write-Log "Removed: $p"
    } catch {
        Write-Log "WARNING: Could not remove $($p): $_"
    }
}

Write-Log "OneDrive & Desktop sync cleanup completed successfully."
