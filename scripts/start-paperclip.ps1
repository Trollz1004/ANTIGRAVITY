# Compatibility launcher.
#
# Existing watchdogs still call start-paperclip.ps1. This repo no longer starts
# the third-party paperclipai runtime from this path; it starts the first-party
# ANTIGRAVITY Mission Control board instead.

$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'start-mission-control.ps1'
& $script
