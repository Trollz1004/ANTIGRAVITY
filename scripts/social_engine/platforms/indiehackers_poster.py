"""
Indie Hackers Poster — Creates posts on Indie Hackers via Playwright browser automation.
"""
import logging

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class IndieHackersPoster(BasePoster):
    name = "indiehackers"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Create a new post or update on Indie Hackers.
        kwargs can include: title, group (e.g. "startups", "marketing").
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        title = kwargs.get("title", "")
        group = kwargs.get("group", "")

        context = get_context(self.name)
        page = context.new_page()
        try:
            # Step 1: Navigate to Indie Hackers
            if group:
                url = f"https://www.indiehackers.com/group/{group}/new"
                log.info(f"[{self.name}] Navigating to group: {group}")
            else:
                url = "https://www.indiehackers.com/"
                log.info(f"[{self.name}] Navigating to indiehackers.com")
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} IndieHackers — run: python scripts/daemon-login.py"

            # Step 2: Click "New Post" button if on homepage
            if not group:
                log.info(f"[{self.name}] Looking for New Post button")
                try:
                    new_post_btn = page.wait_for_selector(
                        'a:has-text("New Post"), '
                        'button:has-text("New Post"), '
                        'a[href*="/new"]',
                        timeout=10000,
                    )
                    new_post_btn.click()
                    page.wait_for_timeout(2000)
                except Exception:
                    # Try navigating directly to new post page
                    log.info(f"[{self.name}] Navigating directly to new post page")
                    page.goto(
                        "https://www.indiehackers.com/new-post",
                        wait_until="domcontentloaded",
                    )
                    page.wait_for_timeout(2000)

            # Step 3: Add title if provided
            if title:
                log.info(f"[{self.name}] Setting title: {title[:50]}...")
                title_input = page.wait_for_selector(
                    'input[placeholder*="Title"], '
                    'input[name="title"], '
                    'textarea[placeholder*="Title"], '
                    'input[class*="title"]',
                    timeout=10000,
                )
                title_input.click()
                title_input.fill(title)
                page.wait_for_timeout(1000)

            # Step 4: Type post body
            log.info(f"[{self.name}] Typing post body")
            body_area = page.wait_for_selector(
                'div[contenteditable="true"], '
                'textarea[placeholder*="body"], '
                'textarea[name="body"], '
                'div[class*="editor"] div[contenteditable="true"], '
                'textarea[class*="body"]',
                timeout=10000,
            )
            body_area.click()
            page.wait_for_timeout(500)
            if body_area.evaluate("el => el.tagName") == "TEXTAREA":
                body_area.fill(text)
            else:
                page.keyboard.type(text, delay=15)
            page.wait_for_timeout(2000)

            # Step 5: Click Submit/Post button
            log.info(f"[{self.name}] Clicking Submit button")
            submit_btn = page.wait_for_selector(
                'button:has-text("Submit"), '
                'button:has-text("Post"), '
                'button:has-text("Publish"), '
                'button[type="submit"]',
                timeout=10000,
            )
            submit_btn.click()
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
