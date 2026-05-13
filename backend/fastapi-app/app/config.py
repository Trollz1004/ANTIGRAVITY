"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import AliasChoices, Field
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
    square_location_id: str = ""
    square_bot_shield_payment_link: str = (
        ""  # Pre-configured Square payment link for $1 Bot-Shield
    )
    square_subscription_payment_link: str = (
        ""  # Pre-configured Square payment link for subscriptions
    )
    square_payment_webhook_signature_key: str = ""
    square_payment_webhook_notification_url: str = ""
    square_booking_webhook_signature_key: str = ""
    square_booking_webhook_notification_url: str = ""
    square_webhook_signature_key: str = ""
    square_webhook_notification_url: str = ""
    square_webhook_verify_signature: bool = True
    square_booking_log_dir: str = ""
    square_api_base_url: str = "https://connect.squareup.com"
    square_api_version: str = "2026-01-22"
    app_url: str = "https://youandinotai.com"
    email_from_address: str = ""
    email_from_name: str = "YouAndINotAI"
    email_reply_to: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_ssl: bool = False
    smtp_use_starttls: bool = True
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    support_operator_emails: str = ""
    support_openclaw_url: str = ""
    support_openclaw_timeout_seconds: float = 15.0
    support_ollama_base_url: str = ""
    support_ollama_model: str = "qwen2.5:7b"
    support_ollama_timeout_seconds: float = 10.0
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-pro"
    kimi_api_key: str = ""
    kimi_model: str = "kimi-2.6"
    daily_api_key: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""

    # Monitoring settings
    sentry_dsn: str = ""
    prometheus_port: int = 8000

    jwt_secret: str = Field(
        default="",
        validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"),
        description="REQUIRED. JWT signing secret. Must be set via JWT_SECRET env var. No fallback.",
    )
    metrics_api_key: str = ""  # Separate key for /metrics — NOT the JWT secret
    beta_access_codes: str = ""
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: str = (
        "https://youandinotai.com,http://localhost:3000,http://localhost:5173"
    )
    registration_rate_limit_per_minute: int = 10
    auth_rate_limit_per_minute: int = 10
    verify_rate_limit_per_minute: int = 5
    waitlist_rate_limit_per_minute: int = 5
    rate_limit_trusted_proxies: str = "127.0.0.1/32,::1/128"
    match_top_k: int = 5
    match_candidate_limit: int = 50

    # File upload settings
    upload_max_size_mb: int = 10
    upload_allowed_types: str = (
        "image/jpeg,image/png,image/gif,application/pdf,text/plain"
    )
    upload_storage_path: str = "/var/secure_uploads"
    clamav_enabled: bool = False

    @property
    def upload_allowed_types_list(self) -> list[str]:
        return [t.strip() for t in self.upload_allowed_types.split(",") if t.strip()]

    @property
    def upload_max_size_bytes(self) -> int:
        return self.upload_max_size_mb * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]

    @property
    def rate_limit_trusted_proxy_list(self) -> list[str]:
        return [
            proxy.strip()
            for proxy in self.rate_limit_trusted_proxies.split(",")
            if proxy.strip()
        ]

    @property
    def beta_access_code_list(self) -> list[str]:
        return [
            code.strip().upper()
            for code in self.beta_access_codes.split(",")
            if code.strip()
        ]

    @property
    def support_operator_email_list(self) -> list[str]:
        return [
            email.strip().lower()
            for email in self.support_operator_emails.split(",")
            if email.strip()
        ]


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
