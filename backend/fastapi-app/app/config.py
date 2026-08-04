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
    supabase_db_url: str = Field(
        default="",
        description="Primary Supabase Postgres URL. Falls back to DATABASE_URL when unset.",
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
    # Alternate rails for dating surface (NO STRIPE — Iron Wall)
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_api_base_url: str = "https://api-m.paypal.com"
    paypal_webhook_id: str = ""
    cashapp_cashtag: str = ""  # e.g. $YouAndINotAI — display / deep-link assist
    cashapp_checkout_base_url: str = ""  # optional hosted Cash App Business checkout
    # Public PayPal managed QR receive links (not secrets — customer-facing)
    paypal_qr_primary_url: str = (
        "https://www.paypal.com/qrcodes/managed/f5e4ef25-cf72-45e5-b093-21263d76eeec"
    )
    paypal_qr_tip_jar_url: str = (
        "https://www.paypal.com/qrcodes/managed/e1b0e1e7-ff93-4173-92ac-c2a2c23795ca"
    )
    plaid_client_id: str = ""
    plaid_secret: str = ""
    plaid_env: str = "sandbox"  # sandbox | development | production
    plaid_products: str = "auth,identity"
    plaid_country_codes: str = "US"
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
    whatsapp_phone_id: str = ""
    whatsapp_token: str = ""
    whatsapp_to: str = ""
    whatsapp_owner_phone: str = ""
    whatsapp_webhook_verify_token: str = ""
    whatsapp_app_secret: str = ""
    whatsapp_api_version: str = "v21.0"
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

    # -------------------------------------------------------------------------
    # ClawX 6-AI Council Integration
    # -------------------------------------------------------------------------
    clawx_enabled: bool = False
    clawx_base_url: str = "https://api.clawx.example.com"
    clawx_agent_keys: str = "{}"  # JSON dict of agent_name: api_key

    # Database connection pooling settings
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800

    @property
    def primary_database_url(self) -> str:
        """Return Supabase Postgres when configured, otherwise the local/T5500 DB."""

        return self.supabase_db_url or self.database_url

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

    # -------------------------------------------------------------------------
    # CDN / static asset delivery
    # -------------------------------------------------------------------------
    # CDN base URL for serving static assets (fingerprinted JS/CSS/images).
    # When set, the frontend Vite build uses this as the asset origin.
    # Example: "https://cdn.youandinotai.com" or "https://pub-xxxxx.r2.dev"
    cdn_base_url: str = ""
    # Whether to use the CDN base URL for asset references.
    # Set to true in production when CDN is configured.
    cdn_enabled: bool = False

    # -------------------------------------------------------------------------
    # Redis
    # -------------------------------------------------------------------------
    redis_url: str = "redis://localhost:6379/0"
    redis_max_connections: int = 20
    redis_cache_default_ttl: int = 300
    redis_session_ttl: int = 3600
    redis_rate_limit_window: int = 60

    cors_origins: str = (
        "https://youandinotai.com,http://localhost:3000,http://localhost:5173,http://localhost:8000,http://[IP_ADDRESS]:8000"
    )
    registration_rate_limit_per_minute: int = 10
    auth_rate_limit_per_minute: int = 10
    verify_rate_limit_per_minute: int = 5
    waitlist_rate_limit_per_minute: int = 5
    rate_limit_trusted_proxies: str = "127.0.0.1/32,::1/128"
    match_top_k: int = 5
    match_candidate_limit: int = 50

    # Request size limits (DoS protection)
    max_request_body_size: int = 1_048_576  # 1 MB default for JSON bodies
    max_file_upload_size: int = 10_485_760  # 10 MB for file uploads
    max_json_depth: int = 10  # max nested object/array levels

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
