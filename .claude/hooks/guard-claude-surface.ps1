# guard-claude-surface.ps1 - PreToolUse guard for Bash/PowerShell.
#
# Only official, signed-in Claude (claude.ai, the Antigravity/VS Code extension,
# the official CLI on OAuth) may commit or push as Claude in this repo
# (Joshua, 2026-10-22). A wrapper that drives the real claude CLI against
# another backend has to set ANTHROPIC_BASE_URL or an Anthropic key to work,
# and an official session never has either. So: if any of them is set, no
# git commit and no git push from this session.

$raw = [Console]::In.ReadToEnd()
try { $cmd = ($raw | ConvertFrom-Json).tool_input.command } catch { exit 0 }
if (-not $cmd) { exit 0 }
if ($cmd -notmatch '\bgit\b[^|;&]*\b(commit|push)\b') { exit 0 }

$found = @('ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN') |
  Where-Object { [Environment]::GetEnvironmentVariable($_) }
if (-not $found) { exit 0 }

[Console]::Error.WriteLine("Blocked: this session has $($found -join ', ') set, so it is not official signed-in Claude. Only claude.ai, the Antigravity extension or the official CLI on OAuth may commit or push as Claude here.")
exit 2
