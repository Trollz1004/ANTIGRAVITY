"""
Mastodon Poster — Posts to Mastodon via Mastodon.py.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")

DEFAULT_INSTANCE = "https://mastodon.social"


class MastodonPoster(BasePoster):
    name = "mastodon"
    method = "api"

    def _check_config(self):
        self._access_token = os.getenv("MASTODON_ACCESS_TOKEN")
        self._instance = os.getenv("MASTODON_INSTANCE", DEFAULT_INSTANCE)

        if not self._access_token:
            log.warning("MastodonPoster disabled — missing env var: MASTODON_ACCESS_TOKEN")
            self.enabled = False

    def _get_client(self):
        """Build and return authenticated Mastodon client."""
        from mastodon import Mastodon

        return Mastodon(
            access_token=self._access_token,
            api_base_url=self._instance,
        )

    def post(self, text, image_path=None, **kwargs):
        """
        Post a status to Mastodon. Supports optional image upload.
        Returns (success: bool, result_message: str).
        """
        if not self.enabled:
            return (False, "MastodonPoster is disabled — missing credentials")

        try:
            mastodon = self._get_client()
            media_ids = None

            if image_path and os.path.isfile(image_path):
                media = mastodon.media_post(
                    image_path,
                    description=kwargs.get("alt_text", ""),
                )
                media_ids = [media["id"]]
                log.info(f"Mastodon: uploaded media {media['id']} from {image_path}")

            status = mastodon.status_post(
                text,
                media_ids=media_ids,
                visibility=kwargs.get("visibility", "public"),
            )
            status_id = status["id"]
            status_url = status["url"]
            log.info(f"Mastodon: posted status {status_id} — {status_url}")
            return (True, status_url)

        except Exception as e:
            log.error(f"Mastodon: post failed — {e}")
            return (False, str(e))
