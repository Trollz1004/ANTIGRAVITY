@echo off
REM =====================================================================
REM  youandinotai.com  -  BUILD + GO LIVE
REM  RUN THIS ON T5500. Do not run elevated.
REM
REM  HOW THIS SITE ACTUALLY SERVES (verified 2026-07-12):
REM    DNS -> Cloudflare -> cloudflared tunnel 68a2e766...
REM        -> http://127.0.0.1:3200 on T5500  -> serves react-app\dist
REM
REM    It is NOT Cloudflare Pages. wrangler.toml is a leftover.
REM    Rebuilding dist/ IS the deploy. No wrangler needed.
REM
REM  THIS BUILD CHANGES:
REM    - orange + purple removed; single blue (--app-secondary #3b82f6)
REM      gold (#ffd700) kept as the brand accent
REM    - white-on-white fixed (VERIFY / MATCH / PLAN, Better opener)
REM    - "prompt" renamed to "icebreaker" everywhere
REM =====================================================================
setlocal
cd /d C:\ANTIGRAVITY\frontend\react-app || (echo [X] app folder not found & pause & exit /b 1)

echo.
echo === [1/3] TYPE CHECK ===
call npx tsc --noEmit
if errorlevel 1 (
  echo.
  echo [X] TYPE CHECK FAILED - NOT building. Paste the errors to Claude.
  pause
  exit /b 1
)
echo [OK] types clean

echo.
echo === [2/3] BUILD (this replaces the live dist) ===
call npm run build
if errorlevel 1 (
  echo.
  echo [X] BUILD FAILED - live site untouched, still serving the old dist.
  pause
  exit /b 1
)
if not exist dist\index.html (
  echo [X] no dist\index.html produced - live site untouched.
  pause
  exit /b 1
)
echo [OK] build succeeded

echo.
echo === [3/3] VERIFY THE TUNNEL IS SERVING IT ===
curl -s -o nul -w "  localhost:3200 -> HTTP %%{http_code}\n" http://127.0.0.1:3200
echo.
echo   If 3200 does not answer, the static server is down. Restart it, then re-check.
echo   Tunnel service: Cloudflared agent  (should be Running)
sc query Cloudflared | findstr STATE

echo.
echo =====================================================================
echo   DONE. Open https://youandinotai.com and HARD REFRESH (Ctrl+F5).
echo   Expect: blue icons, gold brand accent, readable VERIFY/MATCH/PLAN,
echo           and the word "icebreaker" instead of "prompt".
echo =====================================================================
pause
