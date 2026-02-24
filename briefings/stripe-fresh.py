"""Open Playwright Chromium, navigate to Stripe login. Josh signs in, we grab the key."""
from playwright.sync_api import sync_playwright
import time

PROFILE_DIR = r"C:\OPUSONLY\_ARCHIVE\dot-dirs\.playwright-profiles\stripe"
SCREENSHOT = r"C:\OPUSONLY\briefings\stripe-screenshot.png"
KEY_FILE = r"C:\OPUSONLY\briefings\stripe-sk-live.txt"

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        PROFILE_DIR,
        headless=False,
        viewport={"width": 1400, "height": 900},
        timeout=30000,
    )
    page = ctx.new_page()
    print("Navigating to Stripe API keys page...")
    print(">>> SIGN IN when the page loads <<<")

    try:
        page.goto("https://dashboard.stripe.com/apikeys", wait_until="domcontentloaded", timeout=60000)
    except Exception as e:
        print(f"Initial nav: {e}")

    # Wait for Josh to sign in - poll for the API keys page
    print("Waiting for you to sign in (up to 3 min)...")
    found = False
    for i in range(90):  # 3 min max
        time.sleep(2)
        try:
            url = page.url
            if "apikeys" in url and "login" not in url.lower() and "auth" not in url.lower():
                print(f"Logged in! URL: {url}")
                found = True
                break
            if i % 10 == 0:
                print(f"  Still waiting... ({url[:60]})")
        except:
            pass

    if not found:
        print("Timed out waiting for login. Taking screenshot of current state...")

    time.sleep(3)
    try:
        page.screenshot(path=SCREENSHOT)
        print(f"Screenshot saved: {SCREENSHOT}")
    except:
        pass

    # Scan page text
    try:
        body = page.locator("body").inner_text()
        for line in body.split("\n"):
            ln = line.strip()
            if "sk_live" in ln:
                print(f"SECRET KEY FOUND: {ln[:30]}...")
                with open(KEY_FILE, "w") as f:
                    f.write(ln)
            if "reveal" in ln.lower():
                print(f"REVEAL: {ln[:80]}")
    except Exception as e:
        print(f"Scan error: {e}")

    # Try clicking reveal
    try:
        reveal = page.get_by_role("button", name="Reveal live key")
        if reveal.count() > 0:
            print("Clicking 'Reveal live key'...")
            reveal.first.click()
            time.sleep(3)
            body2 = page.locator("body").inner_text()
            for line in body2.split("\n"):
                if "sk_live" in line.strip():
                    key = line.strip()
                    print(f"KEY REVEALED: {key[:30]}...")
                    with open(KEY_FILE, "w") as f:
                        f.write(key)
                    break
            page.screenshot(path=SCREENSHOT.replace(".png", "-revealed.png"))
    except Exception as e:
        print(f"Reveal error: {e}")

    print("Keeping browser open 90s...")
    time.sleep(90)
    ctx.close()
    print("Done.")
