"""Creator self-serve numbers: GET /api/v1/affiliates/public-stats?code=<slug>.

A creator can see their own sign-ups, verified count, payment count, gross
cents and the 50 percent owed cents without an account. The contract:

- slug validated against the short-name pattern ``^[a-z0-9-]{3,30}$``
- counts and cents only: never a name, email or account id
- an unknown code answers exactly like a code with zero activity
- rate limited per client IP, invalid slugs included
- read-only: no payment code and no payment table is touched
"""

import uuid
from datetime import date, datetime, timezone

import pytest

from app import rate_limit_redis
from app.config import get_settings
from app.models import RevenueAllocation, User
from tests.helpers import seed

URL = "/api/v1/affiliates/public-stats"

EXPECTED_KEYS = {
    "referral_code",
    "signups_count",
    "verified_count",
    "payments_count",
    "gross_cents",
    "owed_cents",
}

# Distinctive values: if any of these ever shows up in a response, PII leaked.
_PII_MARKERS = (
    "alpha-secret-person@example.com",
    "Alpha Secret Person",
    "alpha-verified@example.com",
    "Alpha Verified Person",
    "beta-private@example.com",
    "Beta Private Person",
)


@pytest.fixture(autouse=True)
def _fresh_rate_limit_state(monkeypatch):
    rate_limit_redis._test_rate_limit_counts.clear()
    get_settings.cache_clear()
    yield
    rate_limit_redis._test_rate_limit_counts.clear()
    get_settings.cache_clear()


def _user(email: str, name: str, *, code: str | None, verified: bool) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed_pw",
        display_name=name,
        date_of_birth=date(1990, 1, 1),
        bot_shield_verified=verified,
        referral_code=code,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def _payment(
    user: User,
    tag: str,
    cents: int,
    *,
    status: str = "reserved",
    payer_type: str = "customer",
) -> RevenueAllocation:
    return RevenueAllocation(
        user_id=user.id,
        source_event_id=f"evt_{tag}",
        square_payment_id=f"pay_{tag}",
        payment_tier="founding_member",
        gross_amount_cents=cents,
        reserve_amount_cents=0,
        operating_amount_cents=cents,
        status=status,
        payer_type=payer_type,
    )


def _seed_creator_alpha(db_session_factory) -> None:
    alpha_one = _user(
        "alpha-secret-person@example.com",
        "Alpha Secret Person",
        code="creator-alpha",
        verified=True,
    )
    alpha_two = _user(
        "alpha-verified@example.com",
        "Alpha Verified Person",
        code="Creator-Alpha ",  # stored with case and trailing space drift
        verified=False,
    )
    beta = _user(
        "beta-private@example.com",
        "Beta Private Person",
        code="creator-beta",
        verified=True,
    )
    seed(alpha_one, alpha_two, beta, db_session_factory=db_session_factory)
    seed(
        _payment(alpha_one, "a1_check", 100),
        _payment(alpha_one, "a1_sub", 1499),
        _payment(alpha_two, "a2_check", 101),
        # Must not count: refunded, founder test, and another creator's money.
        _payment(alpha_one, "a1_refunded", 1499, status="refunded"),
        _payment(alpha_one, "a1_founder", 100, payer_type="founder_test"),
        _payment(beta, "b1_sub", 1499),
        db_session_factory=db_session_factory,
    )


def test_public_stats_needs_no_login_and_returns_exact_numbers(
    client, db_session_factory
):
    _seed_creator_alpha(db_session_factory)

    resp = client.get(URL, params={"code": "creator-alpha"})

    assert resp.status_code == 200, resp.text
    assert resp.json() == {
        "referral_code": "creator-alpha",
        "signups_count": 2,
        "verified_count": 1,
        "payments_count": 3,
        "gross_cents": 1700,
        "owed_cents": 850,
    }


def test_public_stats_owed_is_half_of_gross_rounded_down(client, db_session_factory):
    user = _user("odd@example.com", "Odd", code="odd-creator", verified=True)
    seed(user, db_session_factory=db_session_factory)
    seed(_payment(user, "odd_1", 101), db_session_factory=db_session_factory)

    body = client.get(URL, params={"code": "odd-creator"}).json()

    assert body["gross_cents"] == 101
    assert body["owed_cents"] == 50


def test_public_stats_never_exposes_name_email_or_account_id(
    client, db_session_factory
):
    _seed_creator_alpha(db_session_factory)

    resp = client.get(URL, params={"code": "creator-alpha"})

    body = resp.json()
    assert set(body) == EXPECTED_KEYS
    for key, value in body.items():
        if key == "referral_code":
            assert value == "creator-alpha"
        else:
            assert isinstance(value, int) and not isinstance(value, bool), key
    for marker in _PII_MARKERS:
        assert marker not in resp.text
    assert "@" not in resp.text
    assert not {"id", "user_id", "email", "name", "display_name"} & set(body)


def test_public_stats_code_is_case_insensitive_and_answers_lowercase(
    client, db_session_factory
):
    _seed_creator_alpha(db_session_factory)

    body = client.get(URL, params={"code": "CREATOR-Alpha"}).json()

    assert body["referral_code"] == "creator-alpha"
    assert body["signups_count"] == 2


def test_unknown_code_answers_exactly_like_zero_activity(client, db_session_factory):
    _seed_creator_alpha(db_session_factory)
    # A real code that has sign-ups but no payments and no verified members.
    quiet = _user("quiet@example.com", "Quiet", code="quiet-creator", verified=False)
    seed(quiet, db_session_factory=db_session_factory)

    unknown = client.get(URL, params={"code": "nobody-here"})
    other_unknown = client.get(URL, params={"code": "also-missing"})
    quiet_resp = client.get(URL, params={"code": "quiet-creator"})

    assert unknown.status_code == other_unknown.status_code == 200
    assert quiet_resp.status_code == 200
    assert set(unknown.json()) == set(other_unknown.json()) == EXPECTED_KEYS
    assert set(quiet_resp.json()) == EXPECTED_KEYS
    assert unknown.json() == {
        "referral_code": "nobody-here",
        "signups_count": 0,
        "verified_count": 0,
        "payments_count": 0,
        "gross_cents": 0,
        "owed_cents": 0,
    }
    assert unknown.headers["content-type"] == quiet_resp.headers["content-type"]
    # Same number of header lines: nothing extra reveals that a code exists.
    assert sorted(unknown.headers) == sorted(quiet_resp.headers)


@pytest.mark.parametrize(
    "bad_code",
    [
        "ab",  # too short
        "x" * 31,  # too long
        "has space",
        "under_score",
        "semi;colon",
        "a/b/c",
        "dr0p--table'",
        "%00null",
        "creator.alpha",
        "",
    ],
)
def test_public_stats_rejects_slugs_outside_short_name_pattern(client, bad_code):
    resp = client.get(URL, params={"code": bad_code})

    assert resp.status_code == 422, resp.text
    assert "signups_count" not in resp.text


def test_public_stats_requires_a_code(client):
    assert client.get(URL).status_code == 422


def test_public_stats_accepts_slug_length_boundaries(client):
    assert client.get(URL, params={"code": "abc"}).status_code == 200
    assert client.get(URL, params={"code": "a" * 30}).status_code == 200


def test_public_stats_is_rate_limited_per_ip(client, monkeypatch):
    monkeypatch.setenv("PUBLIC_STATS_RATE_LIMIT_PER_MINUTE", "3")
    get_settings.cache_clear()

    for _ in range(3):
        assert client.get(URL, params={"code": "creator-alpha"}).status_code == 200

    blocked = client.get(URL, params={"code": "creator-alpha"})
    assert blocked.status_code == 429
    assert "rate limit" in blocked.text.lower()
    assert "signups_count" not in blocked.text

    # A different client address has its own allowance.
    monkeypatch.setattr(rate_limit_redis, "_client_ip", lambda _request: "203.0.113.9")
    assert client.get(URL, params={"code": "creator-alpha"}).status_code == 200


def test_public_stats_rate_limit_also_counts_invalid_slugs(client, monkeypatch):
    """Guessing junk must not be a free way to probe the endpoint."""
    monkeypatch.setenv("PUBLIC_STATS_RATE_LIMIT_PER_MINUTE", "2")
    get_settings.cache_clear()

    assert client.get(URL, params={"code": "!!"}).status_code == 422
    assert client.get(URL, params={"code": "??"}).status_code == 422
    assert client.get(URL, params={"code": "creator-alpha"}).status_code == 429


def test_public_stats_is_read_only(client):
    for method in ("post", "put", "patch", "delete"):
        resp = getattr(client, method)(URL, params={"code": "creator-alpha"})
        assert resp.status_code == 405, method
