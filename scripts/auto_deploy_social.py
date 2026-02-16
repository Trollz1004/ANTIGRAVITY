"""
auto_deploy_social.py - Autonomous Social Media Deployment System
=================================================================
Part of Protocol Omega: 50-year autonomous operation.
Deploys images + captions to Instagram, TikTok, Pinterest via Selenium.
Selenium CAN upload files (unlike Chrome extension MCP).

Usage:
  python scripts/auto_deploy_social.py --platform instagram --post-first
  python scripts/auto_deploy_social.py --platform all --deploy-all
  python scripts/auto_deploy_social.py --platform instagram --stories
  python scripts/auto_deploy_social.py --platform tiktok
  python scripts/auto_deploy_social.py --platform pinterest

Designed to run headless, unattended, on cron/pm2.
"""

import argparse
import json
import os
import sys
import time
import logging
from pathlib import Path
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# ── Config ──
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
ASSETS_DIR = PROJECT_DIR / "assets"
CONTENT_DIR = PROJECT_DIR / "content"
REPORTS_DIR = PROJECT_DIR / "deployment-reports"
CAPTION_BANK = CONTENT_DIR / "caption-bank.json"

LOG_DIR = PROJECT_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / f"deploy-{datetime.now().strftime('%Y%m%d-%H%M')}.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("auto_deploy")

# ── Asset paths ──
IG_FEED = sorted((ASSETS_DIR / "social" / "instagram-feed").glob("*.png"))
IG_STORIES = sorted((ASSETS_DIR / "social" / "instagram-stories").glob("*.png"))
TIKTOK = sorted((ASSETS_DIR / "social" / "tiktok").glob("*.png"))
PINTEREST = sorted((ASSETS_DIR / "social" / "pinterest").glob("*.png"))
TWITTER = sorted((ASSETS_DIR / "social" / "twitter").glob("*.png"))
VARIATIONS = sorted((ASSETS_DIR / "social" / "variations").glob("*.png"))
COUNTDOWN = sorted((ASSETS_DIR / "social" / "countdown").glob("*.png"))
PROFILE_PIC = ASSETS_DIR / "logo" / "logo-social-profile-400.png"


def load_captions():
    """Load caption bank."""
    if CAPTION_BANK.exists():
        with open(CAPTION_BANK) as f:
            return json.load(f)
    return {"instagram": [], "tiktok": [], "pinterest": []}


def get_driver(headless=False, user_data_dir=None):
    """Create Chrome driver. Uses existing Chrome profile if specified."""
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1280,900")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    if user_data_dir:
        opts.add_argument(f"--user-data-dir={user_data_dir}")

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=opts)
    except Exception:
        # Fallback: try system Chrome
        driver = webdriver.Chrome(options=opts)

    driver.execute_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


def wait_and_find(driver, by, value, timeout=10):
    """Wait for element and return it."""
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def wait_and_click(driver, by, value, timeout=10):
    """Wait for element to be clickable and click."""
    el = WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )
    el.click()
    return el


def save_screenshot(driver, name):
    """Save screenshot for deployment report."""
    report_dir = REPORTS_DIR / datetime.now().strftime("%Y-%m-%d")
    report_dir.mkdir(parents=True, exist_ok=True)
    path = report_dir / f"{name}-{int(time.time())}.png"
    driver.save_screenshot(str(path))
    log.info(f"Screenshot: {path}")
    return path


# ── Instagram ──

def deploy_instagram_feed(driver, images=None, captions=None, max_posts=1):
    """Deploy feed posts to Instagram."""
    if images is None:
        images = IG_FEED
    if captions is None:
        bank = load_captions()
        captions = [c["text"] + "\n\n" + " ".join(c.get("hashtags", []))
                     for c in bank.get("instagram", [])]

    driver.get("https://www.instagram.com/")
    time.sleep(3)

    posted = 0
    for i, img_path in enumerate(images[:max_posts]):
        caption = captions[i] if i < len(captions) else f"YouAndINotAI - No Bots. Real Humans.\nyouandinotai.com"

        try:
            log.info(f"Instagram feed post {i+1}: {img_path.name}")

            # Click Create (+) button
            create_btn = wait_and_click(driver, By.CSS_SELECTOR, '[aria-label="New post"]', timeout=10)
            time.sleep(1)

            # Click "Post" from dropdown
            try:
                post_option = wait_and_click(driver, By.XPATH, '//span[text()="Post"]', timeout=5)
            except TimeoutException:
                # May go directly to upload
                pass
            time.sleep(1)

            # Find file input and set the file (THIS IS THE KEY - Selenium CAN do this!)
            file_input = driver.find_element(By.CSS_SELECTOR, 'input[type="file"]')
            file_input.send_keys(str(img_path.resolve()))
            log.info(f"  File uploaded: {img_path.name}")
            time.sleep(3)

            # Click through crop/filter screens
            for step_name in ["Next", "Next"]:
                try:
                    next_btn = wait_and_click(
                        driver, By.XPATH, f'//div[text()="{step_name}"]', timeout=5
                    )
                    time.sleep(1)
                except TimeoutException:
                    try:
                        next_btn = wait_and_click(
                            driver, By.XPATH, '//button[contains(text(), "Next")]', timeout=3
                        )
                        time.sleep(1)
                    except TimeoutException:
                        log.warning(f"  Could not find '{step_name}' button")

            # Type caption
            try:
                caption_area = wait_and_find(
                    driver, By.CSS_SELECTOR, '[aria-label="Write a caption..."]', timeout=5
                )
                caption_area.click()
                # Type caption character by character to handle special chars
                for char in caption:
                    caption_area.send_keys(char)
                    time.sleep(0.01)
                log.info(f"  Caption typed ({len(caption)} chars)")
            except TimeoutException:
                log.warning("  Could not find caption area")

            # Click Share
            try:
                share_btn = wait_and_click(
                    driver, By.XPATH, '//div[text()="Share"]', timeout=5
                )
                time.sleep(5)
                log.info(f"  POSTED: Instagram feed #{i+1}")
                posted += 1
                save_screenshot(driver, f"ig-feed-{i+1}")
            except TimeoutException:
                log.error(f"  Could not find Share button for post {i+1}")
                save_screenshot(driver, f"ig-feed-{i+1}-error")

        except Exception as e:
            log.error(f"  Instagram post {i+1} failed: {e}")
            save_screenshot(driver, f"ig-feed-{i+1}-error")

        time.sleep(5)  # Rate limit between posts

    return posted


def deploy_instagram_stories(driver, images=None):
    """Deploy stories to Instagram."""
    if images is None:
        images = IG_STORIES

    driver.get("https://www.instagram.com/")
    time.sleep(3)

    posted = 0
    for i, img_path in enumerate(images):
        try:
            log.info(f"Instagram story {i+1}/{len(images)}: {img_path.name}")

            # Find story creation (Your story or + icon)
            try:
                story_btn = wait_and_click(
                    driver, By.XPATH, '//div[contains(text(), "Your story")]', timeout=5
                )
            except TimeoutException:
                # Try the + button on profile pic
                try:
                    story_btn = wait_and_click(
                        driver, By.CSS_SELECTOR, '[aria-label="New story"]', timeout=5
                    )
                except TimeoutException:
                    log.warning("  Could not find story creation button")
                    continue
            time.sleep(1)

            # Upload file
            file_input = driver.find_element(By.CSS_SELECTOR, 'input[type="file"]')
            file_input.send_keys(str(img_path.resolve()))
            time.sleep(3)

            # Add link sticker if possible
            # (would need more complex interaction - skip for automation v1)

            # Share story
            try:
                share_btn = wait_and_click(
                    driver, By.XPATH,
                    '//div[text()="Share to story" or text()="Share"]',
                    timeout=5
                )
                time.sleep(3)
                log.info(f"  POSTED: Story #{i+1}")
                posted += 1
            except TimeoutException:
                log.warning(f"  Could not share story {i+1}")
                save_screenshot(driver, f"ig-story-{i+1}-error")

        except Exception as e:
            log.error(f"  Story {i+1} failed: {e}")

        time.sleep(3)

    return posted


# ── TikTok ──

def deploy_tiktok(driver, images=None, captions=None):
    """Deploy to TikTok (static image as video)."""
    if images is None:
        images = TIKTOK
    if captions is None:
        bank = load_captions()
        captions = [c["text"] for c in bank.get("tiktok", [])]

    posted = 0
    for i, img_path in enumerate(images):
        caption = captions[i] if i < len(captions) else "No bots. Real humans. youandinotai.com"

        try:
            driver.get("https://www.tiktok.com/upload")
            time.sleep(5)

            log.info(f"TikTok post {i+1}: {img_path.name}")

            # Find file input
            file_input = driver.find_element(By.CSS_SELECTOR, 'input[type="file"]')
            file_input.send_keys(str(img_path.resolve()))
            time.sleep(5)

            # Type caption
            try:
                caption_area = wait_and_find(
                    driver, By.CSS_SELECTOR, '[data-placeholder]', timeout=10
                )
                caption_area.click()
                caption_area.send_keys(Keys.CONTROL, "a")
                caption_area.send_keys(caption)
                log.info(f"  Caption typed")
            except TimeoutException:
                log.warning("  Could not find caption area")

            # Click Post
            try:
                post_btn = wait_and_click(
                    driver, By.XPATH, '//button[contains(text(), "Post")]', timeout=10
                )
                time.sleep(10)
                log.info(f"  POSTED: TikTok #{i+1}")
                posted += 1
                save_screenshot(driver, f"tiktok-{i+1}")
            except TimeoutException:
                log.error(f"  Could not find Post button")
                save_screenshot(driver, f"tiktok-{i+1}-error")

        except Exception as e:
            log.error(f"  TikTok {i+1} failed: {e}")

        time.sleep(5)

    return posted


# ── Pinterest ──

def deploy_pinterest(driver, images=None, captions=None):
    """Deploy pins to Pinterest."""
    if images is None:
        images = PINTEREST
    if captions is None:
        bank = load_captions()
        captions = [c["text"] for c in bank.get("pinterest", [])]

    posted = 0
    for i, img_path in enumerate(images):
        caption = captions[i] if i < len(captions) else "YouAndINotAI - Verified Human Dating"
        title = f"YouAndINotAI - {['Dating Safety', 'No Bots', 'Real Connections', 'Verified Humans', 'V8 Cloud', 'Founding Members', 'Real Dating', 'Human Verified'][i % 8]}"

        try:
            driver.get("https://www.pinterest.com/pin-creation-tool/")
            time.sleep(3)

            log.info(f"Pinterest pin {i+1}: {img_path.name}")

            # Upload image
            file_input = driver.find_element(By.CSS_SELECTOR, 'input[type="file"]')
            file_input.send_keys(str(img_path.resolve()))
            time.sleep(3)

            # Title
            try:
                title_input = wait_and_find(driver, By.ID, "pin-draft-title", timeout=5)
                title_input.clear()
                title_input.send_keys(title)
            except TimeoutException:
                try:
                    title_input = wait_and_find(
                        driver, By.CSS_SELECTOR, '[placeholder*="title" i]', timeout=3
                    )
                    title_input.send_keys(title)
                except TimeoutException:
                    log.warning("  Could not find title input")

            # Description
            try:
                desc_input = wait_and_find(
                    driver, By.CSS_SELECTOR,
                    '[placeholder*="description" i], [aria-label*="description" i]',
                    timeout=5
                )
                desc_input.send_keys(caption)
            except TimeoutException:
                log.warning("  Could not find description input")

            # Destination link
            try:
                link_input = wait_and_find(
                    driver, By.CSS_SELECTOR,
                    '[placeholder*="link" i], [aria-label*="link" i]',
                    timeout=5
                )
                link_input.send_keys("https://youandinotai.com")
            except TimeoutException:
                log.warning("  Could not find link input")

            # Publish
            try:
                pub_btn = wait_and_click(
                    driver, By.XPATH, '//button[contains(text(), "Publish")]', timeout=5
                )
                time.sleep(5)
                log.info(f"  POSTED: Pinterest pin #{i+1}")
                posted += 1
                save_screenshot(driver, f"pinterest-{i+1}")
            except TimeoutException:
                log.error(f"  Could not find Publish button")
                save_screenshot(driver, f"pinterest-{i+1}-error")

        except Exception as e:
            log.error(f"  Pinterest {i+1} failed: {e}")

        time.sleep(3)

    return posted


# ── Main ──

def main():
    parser = argparse.ArgumentParser(description="YouAndINotAI Auto Deploy System")
    parser.add_argument("--platform", "-p", required=True,
                        choices=["instagram", "tiktok", "pinterest", "all"],
                        help="Platform to deploy to")
    parser.add_argument("--post-first", action="store_true",
                        help="Post only the first item (test mode)")
    parser.add_argument("--deploy-all", action="store_true",
                        help="Deploy ALL content to ALL platforms")
    parser.add_argument("--stories", action="store_true",
                        help="Deploy Instagram stories")
    parser.add_argument("--headless", action="store_true",
                        help="Run in headless mode (no visible browser)")
    parser.add_argument("--profile", default=None,
                        help="Chrome user data directory (to reuse login session)")
    parser.add_argument("--max-posts", type=int, default=100,
                        help="Maximum posts per platform")

    args = parser.parse_args()

    log.info("=" * 60)
    log.info("YouAndINotAI Auto Deploy System")
    log.info(f"Platform: {args.platform}")
    log.info(f"Time: {datetime.now().isoformat()}")
    log.info("=" * 60)

    # Check assets
    log.info(f"IG Feed: {len(IG_FEED)} images")
    log.info(f"IG Stories: {len(IG_STORIES)} images")
    log.info(f"TikTok: {len(TIKTOK)} images")
    log.info(f"Pinterest: {len(PINTEREST)} images")
    log.info(f"Variations: {len(VARIATIONS)} images")
    log.info(f"Countdown: {len(COUNTDOWN)} images")

    max_posts = 1 if args.post_first else args.max_posts
    results = {}

    driver = get_driver(headless=args.headless, user_data_dir=args.profile)

    try:
        if args.platform in ("instagram", "all"):
            if args.stories:
                results["ig_stories"] = deploy_instagram_stories(driver, IG_STORIES[:max_posts])
            else:
                results["ig_feed"] = deploy_instagram_feed(driver, IG_FEED, max_posts=max_posts)

        if args.platform in ("tiktok", "all"):
            results["tiktok"] = deploy_tiktok(driver, TIKTOK[:max_posts])

        if args.platform in ("pinterest", "all"):
            results["pinterest"] = deploy_pinterest(driver, PINTEREST[:max_posts])

    finally:
        driver.quit()

    # Summary
    log.info("=" * 60)
    log.info("DEPLOYMENT COMPLETE")
    for platform, count in results.items():
        log.info(f"  {platform}: {count} posted")
    log.info("=" * 60)

    # Save results
    report = {
        "timestamp": datetime.now().isoformat(),
        "results": results,
        "total_posted": sum(results.values()),
    }
    report_path = REPORTS_DIR / datetime.now().strftime("%Y-%m-%d") / "deploy-results.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    log.info(f"Report saved: {report_path}")


if __name__ == "__main__":
    main()
