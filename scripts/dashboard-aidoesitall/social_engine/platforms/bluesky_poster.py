"""
Bluesky Poster — Posts to Bluesky via the atproto library.
"""
import logging
import os

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class BlueskyPoster(BasePoster):
    name = "bluesky"
    method = "api"

    def _check_config(self):
        self._handle = os.getenv("BLUESKY_HANDLE")
        self._app_password = os.getenv("BLUESKY_APP_PASSWORD")

        missing = []
        if not self._handle:
            missing.append("BLUESKY_HANDLE")
        if not self._app_password:
            missing.append("BLUESKY_APP_PASSWORD")

        if missing:
            log.warning(f"BlueskyPoster disabled — missing env vars: {', '.join(missing)}")
            self.enabled = False

    def _get_client(self):
        """Build and return authenticated Bluesky client."""
        from atproto import Client

        client = Client()
        client.login(self._handle, self._app_password)
        return client

    def post(self, text, image_path=None, **kwargs):
        """
        Post to Bluesky. Supports optional image upload.
        Returns (success: bool, result_message: str).
        """
        if not self.enabled:
            return (False, "BlueskyPoster is disabled — missing credentials")

        try:
            client = self._get_client()

            if image_path and os.path.isfile(image_path):
                with open(image_path, "rb") as f:
                    image_data = f.read()
                upload = client.upload_blob(image_data)
                embed = {
                    "$type": "app.bsky.embed.images",
                    "images": [
                        {
                            "alt": kwargs.get("alt_text", ""),
                            "image": upload.blob,
                        }
                    ],
                }
                response = client.send_post(text=text, embed=embed)
            else:
                response = client.send_post(text=text)

            post_uri = response.uri
            log.info(f"Bluesky: posted — {post_uri}")
            return (True, post_uri)

        except Exception as e:
            log.error(f"Bluesky: post failed — {e}")
            return (False, str(e))
