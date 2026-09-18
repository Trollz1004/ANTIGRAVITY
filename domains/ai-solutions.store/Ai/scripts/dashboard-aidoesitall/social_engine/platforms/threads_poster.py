"""
Threads Poster — Posts to Threads (Meta) via Playwright browser automation.
Opens compose, types text, and posts.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class ThreadsPoster(BasePoster):
    name = "threads"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a new Threads post.
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to Threads
            log.info(f"[{self.name}] Navigating to threads.net")
            page.goto("https://www.threads.net/", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Threads — run: python scripts/daemon-login.py"

            # Step 2: Click compose/new post button
            log.info(f"[{self.name}] Clicking compose button")
            compose_btn = page.wait_for_selector(
                'svg[aria-label="Create"], '
                'a[href="/create"], '
                'div[role="button"][tabindex="0"]:has(svg[aria-label="Create"]), '
                'svg[aria-label="New thread"]',
                timeout=10000,
            )
            compose_btn.click()
            page.wait_for_timeout(2000)

            # Step 3: Type the post text
            log.info(f"[{self.name}] Typing post text")
            text_area = page.wait_for_selector(
                'div[contenteditable="true"][role="textbox"], '
                'div[aria-placeholder="Start a thread..."]'
                '[contenteditable="true"], '
                'p[data-placeholder="Start a thread..."]',
                timeout=10000,
            )
            text_area.click()
            page.wait_for_timeout(500)
            page.keyboard.type(text, delay=20)
            page.wait_for_timeout(2000)

            # Step 4: Optionally attach an image
            if image_path and os.path.isfile(image_path):
                log.info(f"[{self.name}] Attaching image: {image_path}")
                try:
                    attach_btn = page.wait_for_selector(
                        'svg[aria-label="Attach media"], '
                        'div[role="button"]:has(svg[aria-label="Attach media"])',
                        timeout=5000,
                    )
                    attach_btn.click()
                    page.wait_for_timeout(1000)
                except Exception:
                    log.warning(f"[{self.name}] Could not find attach button, trying file input")

                file_input = page.wait_for_selector(
                    'input[type="file"]', timeout=10000
                )
                file_input.set_input_files(image_path)
                page.wait_for_timeout(3000)

            # Step 5: Click Post button
            log.info(f"[{self.name}] Clicking Post button")
            post_btn = page.wait_for_selector(
                'div[role="button"]:has-text("Post"), '
                'button:has-text("Post")',
                timeout=10000,
            )
            post_btn.click()
            page.wait_for_timeout(5000)

            log.info(f"[{self.name}] Thread posted successfully")
            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
