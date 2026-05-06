from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SQUARE_ACCESS_TOKEN: str = ""
    # CORS origins — local dev, same-origin :8787, and the Sabretooth LAN IP.
    # ALLOWED_ORIGIN_REGEX matches any RFC1918 LAN host on :8787 so cross-machine
    # access from a phone or T5500 admin browser works without env changes.
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3100",
        "http://localhost:8787",
        "http://127.0.0.1:8787",
        "http://192.168.0.8:8787",
        "http://192.168.0.15:8787",
    ]
    ALLOWED_ORIGIN_REGEX: str = (
        r"^http://"
        r"(localhost|127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})"
        r"(:\d+)?$"
    )
    RESERVE_PERCENT: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
