"""Navigate to Stripe API keys page and screenshot it."""
from playwright.sync_api import sync_playwright
import os, time

CHROME_DATA = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data")
SCREENSHOT = r"C:\OPUSONLY\briefings\stripe-screenshot.png"

with sync_playwright() as p:
    # Launch Chrome with existing profile (logged-in session)
    ctx = p.chromium.launch_persistent_context(
        CHROME_DATA,
        channel="chrome",
        headless=False,
        args=["--no-first-run", "--disable-extensions"],
        viewport={"width": 1400, "height": 900},
        timeout=30000,
    )
    page = ctx.new_page()
    print("Navigating to Stripe API keys...")
    page.goto("https://dashboard.stripe.com/apikeys", wait_until="networkidle", timeout=30000)
    time.sleep(3)
    page.screenshot(path=SCREENSHOT, full_page=False)
    print(f"Screenshot saved: {SCREENSHOT}")
    print(f"Title: {page.title()}")
    print(f"URL: {page.url()}")

    # Try to find and click "Reveal live key" button
    try:
        reveal_btns = page.locator("text=Reveal live key").all()
        if reveal_btns:
            print(f"Found {len(reveal_btns)} 'Reveal live key' button(s)")
        else:
            reveal_btns = page.locator("button:has-text('Reveal')").all()
            print(f"Found {len(reveal_btns)} Reveal button(s)")
    except Exception as e:
        print(f"Button search error: {e}")

    # Keep browser open for 120s so Josh can interact
    print("Browser open for 120s - interact if needed...")
    time.sleep(120)
    ctx.close()
