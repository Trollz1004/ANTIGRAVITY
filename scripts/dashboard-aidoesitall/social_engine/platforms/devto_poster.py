"""
Dev.to Poster — Publishes articles to Dev.to via their REST API.
Pure requests implementation using urllib.
"""
import json
import logging
import os
import urllib.request

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")

DEVTO_API_URL = "https://dev.to/api/articles"


class DevtoPoster(BasePoster):
    name = "devto"
    method = "api"

    def _check_config(self):
        self._api_key = os.getenv("DEVTO_API_KEY")

        if not self._api_key:
            log.warning("DevtoPoster disabled — missing env var: DEVTO_API_KEY")
            self.enabled = False

    def post(self, text, image_path=None, **kwargs):
        """
        Post a short article to Dev.to.
        For proper articles, use post_article() instead.
        Returns (success: bool, result_message: str).
        """
        if not self.enabled:
            return (False, "DevtoPoster is disabled — missing credentials")

        try:
            # For plain text posts, use the first line as title and the rest as body
            lines = text.strip().split("\n", 1)
            title = lines[0].strip()
            body = lines[1].strip() if len(lines) > 1 else title

            return self.post_article(
                title=title,
                body=body,
                tags=kwargs.get("tags"),
                **{k: v for k, v in kwargs.items() if k != "tags"},
            )

        except Exception as e:
            log.error(f"Dev.to: post failed — {e}")
            return (False, str(e))

    def post_article(self, title, body, tags=None, **kwargs):
        """
        Publish an article to Dev.to.

        Args:
            title: Article title.
            body: Article body in Markdown.
            tags: List of tags (max 4, e.g. ["dating", "startup", "ai", "webdev"]).

        Returns (success: bool, result_message: str).
        """
        if not self.enabled:
            return (False, "DevtoPoster is disabled — missing credentials")

        try:
            article_data = {
                "title": title,
                "body_markdown": body,
                "published": True,
            }

            if tags:
                # Dev.to allows max 4 tags
                article_data["tags"] = tags[:4]

            # Optional fields from kwargs
            if kwargs.get("series"):
                article_data["series"] = kwargs["series"]
            if kwargs.get("canonical_url"):
                article_data["canonical_url"] = kwargs["canonical_url"]

            payload = json.dumps({"article": article_data}).encode("utf-8")

            req = urllib.request.Request(
                DEVTO_API_URL,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "api-key": self._api_key,
                },
                method="POST",
            )

            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                article_url = result.get("url", "")
                article_id = result.get("id", "")
                log.info(f"Dev.to: published article {article_id} — {article_url}")
                return (True, article_url)

        except Exception as e:
            log.error(f"Dev.to: post_article failed — {e}")
            return (False, str(e))
