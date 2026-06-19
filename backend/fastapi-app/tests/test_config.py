from app.config import Settings


def test_jwt_secret_accepts_legacy_secret_key_alias(monkeypatch) -> None:
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    settings = Settings(_env_file=None, SECRET_KEY="x" * 40)

    assert settings.jwt_secret == "x" * 40


def test_primary_database_url_prefers_supabase(monkeypatch) -> None:
    monkeypatch.delenv("SUPABASE_DB_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    supabase_url = (
        "postgresql://postgres:[password]@"
        "db.jmvgdqomvnkfgknmgwxp.supabase.co:5432/postgres"
    )
    settings = Settings(
        _env_file=None,
        jwt_secret="x" * 40,
        supabase_db_url=supabase_url,
        database_url="postgresql+asyncpg://postgres:postgres@localhost:5432/youandinotai",
    )

    assert settings.primary_database_url == supabase_url


def test_primary_database_url_falls_back_to_database_url(monkeypatch) -> None:
    monkeypatch.delenv("SUPABASE_DB_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    fallback_url = "postgresql+asyncpg://postgres:postgres@192.168.0.15:5432/youandinotai"
    settings = Settings(
        _env_file=None,
        jwt_secret="x" * 40,
        supabase_db_url="",
        database_url=fallback_url,
    )

    assert settings.primary_database_url == fallback_url
