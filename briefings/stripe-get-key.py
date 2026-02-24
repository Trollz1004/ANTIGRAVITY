"""Grab Stripe secret key from dashboard using existing Chrome session."""
import subprocess
import json
import sys
import os

# Use Chrome's default user data dir so we get Josh's logged-in session
CHROME_USER_DATA = os.path.expanduser("~") + "/AppData/Local/Google/Chrome/User Data"

script = """
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launchPersistentContext(
    process.env.CHROME_USER_DATA,
    {
      headless: false,
      channel: 'chrome',
      args: ['--no-first-run'],
      viewport: { width: 1280, height: 800 }
    }
  );

  const page = await browser.newPage();
  await page.goto('https://dashboard.stripe.com/apikeys', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Take screenshot so we can see what's there
  await page.screenshot({ path: 'C:/OPUSONLY/briefings/stripe-dashboard.png' });

  console.log('SCREENSHOT_SAVED');
  console.log('Page title: ' + await page.title());
  console.log('Page URL: ' + page.url());

  // Don't close - let Josh see it
  await page.waitForTimeout(60000);
  await browser.close();
})();
"""

# Write the node script
with open("C:/OPUSONLY/briefings/stripe-nav.js", "w") as f:
    f.write(script)

print("Script written. Run with: CHROME_USER_DATA='path' node stripe-nav.js")
