"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the FastAPI backend."""

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "YouAndINotAI API"
    app_version: str = "0.1.0"
    app_env: str = "development"

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/youandinotai"
    )
    # DEPRECATED: Stripe removed — Square is the sole payment processor.
    # stripe_secret_key: str = ""  # REMOVED — Iron Wall migration to Square
    # stripe_webhook_secret: str = ""  # REMOVED — Iron Wall migration to Square
    square_access_token: str = ""
    square_bot_shield_payment_link: str = ""  # Pre-configured Square payment link for $1 Bot-Shield
    square_subscription_payment_link: str = ""  # Pre-configured Square payment link for subscriptions
    square_webhook_signature_key: str = ""
    square_webhook_notification_url: str = ""
    square_webhook_verify_signature: bool = True
    square_booking_log_dir: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-pro"
    kimi_api_key: str = ""
    kimi_model: str = "kimi-2.6"

    jwt_secret: str = Field(
        default="",
        description="REQUIRED. JWT signing secret. Must be set via JWT_SECRET env var. No fallback.",
    )
    metrics_api_key: str = ""  # Separate key for /metrics — NOT the JWT secret
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: str = "https://youandinotai.com,http://localhost:3000,http://localhost:5173"
    registration_rate_limit_per_minute: int = 10
    match_top_k: int = 5
    match_candidate_limit: int = 50

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    s = Settings()
    # SECURITY: Fail-fast if JWT_SECRET is not set or is the old insecure default.
    # The Iron Wall demands no backdoors.
    if not s.jwt_secret or s.jwt_secret in ("change-me-in-production", ""):
        raise RuntimeError(
            "FATAL: JWT_SECRET environment variable is not set or uses an insecure default. "
            "The application WILL NOT start without a secure JWT secret. "
            "Set JWT_SECRET in your .env file or environment variables."
        )
    if len(s.jwt_secret) < 32:
        raise RuntimeError(
            "FATAL: JWT_SECRET must be at least 32 characters long for security. "
            "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
        )
    return s
