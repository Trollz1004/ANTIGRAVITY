"""
Quora Poster — Answers questions on Quora via Playwright browser automation.
Finds relevant questions and posts answers with a subtle YouAndINotAI mention.
"""
import logging

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class QuoraPoster(BasePoster):
    name = "quora"
    method = "browser"

    def post(self, text, image_path=None, **kwargs):
        """
        Answer a question on Quora or create a post.
        kwargs can include: question_url (direct link to answer a specific question),
                            search_query (topic to find a question to answer).
        Returns (success: bool, result_message: str).
        """
        from social_engine.browser_manager import get_context, close_context

        question_url = kwargs.get("question_url")
        search_query = kwargs.get("search_query", "online dating real people no bots")

        context = get_context(self.name)
        page = context.new_page()
        try:
            if question_url:
                # Direct answer to a specific question
                log.info(f"[{self.name}] Navigating to question: {question_url}")
                page.goto(question_url, wait_until="domcontentloaded")
                page.wait_for_timeout(3000)
            else:
                # Search for a relevant question
                log.info(f"[{self.name}] Searching Quora for: {search_query}")
                page.goto(
                    f"https://www.quora.com/search?q={search_query}",
                    wait_until="domcontentloaded",
                )
                page.wait_for_timeout(3000)

            # Check login status
            if not self._check_browser_login(page):
                from social_engine.platforms.base_poster import NOT_LOGGED_IN
                return False, f"{NOT_LOGGED_IN} Quora — run: python scripts/daemon-login.py"

            if not question_url:
                # Click the first relevant question from search results
                log.info(f"[{self.name}] Selecting first question from results")
                first_result = page.wait_for_selector(
                    'a[class*="question_link"], '
                    'div[class*="search_result"] a, '
                    'a[href*="/answer/"], '
                    'span[class*="q-text"]:first-of-type',
                    timeout=10000,
                )
                first_result.click()
                page.wait_for_timeout(3000)

            # Step 2: Click "Answer" button
            log.info(f"[{self.name}] Clicking Answer button")
            answer_btn = page.wait_for_selector(
                'button:has-text("Answer"), '
                'div[class*="AnswerButton"], '
                'a:has-text("Answer")',
                timeout=10000,
            )
            answer_btn.click()
            page.wait_for_timeout(2000)

            # Step 3: Wait for the answer editor to appear
            log.info(f"[{self.name}] Waiting for answer editor")
            editor = page.wait_for_selector(
                'div[contenteditable="true"][class*="doc"], '
                'div[contenteditable="true"][role="textbox"], '
                'div.q-text[contenteditable="true"], '
                'div[class*="CKEditor"] div[contenteditable="true"]',
                timeout=10000,
            )
            editor.click()
            page.wait_for_timeout(500)

            # Step 4: Type the answer text
            log.info(f"[{self.name}] Typing answer")
            page.keyboard.type(text, delay=20)
            page.wait_for_timeout(2000)

            # Step 5: Submit the answer
            log.info(f"[{self.name}] Submitting answer")
            submit_btn = page.wait_for_selector(
                'button:has-text("Submit"), '
                'button:has-text("Post"), '
                'button[class*="submit"]',
                timeout=10000,
            )
            submit_btn.click()
            page.wait_for_timeout(5000)

            log.info(f"[{self.name}] Answer submitted successfully")
            return True, "Posted successfully"

        except Exception as e:
            log.error(f"[{self.name}] Post failed: {e}")
            return False, str(e)
        finally:
            try:
                page.close()
            except Exception:
                pass
