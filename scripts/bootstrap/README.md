# ANTIGRAVITY dual-node bootstrap
#
# LAPTOP (control plane):
#   scripts\bootstrap\bootstrap-laptop.bat
#   scripts\bootstrap\Bootstrap-LaptopControlPlane.ps1
#   Register: powershell -File scripts\bootstrap\Register-BootstrapTasks.ps1 -Target Laptop
#   Task: ANTIGRAVITY-Laptop-ControlPlane-Bootstrap (SYSTEM, AtStartup + heal)
#
#   Starts/heals:
#     - Ollama :11434
#     - Hermes dashboard :9119
#     - Paperclip MARKETING :3101  (NOT T5500 date-app Paperclip)
#     - OpenClaw support :18895 (if present)
#     - OmniRoute :20128 (if installed on laptop — never on T5500)
#     - Docker Desktop best-effort
#
# T5500 (date-app / execution node):
#   scripts\bootstrap\bootstrap-t5500.bat
#   scripts\bootstrap\Bootstrap-T5500DateApp.ps1
#   Register: powershell -File scripts\bootstrap\Register-BootstrapTasks.ps1 -Target T5500
#   Task: ANTIGRAVITY-T5500-FullStack-Bootstrap (SYSTEM, AtStartup + heal)
#
#   Starts/heals via existing tasks + direct repair:
#     - YouAndINotAI API :8000
#     - Static/frontend :3200
#     - PaperclipDateAppLoopback :3100
#     - PaperclipPrivateAuthProxy :3110
#     - Postgres :5432 / Redis :6379 (Docker)
#     - cloudflared tunnel tasks
#     - Public URL checks (youandinotai.com, affiliate, dao, api, paperclip)
#   Explicitly does NOT start OmniRoute ports 20128+
#
# Behavior:
#   - Error checking + health checks + self-heal loops
#   - Interactive .bat does NOT auto-close on failure (pause)
#   - ServiceMode for scheduled tasks (no pause, continuous heal)
#   - Logs under logs/bootstrap-laptop and logs/bootstrap-t5500
#
# Doctrine:
#   - Two Paperclips stay separate (laptop marketing vs T5500 date-app)
#   - OmniRoute = laptop only
#   - No secrets in task arguments
