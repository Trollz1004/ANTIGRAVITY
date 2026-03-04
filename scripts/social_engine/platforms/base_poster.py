"""
Base Poster — Abstract base class for all platform posters.
"""
import logging
from abc import ABC, abstractmethod

log = logging.getLogger("social-engine")

# Prefix for "not logged in" errors — main loop detects this and skips without backoff
NOT_LOGGED_IN = "NOT_LOGGED_IN:"


class BasePoster(ABC):
    """Abstract base for platform posting."""

    name: str = "unknown"
    method: str = "api"  # "api" or "browser"

    def __init__(self):
        self.enabled = True
        self._check_config()

    def _check_config(self):
        """Override to check if required config exists. Set self.enabled = False if not."""
        pass

    @abstractmethod
    def post(self, text, image_path=None, **kwargs):
        """
        Post content to the platform.
        Returns (success: bool, result: str)
        """
        raise NotImplementedError

    def post_article(self, title, body, tags=None, **kwargs):
        """Post long-form content. Override for article platforms."""
        return self.post(f"{title}\n\n{body}")

    def _check_browser_login(self, page, login_indicators=None):
        """Check if the browser page is on a login page.
        Returns True if logged in, False if redirected to login.
        Use after navigating to the platform."""
        url = page.url.lower()
        title = page.title().lower()

        indicators = login_indicators or ["login", "sign-in", "signin", "sign_in", "accounts/login"]
        for indicator in indicators:
            if indicator in url:
                return False
        if "log in" in title or "sign in" in title or "sign up" in title:
            return False
        return True

    def __repr__(self):
        status = "enabled" if self.enabled else "disabled"
        return f"<{self.__class__.__name__} [{self.name}] {status}>"
