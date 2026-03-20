"""
Browser Manager — Persistent Playwright sessions with real Chrome.
Josh logs in ONCE per platform via --login, sessions persist forever.
No cookie copying (Chrome DPAPI encryption makes that impossible).
"""
import logging
import os
import time
from pathlib import Path

log = logging.getLogger("social-engine")

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "browser-sessions"
DATA_DIR.mkdir(parents=True, exist_ok=True)

CHROME_EXE = Path(os.environ.get(
    "CHROME_EXE",
    "C:/Program Files/Google/Chrome/Application/chrome.exe"
))

# Dedicated profile directory — NOT Chrome's real profile.
# Sessions persist here after Josh logs in once via --login.
DAEMON_PROFILE = DATA_DIR / "daemon-profile"

_playwright = None
_context = None


def _ensure_playwright():
    """Launch Playwright with a dedicated persistent profile using real Chrome."""
    global _playwright, _context
    if _context is not None:
        return

    from playwright.sync_api import sync_playwright

    DAEMON_PROFILE.mkdir(parents=True, exist_ok=True)

    if _playwright is None:
        _playwright = sync_playwright().start()

    launch_args = [
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-infobars",
    ]

    kwargs = {
        "user_data_dir": str(DAEMON_PROFILE),
        "headless": False,
        "args": launch_args,
        "viewport": {"width": 1280, "height": 900},
        "ignore_default_args": ["--enable-automation"],
    }

    # Use real Chrome if available (better site compatibility than Playwright Chromium)
    if CHROME_EXE.exists():
        kwargs["executable_path"] = str(CHROME_EXE)
        log.info(f"Using real Chrome: {CHROME_EXE}")
    else:
        log.info("Real Chrome not found, using Playwright Chromium")

    _context = _playwright.chromium.launch_persistent_context(**kwargs)
    log.info(f"Browser launched with daemon profile at {DAEMON_PROFILE}")

    # Wait for Chrome's auto-sign-in to complete (SSO flow takes ~60-90s)
    _wait_for_autologin()


def _wait_for_autologin():
    """Wait for Chrome's saved-password auto-sign-in to complete.
    Chrome SSO flow takes ~60-90 seconds after launch."""
    page = _context.new_page()
    try:
        page.goto("https://x.com/home", wait_until="domcontentloaded")
        log.info("Waiting for Chrome auto-sign-in (up to 2 min)...")
        for i in range(24):
            time.sleep(5)
            try:
                url = page.url
                title = page.title()
                if "home" in url and "log in" not in title.lower():
                    log.info(f"Auto-sign-in complete after {(i+1)*5}s")
                    return
            except Exception:
                pass
        log.warning("Auto-sign-in did not complete in 2 min — continuing anyway")
    except Exception as e:
        log.warning(f"Auto-sign-in check failed: {e}")
    finally:
        try:
            page.close()
        except Exception:
            pass


def get_context(platform):
    """Get the shared browser context. All platforms share one context."""
    _ensure_playwright()
    return _context


def save_context(context, platform):
    """No-op — persistent context auto-saves."""
    pass


def close_context(context, platform):
    """No-op — shared context stays alive for other platforms."""
    pass


def get_page(platform):
    """Get a new page (tab) in the shared context."""
    _ensure_playwright()
    page = _context.new_page()
    return page


def shutdown():
    """Shut down the browser and Playwright."""
    global _context, _playwright
    if _context:
        try:
            _context.close()
        except Exception:
            pass
        _context = None
    if _playwright:
        try:
            _playwright.stop()
        except Exception:
            pass
        _playwright = None
    log.info("Browser shutdown complete")


def login_interactive(platform, url):
    """Open a browser window for manual login."""
    _ensure_playwright()
    page = _context.new_page()
    page.goto(url, wait_until="domcontentloaded")
    print(f"\n>>> Log in to {platform} at {url}")
    print(">>> Press Enter here when done...")
    input()
    print(f">>> Session saved for {platform}")


def login_all():
    """Open ALL platform login pages at once in separate tabs.
    Tabs stay open until user presses Enter. Sessions persist forever."""
    PLATFORM_URLS = {
        "twitter": "https://x.com/login",
        "facebook": "https://www.facebook.com/login",
        "instagram": "https://www.instagram.com/accounts/login/",
        "reddit": "https://www.reddit.com/login",
        "linkedin": "https://www.linkedin.com/login",
        "pinterest": "https://www.pinterest.com/login/",
        "tiktok": "https://www.tiktok.com/login",
        "youtube": "https://accounts.google.com/ServiceLogin?service=youtube",
        "threads": "https://www.threads.net/login",
        "quora": "https://www.quora.com/",
        "medium": "https://medium.com/m/signin",
        "nextdoor": "https://nextdoor.com/login/",
        "ebay": "https://signin.ebay.com/",
    }
    _ensure_playwright()
    print("\n" + "=" * 60)
    print("  ONE-TIME LOGIN SETUP — All tabs open at once")
    print("  Log in to each tab. Sessions persist forever.")
    print("=" * 60)

    pages = []
    for platform, url in PLATFORM_URLS.items():
        print(f"  Opening {platform}...")
        page = _context.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            print(f"  Warning: {platform} slow to load ({e})")
        pages.append((platform, page))

    print("\n" + "=" * 60)
    print(f"  {len(pages)} tabs open. Log in to each one now.")
    print("  Take your time. Tabs stay open.")
    print("  Press Enter here ONLY when you're done with ALL logins.")
    print("=" * 60)
    input()

    print("\n  All sessions saved! Daemon will use these sessions.")
    print("  You can close this terminal — sessions persist on disk.")
