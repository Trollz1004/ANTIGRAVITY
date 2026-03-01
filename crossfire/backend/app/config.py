from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "CROSSFIRE"
    database_url: str = f"sqlite+aiosqlite:///{Path(__file__).parent.parent / 'data' / 'crossfire.db'}"

    # eBay API (Phase 2)
    ebay_app_id: str = ""
    ebay_cert_id: str = ""
    ebay_dev_id: str = ""
    ebay_user_token: str = ""
    ebay_sandbox: bool = False

    # Etsy API (Phase 5)
    etsy_api_key: str = ""
    etsy_api_secret: str = ""

    # OpenClaw (optional)
    openclaw_gateway: str = "http://127.0.0.1:18789"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
