"""
Nextdoor Poster — Creates neighborhood posts on Nextdoor via Playwright browser automation.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class NextdoorPoster(BasePoster):
    name = "nextdoor"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a new neighborhood post on Nextdoor.
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to Nextdoor
            log.info(f"[{self.name}] Navigating to nextdoor.com")
            page.goto("https://nextdoor.com/", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Nextdoor — run: python scripts/daemon-login.py"

            # Step 2: Click the post composer to open it
            log.info(f"[{self.name}] Opening post composer")
            composer_trigger = page.wait_for_selector(
                'button:has-text("What\'s on your mind"), '
                'div[data-testid="composer-trigger"], '
                'div[class*="composer"] button, '
                'a[href*="/compose/"], '
                'div[role="button"]:has-text("Share something with your neighbors")',
                timeout=10000,
            )
            composer_trigger.click()
            page.wait_for_timeout(2000)

            # Step 3: Wait for full composer to appear
            log.info(f"[{self.name}] Waiting for composer")
            text_area = page.wait_for_selector(
                'div[contenteditable="true"][role="textbox"], '
                'textarea[placeholder*="neighbor"], '
                'div[aria-label*="compose"][contenteditable="true"], '
                'div[data-testid="composer-body"][contenteditable="true"]',
                timeout=10000,
            )
            text_area.click()
            page.wait_for_timeout(500)

            # Step 4: Type the post text
            log.info(f"[{self.name}] Typing post text")
            page.keyboard.type(text, delay=20)
            page.wait_for_timeout(2000)

            # Step 5: Optionally attach an image
            if image_path and os.path.isfile(image_path):
                log.info(f"[{self.name}] Attaching image: {image_path}")
                try:
                    photo_btn = page.wait_for_selector(
                        'button[aria-label="Add photo"], '
                        'button:has-text("Photo"), '
                        'div[data-testid="add-photo-button"]',
                        timeout=5000,
                    )
                    photo_btn.click()
                    page.wait_for_timeout(1000)
                except Exception:
                    log.warning(f"[{self.name}] Could not find photo button, trying file input")

                file_input = page.wait_for_selector(
                    'input[type="file"]', timeout=10000
                )
                file_input.set_input_files(image_path)
                page.wait_for_timeout(3000)

            # Step 6: Select neighborhood/group if needed
            # (typically defaults to your neighborhood)

            # Step 7: Click Post button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = page.wait_for_selector(
                'button:has-text("Post"), '
                'button[data-testid="submit-post"], '
                'button[type="submit"]:has-text("Post")',
                timeout=10000,
            )
            post_btn.click()
            page.wait_for_timeout(5000)

            log.info(f"[{self.name}] Post submitted successfully")
            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
