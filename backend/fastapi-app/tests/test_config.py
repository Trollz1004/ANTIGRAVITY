from app.config import Settings


def test_jwt_secret_accepts_legacy_secret_key_alias(monkeypatch) -> None:
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.delenv("SECRET_KEY", raising=False)
    settings = Settings(_env_file=None, SECRET_KEY="x" * 40)

    assert settings.jwt_secret == "x" * 40
