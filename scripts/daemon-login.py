"""
Daemon Login — Opens Chrome with daemon profile for Josh to log in.
Run this, log into each platform tab, sessions save automatically.
Then start the daemon with daemon-start.py.

Usage:
  python scripts/daemon-login.py              # Open all login tabs
  python scripts/daemon-login.py --quick       # Just Twitter + Reddit (5 min)
"""
import os
import sys
import time
from pathlib import Path

# Load .env
ROOT = Path(__file__).parent.parent
env_file = ROOT / ".env"
if env_file.exists():
    with open(env_file, encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

PROFILE = ROOT / "data" / "browser-sessions" / "daemon-profile"
PROFILE.mkdir(parents=True, exist_ok=True)
CHROME = Path("C:/Program Files/Google/Chrome/Application/chrome.exe")

# Clear stale lock files FIRST
cleared = False
for lock in ["SingletonLock", "SingletonCookie", "SingletonSocket"]:
    lf = PROFILE / lock
    if lf.exists():
        try:
            lf.unlink()
            cleared = True
            print(f"  Cleared stale lock: {lock}")
        except Exception as e:
            print(f"  WARNING: Could not clear {lock}: {e}")

# Kill any stale daemon python processes using this profile
try:
    import subprocess
    result = subprocess.run(
        ["tasklist", "/FI", "IMAGENAME eq python.exe", "/FO", "CSV"],
        capture_output=True, text=True, timeout=10
    )
    # Don't auto-kill — just warn
    py_count = result.stdout.count("python.exe")
    if py_count > 1:
        print(f"  NOTE: {py_count} Python processes running. If login fails, stop the daemon first.")
except Exception:
    pass

URLS = [
    ("Twitter/X", "https://x.com/login"),
    ("Reddit", "https://www.reddit.com/login"),
    ("Instagram", "https://www.instagram.com/accounts/login/"),
    ("Facebook", "https://www.facebook.com/login"),
    ("LinkedIn", "https://www.linkedin.com/login"),
    ("Pinterest", "https://www.pinterest.com/login/"),
    ("Threads", "https://www.threads.net/login"),
]

QUICK_URLS = [
    ("Twitter/X", "https://x.com/login"),
    ("Reddit", "https://www.reddit.com/login"),
]

# Parse args
quick_mode = "--quick" in sys.argv
urls = QUICK_URLS if quick_mode else URLS
wait_time = 300 if quick_mode else 600

print("=" * 55)
print("  DAEMON LOGIN — Log in to each platform tab")
print(f"  Browser stays open {wait_time // 60} minutes")
print("  Sessions save to daemon profile automatically")
if cleared:
    print("  (Cleared stale browser locks)")
print("=" * 55)

# Launch browser
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("\nERROR: Playwright not installed.")
    print("Run: pip install playwright && playwright install chromium")
    sys.exit(1)

pw = None
ctx = None

try:
    pw = sync_playwright().start()
except Exception as e:
    print(f"\nERROR: Could not start Playwright: {e}")
    print("Try: playwright install chromium")
    sys.exit(1)

kwargs = {
    "user_data_dir": str(PROFILE),
    "headless": False,
    "args": [
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-infobars",
    ],
    "viewport": {"width": 1280, "height": 900},
    "ignore_default_args": ["--enable-automation"],
}

if CHROME.exists():
    kwargs["executable_path"] = str(CHROME)
    print(f"Using real Chrome: {CHROME}")
else:
    print("Using Playwright Chromium (real Chrome not found)")

try:
    ctx = pw.chromium.launch_persistent_context(**kwargs)
    print("Browser launched successfully!")
except Exception as e:
    print(f"\nERROR: Could not launch browser: {e}")
    if "already in use" in str(e).lower() or "lock" in str(e).lower():
        print("\nThe daemon profile is locked by another process.")
        print("1. Stop the daemon: taskkill /IM python.exe /F")
        print("2. Clear locks manually:")
        for lock in ["SingletonLock", "SingletonCookie", "SingletonSocket"]:
            print(f"   del \"{PROFILE / lock}\"")
        print("3. Try again: python scripts/daemon-login.py")
    elif "chromium" in str(e).lower() or "browser" in str(e).lower():
        print("\nPlaywright browser not installed.")
        print("Run: playwright install chromium")
    try:
        pw.stop()
    except Exception:
        pass
    sys.exit(1)

# Wait for Chrome auto-sign-in (SSO flow)
print("\nWaiting 90s for Chrome auto-sign-in...")
try:
    page = ctx.new_page()
    page.goto("https://x.com/home", wait_until="domcontentloaded")
    for i in range(18):
        time.sleep(5)
        try:
            if "home" in page.url and "log in" not in page.title().lower():
                print(f"  Auto-sign-in detected after {(i+1)*5}s!")
                break
        except Exception:
            pass
    else:
        print("  Auto-sign-in did not complete — you may need to log in manually")
    try:
        page.close()
    except Exception:
        pass
except Exception as e:
    print(f"  Auto-sign-in check failed: {e}")

# Open login tabs
print(f"\nOpening {len(urls)} platform tabs:")
opened = 0
for name, url in urls:
    try:
        p = ctx.new_page()
        p.goto(url, wait_until="domcontentloaded")
        print(f"  {name}: opened")
        opened += 1
    except Exception as e:
        print(f"  {name}: FAILED - {e}")

if opened == 0:
    print("\nERROR: Could not open any tabs. Browser may be broken.")
    print("Try closing all Chrome windows and running again.")
else:
    print(f"\n{'=' * 55}")
    print(f"  LOG IN TO EACH TAB NOW ({opened} tabs open)")
    print(f"  You have {wait_time // 60} minutes")
    print(f"  Sessions save automatically when you log in")
    print(f"{'=' * 55}")

    # Wait with countdown
    try:
        for remaining in range(wait_time, 0, -60):
            mins = remaining // 60
            if mins % 2 == 0:
                print(f"  {mins} minutes remaining...")
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n  Stopping early (Ctrl+C)")

print("\nSessions saved. Closing browser...")
try:
    ctx.close()
except Exception:
    pass
try:
    pw.stop()
except Exception:
    pass
print("Done! Now run: python scripts/daemon-start.py")
