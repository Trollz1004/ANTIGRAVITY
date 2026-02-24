"""Connect to Chrome via CDP and navigate to Stripe API keys."""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:9222")
    print(f"Connected. Contexts: {len(browser.contexts)}")

    ctx = browser.contexts[0] if browser.contexts else browser.new_context()
    pages = ctx.pages
    print(f"Open pages: {len(pages)}")

    # Find the Stripe tab or create one
    stripe_page = None
    for pg in pages:
        if "stripe" in pg.url.lower():
            stripe_page = pg
            break

    if not stripe_page:
        stripe_page = ctx.new_page()

    stripe_page.goto("https://dashboard.stripe.com/apikeys", wait_until="networkidle", timeout=30000)
    time.sleep(3)

    print(f"Title: {stripe_page.title()}")
    print(f"URL: {stripe_page.url()}")

    # Screenshot
    stripe_page.screenshot(path=r"C:\OPUSONLY\briefings\stripe-screenshot.png")
    print("Screenshot saved")

    # Try to find secret key or reveal button
    try:
        # Look for any text containing sk_live
        all_text = stripe_page.locator("body").inner_text()
        for line in all_text.split("\n"):
            if "sk_live" in line or "Secret" in line or "Reveal" in line:
                print(f"FOUND: {line.strip()[:80]}")
    except Exception as e:
        print(f"Text scan error: {e}")

    # Don't close - leave browser open
    print("Done. Browser stays open.")
