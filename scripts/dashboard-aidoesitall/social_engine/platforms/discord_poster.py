"""
Discord Poster — Posts to a Discord channel via webhook URL.
Pure requests implementation, no external Discord library needed.
"""
import json
import logging
import os
import urllib.request

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")


class DiscordPoster(BasePoster):
    name = "discord"
    method = "api"

    def _check_config(self):
        self._webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

        if not self._webhook_url:
            log.warning("DiscordPoster disabled — missing env var: DISCORD_WEBHOOK_URL")
            self.enabled = False

    def post(self, text, image_path=None, **kwargs):
        """
        Post a message to Discord via webhook.
        Supports optional image as an embed.
        Returns (success: bool, result_message: str).
        """
        if not self.enabled:
            return (False, "DiscordPoster is disabled — missing credentials")

        try:
            payload = {"content": text}

            # If an image URL is provided via kwargs, attach as embed
            image_url = kwargs.get("image_url")
            if image_url:
                payload["embeds"] = [
                    {
                        "image": {"url": image_url},
                    }
                ]

            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self._webhook_url,
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            with urllib.request.urlopen(req) as resp:
                status_code = resp.status
                # Discord webhooks return 204 No Content on success
                if status_code in (200, 204):
                    log.info("Discord: posted message via webhook")
                    return (True, f"webhook OK ({status_code})")
                else:
                    body = resp.read().decode("utf-8")
                    log.warning(f"Discord: unexpected status {status_code} — {body}")
                    return (False, f"HTTP {status_code}: {body}")

        except Exception as e:
            log.error(f"Discord: post failed — {e}")
            return (False, str(e))
