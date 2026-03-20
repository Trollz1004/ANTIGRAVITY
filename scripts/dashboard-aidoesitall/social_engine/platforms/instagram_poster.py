"""
Instagram Poster — Posts to Instagram via Playwright browser automation.
Handles the multi-step new post flow: upload image, add caption, share.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class InstagramPoster(BasePoster):
    name = "instagram"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Post an image with caption to Instagram.
        Instagram requires an image — text-only posts are not supported.
        Returns (success: bool, result_message: str).
        """
        if not image_path or not os.path.isfile(image_path):
            return False, "Instagram requires an image_path to post"

        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to Instagram
            log.info(f"[{self.name}] Navigating to instagram.com")
            page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Instagram — run: python scripts/daemon-login.py"

            # Step 2: Click the "New post" button (the + icon in the nav)
            log.info(f"[{self.name}] Clicking New Post button")
            new_post_btn = page.wait_for_selector(
                'svg[aria-label="New post"], [aria-label="New post"], '
                'a[href="/create/style/"], svg[aria-label="New Post"]',
                timeout=10000,
            )
            new_post_btn.click()
            page.wait_for_timeout(2000)

            # Step 3: Upload the image via file input
            log.info(f"[{self.name}] Uploading image: {image_path}")
            file_input = page.wait_for_selector(
                'input[type="file"]', timeout=10000
            )
            file_input.set_input_files(image_path)
            page.wait_for_timeout(3000)

            # Step 4: Click "Next" through crop/filter screens
            log.info(f"[{self.name}] Clicking through Next buttons")
            for step in range(2):
                try:
                    next_btn = page.wait_for_selector(
                        'button:has-text("Next"), div[role="button"]:has-text("Next")',
                        timeout=10000,
                    )
                    next_btn.click()
                    page.wait_for_timeout(2000)
                except Exception:
                    log.warning(f"[{self.name}] Next button step {step + 1} not found, continuing")

            # Step 5: Add caption
            log.info(f"[{self.name}] Adding caption")
            caption_area = page.wait_for_selector(
                'textarea[aria-label="Write a caption..."], '
                'div[aria-label="Write a caption..."], '
                'div[role="textbox"][contenteditable="true"]',
                timeout=10000,
            )
            caption_area.click()
            page.wait_for_timeout(500)
            caption_area.fill(text)
            page.wait_for_timeout(1000)

            # Step 6: Click Share
            log.info(f"[{self.name}] Clicking Share")
            share_btn = page.wait_for_selector(
                'button:has-text("Share"), div[role="button"]:has-text("Share")',
                timeout=10000,
            )
            share_btn.click()
            page.wait_for_timeout(5000)

            # Step 7: Wait for confirmation
            try:
                page.wait_for_selector(
                    'text="Your post has been shared",'
                    'text="Post shared",'
                    'img[alt="Animated checkmark"]',
                    timeout=15000,
                )
                log.info(f"[{self.name}] Post shared successfully")
            except Exception:
                log.warning(f"[{self.name}] Could not confirm share — may still have succeeded")

            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
