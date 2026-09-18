#!/bin/bash

# ==============================================================================
# Script Name:    install_script_forge.sh
# Description:   Safely installs/integrates Script Forge libraries into
#                Mission Control Dashboard directories.
# Author:        Senior Systems Administrator
# Version:       1.0.0
# Platform:      Linux (apt-based) — not exercised on this Alienware/Windows node.
# ==============================================================================

# --- Configuration ---
SF_VERSION="7.x"
DASHBOARD_PATH="/opt/mission-control/plugins"
LOG_FILE="/var/log/script_forge_install.log"
DRY_RUN=false # Set to true to simulate without making changes

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Help Menu ---
usage() {
    echo "Usage: $0 [--dry-run] [--path <custom_path>]"
    echo "  --dry-run          Simulate the installation process"
    echo "  --path             Specify a custom Mission Control path"
    exit 1
}

# --- Parse Arguments ---
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true ;;
        --path) DASHBOARD_PATH="$2"; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown parameter passed: $1"; usage ;;
    esac
    shift
done

# --- Logging Function ---
log_message() {
    local TYPE=$1
    local MSG=$2
    echo -e "${TYPE}: ${MSG}" | tee -a "$LOG_FILE"
}

# --- Initialization & Safety Checks ---
log_message "${YELLOW}[INFO]${NC}" "Starting Script Forge integration for Mission Control..."

if [[ $EUID -ne 0 ]] && [ "$DRY_RUN" = false ]; then
   log_message "${RED}[ERROR]${NC}" "This script must be run as root/sudo."
   exit 1
fi

# Check if Mission Control exists
if [ ! -d "$DASHBOARD_PATH" ] && [ "$DRY_RUN" = false ]; then
    log_message "${RED}[ERROR]${NC}" "Mission Control Dashboard directory not found at $DASHBOARD_PATH"
    exit 1
fi

# --- Execution Logic ---

run_cmd() {
    local CMD=$1
    local MSG=$2
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} Would execute: $CMD"
    else
        log_message "${GREEN}[EXEC]${NC}" "$MSG"
        eval "$CMD"
        if [ $? -ne 0 ]; then
            log_message "${RED}[ERROR]${NC}" "Command failed. Check $LOG_FILE for details."
            exit 1
        fi
    fi
}

# 1. Update Package Repository (Ensuring Python/LibreOffice headers are present)
run_cmd "apt-get update -qq" "Updating package repositories"

# 2. Install Script Forge core components
# Note: Adjust package name based on your specific Linux Distro
run_cmd "apt-get install -y libreoffice-scriptforge" "Installing Script Forge system libraries"

# 3. Create Plugin Directory for Mission Control
TARGET_DIR="${DASHBOARD_PATH}/script_forge_v${SF_VERSION}"
run_cmd "mkdir -p $TARGET_DIR" "Creating integration directory at $TARGET_DIR"

# 4. Symlink Script Forge to Mission Control Dashboard
# This allows the dashboard to 'see' the forge scripts
run_cmd "ln -sf /usr/lib/libreoffice/program/scriptforge.py $TARGET_DIR/scriptforge.py" "Linking library to Dashboard"

# 5. Set Permissions
run_cmd "chown -R 755 $TARGET_DIR" "Finalizing directory permissions"

# --- Verification ---
if [ "$DRY_RUN" = false ]; then
    if [[ -f "$TARGET_DIR/scriptforge.py" ]]; then
        log_message "${GREEN}[SUCCESS]${NC}" "Script Forge is now integrated into Mission Control."
    else
        log_message "${RED}[FAILURE]${NC}" "Installation completed but verification failed."
        exit 1
    fi
else
    log_message "${YELLOW}[INFO]${NC}" "Dry-run complete. No changes were made."
fi
