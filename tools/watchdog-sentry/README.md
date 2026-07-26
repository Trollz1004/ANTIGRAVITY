# Watchdog Sentry Display

Open `index.html` on MINI-ASUS-PC. It polls Sabretooth at:

```text
http://192.168.0.8:11436/health/all
```

Suggested kiosk command:

```powershell
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--kiosk file:///E:/ANTIGRAVITY/tools/watchdog-sentry/index.html"
```

This display is local-only and must not be referenced from `_deploy/`.
