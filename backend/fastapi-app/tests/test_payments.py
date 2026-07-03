import importlib


def _reload_payments():
    import app.payments as payments

    return importlib.reload(payments)


def test_bot_shield_link_uses_configured_env(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv(
        "SQUARE_BOT_SHIELD_PAYMENT_LINK", "https://square.link/u/prod-bot"
    )
    monkeypatch.delenv("SQUARE_BOT_SHIELD_LINK", raising=False)

    payments = _reload_payments()

    assert payments.BOT_SHIELD_PAYMENT_LINK == "https://square.link/u/prod-bot"
    assert payments.PLAN_LINKS["bot_shield"] == "https://square.link/u/prod-bot"


def test_bot_shield_link_is_guarded_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("SQUARE_BOT_SHIELD_PAYMENT_LINK", raising=False)
    monkeypatch.delenv("SQUARE_BOT_SHIELD_LINK", raising=False)

    payments = _reload_payments()

    assert payments.BOT_SHIELD_PAYMENT_LINK == ""
    assert payments.PLAN_LINKS["bot_shield"] == ""


def test_bot_shield_link_falls_back_outside_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("SQUARE_BOT_SHIELD_PAYMENT_LINK", raising=False)
    monkeypatch.delenv("SQUARE_BOT_SHIELD_LINK", raising=False)

    payments = _reload_payments()

    assert payments.BOT_SHIELD_PAYMENT_LINK == "https://square.link/u/Qc5mxUy7"
    assert payments.PLAN_LINKS["bot_shield"] == "https://square.link/u/Qc5mxUy7"
