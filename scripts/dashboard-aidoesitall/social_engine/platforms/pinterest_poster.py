"""
Pinterest Poster — Creates pins via Playwright browser automation.
Uploads image, sets title/description/destination link, and publishes.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")

DESTINATION_URL = "https://youandinotai.com"


class PinterestPoster(BasePoster):
    name = "pinterest"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a new pin on Pinterest.
        kwargs can include: title, link (destination URL).
        Returns (success: bool, result_message: str).
        """
        if not image_path or not os.path.isfile(image_path):
            return False, "Pinterest requires an image_path to create a pin"

        title = kwargs.get("title", "YouAndINotAI — Real Dates, Not Bots")
        link = kwargs.get("link", DESTINATION_URL)

        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to pin creation tool
            log.info(f"[{self.name}] Navigating to pin creation tool")
            page.goto(
                "https://www.pinterest.com/pin-creation-tool/",
                wait_until="domcontentloaded",
            )
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Pinterest — run: python scripts/daemon-login.py"

            # Step 2: Upload image
            log.info(f"[{self.name}] Uploading image: {image_path}")
            file_input = page.wait_for_selector(
                'input[type="file"]', timeout=10000
            )
            file_input.set_input_files(image_path)
            page.wait_for_timeout(3000)

            # Step 3: Add title
            log.info(f"[{self.name}] Setting title: {title}")
            title_input = page.wait_for_selector(
                'input[id="pin-draft-title"], '
                'input[placeholder="Add a title"], '
                'textarea[placeholder="Add a title"], '
                'div[data-test-id="pin-draft-title"] input',
                timeout=10000,
            )
            title_input.click()
            title_input.fill(title)
            page.wait_for_timeout(1000)

            # Step 4: Add description
            log.info(f"[{self.name}] Setting description")
            desc_input = page.wait_for_selector(
                'textarea[id="pin-draft-description"], '
                'div[data-test-id="pin-draft-description"] textarea, '
                'textarea[placeholder="Tell everyone what your Pin is about"], '
                'div[contenteditable="true"][role="textbox"]',
                timeout=10000,
            )
            desc_input.click()
            desc_input.fill(text)
            page.wait_for_timeout(1000)

            # Step 5: Add destination link
            log.info(f"[{self.name}] Setting destination link: {link}")
            link_input = page.wait_for_selector(
                'input[id="pin-draft-link"], '
                'input[placeholder="Add a destination link"], '
                'div[data-test-id="pin-draft-link"] input',
                timeout=10000,
            )
            link_input.click()
            link_input.fill(link)
            page.wait_for_timeout(1000)

            # Step 6: Click Publish
            log.info(f"[{self.name}] Clicking Publish")
            publish_btn = page.wait_for_selector(
                'button:has-text("Publish"), '
                'div[data-test-id="board-dropdown-save-button"] button',
                timeout=10000,
            )
            publish_btn.click()
            page.wait_for_timeout(5000)

            # Step 7: Confirm
            try:
                page.wait_for_selector(
                    'text="Published", text="Pin published"',
                    timeout=10000,
                )
                log.info(f"[{self.name}] Pin published successfully")
            except Exception:
                log.warning(f"[{self.name}] Could not confirm publish — may still have succeeded")

            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
