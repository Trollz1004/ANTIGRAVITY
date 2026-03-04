"""
Telegram Poster — Posts to a Telegram channel via Bot API.
Uses urllib.request only (no external dependencies).
"""
import json
import logging
import os
import urllib.request
import urllib.parse

from social_engine.platforms.base_poster import BasePoster

log = logging.getLogger("social-engine")

TELEGRAM_API_BASE = "https://api.telegram.org"


class TelegramPoster(BasePoster):
    name = "telegram"
    method = "api"

    def _check_config(self):
        self._bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self._channel_id = os.getenv("TELEGRAM_MARKETING_CHANNEL_ID")

        missing = []
        if not self._bot_token:
            missing.append("TELEGRAM_BOT_TOKEN")
        if not self._channel_id:
            missing.append("TELEGRAM_MARKETING_CHANNEL_ID")

        if missing:
            log.warning(f"TelegramPoster disabled — missing env vars: {', '.join(missing)}")
            self.enabled = False

    def _api_call(self, method, payload):
        """Make a Telegram Bot API call."""
        url = f"{TELEGRAM_API_BASE}/bot{self._bot_token}/{method}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def post(self, text, image_path=None, **kwargs):
        """
        Send a message to the marketing Telegram channel.
        Supports optional image via photo URL (image_path as URL or local path via sendPhoto).
        Returns (success: bool, result_message: str).
        """
        if not self.enabled:
            return (False, "TelegramPoster is disabled — missing credentials")

        try:
            parse_mode = kwargs.get("parse_mode", "HTML")

            if image_path and image_path.startswith("http"):
                # Send photo with caption
                payload = {
                    "chat_id": self._channel_id,
                    "photo": image_path,
                    "caption": text,
                    "parse_mode": parse_mode,
                }
                result = self._api_call("sendPhoto", payload)
            else:
                # Send text message
                payload = {
                    "chat_id": self._channel_id,
                    "text": text,
                    "parse_mode": parse_mode,
                    "disable_web_page_preview": kwargs.get("disable_preview", False),
                }
                result = self._api_call("sendMessage", payload)

            if result.get("ok"):
                message_id = result["result"]["message_id"]
                log.info(f"Telegram: sent message {message_id} to {self._channel_id}")
                return (True, str(message_id))
            else:
                description = result.get("description", "unknown error")
                log.warning(f"Telegram: API returned not ok — {description}")
                return (False, description)

        except Exception as e:
            log.error(f"Telegram: post failed — {e}")
            return (False, str(e))
