"""Referral attribution and read-only affiliate counting tests.

Covers:
1. Email sign-up referral_code persistence and non-overwrite.
2. Google sign-up referral_code persistence on account creation only, never
   overwriting an existing user's referral_code.
3. Read-only founder/admin affiliate counts endpoint (/api/v1/metrics/affiliates)
   refusing non-founders and returning exact sign-ups, $1 check passes,
   completed non-refunded payment counts/gross cents, and 50% owed cents.
"""

import asyncio
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select

from app.auth import create_access_token, hash_password
from app.config import get_settings
from app.models import RevenueAllocation, User


def _valid_payload(**overrides):
    payload = {
        "email": "ref-attribution@example.com",
        "password": "password123",
        "display_name": "Ref Test",
        "date_of_birth": "1990-01-01",
        "accepted_terms": True,
        "accepted_cookie_policy": True,
        "confirmed_over_18": True,
    }
    payload.update(overrides)
    return payload


def test_register_without_referral_code_still_succeeds(client):
    """Omitting referral_code must not break registration."""
    response = client.post("/api/v1/auth/register", json=_valid_payload())

    assert response.status_code in (200, 201), response.text
    assert response.json()["access_token"]
    assert response.json()["user_id"]


def test_register_accepts_referral_code_and_persists_it(client, db_session_factory):
    """A supplied referral_code is accepted and stored on the user record."""
    email = "ref-with-code@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json=_valid_payload(email=email, referral_code="bot-slayer"),
    )

    assert response.status_code in (200, 201), response.text
    user_id = uuid.UUID(response.json()["user_id"])

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(select(User).where(User.id == user_id))

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.referral_code == "bot-slayer"

    # Attempting to register the same email with a different referral_code must fail (409) and never overwrite
    duplicate_resp = client.post(
        "/api/v1/auth/register",
        json=_valid_payload(email=email, referral_code="overwrite-attempt"),
    )
    assert duplicate_resp.status_code == 409, duplicate_resp.text

    user_after = asyncio.run(fetch_user())
    assert user_after is not None
    assert user_after.referral_code == "bot-slayer"


def test_register_referral_code_is_optional_and_null_when_absent(
    client, db_session_factory
):
    """No referral_code means the stored value is NULL, not an empty string."""
    email = "ref-no-code@example.com"
    response = client.post("/api/v1/auth/register", json=_valid_payload(email=email))

    assert response.status_code in (200, 201), response.text
    user_id = uuid.UUID(response.json()["user_id"])

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(select(User).where(User.id == user_id))

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.referral_code is None


def test_register_rejects_overlong_referral_code(client):
    """referral_code is bounded to 64 chars."""
    response = client.post(
        "/api/v1/auth/register",
        json=_valid_payload(referral_code="x" * 65),
    )

    assert response.status_code == 422, response.text


def test_google_signup_accepts_and_persists_referral_code_on_new_account(
    client, db_session_factory, monkeypatch
):
    """Google sign-up saves referral_code when creating a new user account."""
    monkeypatch.setattr(
        "app.routers.auth.verify_google_token",
        lambda _token: {
            "email": "google-new-ref@example.com",
            "name": "Google New Ref",
            "sub": "google-sub-new-ref",
        },
    )

    response = client.post(
        "/api/v1/auth/google",
        json={
            "id_token": "valid-google-token",
            "date_of_birth": "1991-06-15",
            "referral_code": "creator-google-1",
        },
    )

    assert response.status_code == 200, response.text
    user_id = uuid.UUID(response.json()["user_id"])

    async def fetch_user() -> User | None:
        async with db_session_factory() as session:
            return await session.scalar(select(User).where(User.id == user_id))

    user = asyncio.run(fetch_user())
    assert user is not None
    assert user.referral_code == "creator-google-1"


def test_google_signin_never_overwrites_existing_referral_code(
    client, db_session_factory, monkeypatch
):
    """Existing accounts keep their original referral_code (or NULL) on Google sign-in."""
    existing_with_code_id = uuid.uuid4()
    existing_without_code_id = uuid.uuid4()

    async def seed_users() -> None:
        async with db_session_factory() as session:
            session.add_all(
                [
                    User(
                        id=existing_with_code_id,
                        email="existing-coded@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Existing Coded",
                        date_of_birth=date(1988, 3, 10),
                        adult_verified_at=datetime.now(timezone.utc),
                        referral_code="first-creator",
                    ),
                    User(
                        id=existing_without_code_id,
                        email="existing-nocode@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Existing NoCode",
                        date_of_birth=date(1989, 7, 22),
                        adult_verified_at=datetime.now(timezone.utc),
                        referral_code=None,
                    ),
                ]
            )
            await session.commit()

    asyncio.run(seed_users())

    # 1. Existing user with 'first-creator' logs in via Google carrying 'second-creator'
    monkeypatch.setattr(
        "app.routers.auth.verify_google_token",
        lambda _token: {
            "email": "existing-coded@example.com",
            "name": "Existing Coded",
            "sub": "google-sub-existing-1",
        },
    )
    resp1 = client.post(
        "/api/v1/auth/google",
        json={
            "id_token": "token-1",
            "referral_code": "second-creator",
        },
    )
    assert resp1.status_code == 200, resp1.text

    # 2. Existing user created without a code logs in via Google carrying 'late-creator'
    monkeypatch.setattr(
        "app.routers.auth.verify_google_token",
        lambda _token: {
            "email": "existing-nocode@example.com",
            "name": "Existing NoCode",
            "sub": "google-sub-existing-2",
        },
    )
    resp2 = client.post(
        "/api/v1/auth/google",
        json={
            "id_token": "token-2",
            "referral_code": "late-creator",
        },
    )
    assert resp2.status_code == 200, resp2.text

    async def fetch_codes() -> tuple[str | None, str | None]:
        async with db_session_factory() as session:
            u1 = await session.scalar(
                select(User).where(User.id == existing_with_code_id)
            )
            u2 = await session.scalar(
                select(User).where(User.id == existing_without_code_id)
            )
            return (
                u1.referral_code if u1 else None,
                u2.referral_code if u2 else "missing",
            )

    code1, code2 = asyncio.run(fetch_codes())
    assert code1 == "first-creator"
    assert code2 is None


def test_affiliate_counts_endpoint_refuses_non_founder(
    client, db_session_factory, monkeypatch
):
    """Non-operator members and unauthenticated callers are refused with 401/403."""
    monkeypatch.setenv("SUPPORT_OPERATOR_EMAILS", "founder@youandinotai.com")
    get_settings.cache_clear()

    non_founder_id = uuid.uuid4()

    async def seed_member() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=non_founder_id,
                    email="regular-member@example.com",
                    password_hash=hash_password("password123"),
                    display_name="Regular Member",
                    date_of_birth=date(1992, 4, 12),
                    adult_verified_at=datetime.now(timezone.utc),
                    bot_shield_verified=True,
                    subscription_tier="founding_member",
                    subscription_active=True,
                    member_badge=None,
                )
            )
            await session.commit()

    asyncio.run(seed_member())

    try:
        # Unauthenticated request
        unauth_resp = client.get("/api/v1/metrics/affiliates")
        assert unauth_resp.status_code in (401, 403), unauth_resp.text

        # Authenticated non-operator request
        member_token = create_access_token(str(non_founder_id))
        member_resp = client.get(
            "/api/v1/metrics/affiliates",
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert member_resp.status_code == 403, member_resp.text
    finally:
        get_settings.cache_clear()


def test_affiliate_counts_endpoint_refuses_founder_badge_not_on_operator_list(
    client, db_session_factory, monkeypatch
):
    """A member with the Founder badge who is not on support_operator_email_list gets 403."""
    monkeypatch.setenv("SUPPORT_OPERATOR_EMAILS", "founder@youandinotai.com")
    get_settings.cache_clear()

    badged_member_id = uuid.uuid4()

    async def seed_badged_member() -> None:
        async with db_session_factory() as session:
            session.add(
                User(
                    id=badged_member_id,
                    email="beta-founder-badge@example.com",
                    password_hash=hash_password("password123"),
                    display_name="Beta Founder Badge",
                    date_of_birth=date(1990, 8, 20),
                    adult_verified_at=datetime.now(timezone.utc),
                    bot_shield_verified=True,
                    subscription_tier="founding_member",
                    subscription_active=True,
                    member_badge="Founder",
                )
            )
            await session.commit()

    asyncio.run(seed_badged_member())

    try:
        badged_token = create_access_token(str(badged_member_id))
        resp = client.get(
            "/api/v1/metrics/affiliates",
            headers={"Authorization": f"Bearer {badged_token}"},
        )
        assert resp.status_code == 403, resp.text
    finally:
        get_settings.cache_clear()


def test_affiliate_counts_endpoint_matches_seeded_rows_and_zeros_inactive_code(
    client, db_session_factory, monkeypatch
):
    """Operator endpoint returns exact sign-ups, $1 checks, completed payments, gross cents, and 50% owed cents."""
    monkeypatch.setenv("SUPPORT_OPERATOR_EMAILS", "founder@youandinotai.com")
    get_settings.cache_clear()

    founder_id = uuid.uuid4()
    u_alpha_1 = uuid.uuid4()
    u_alpha_2 = uuid.uuid4()
    u_alpha_3 = uuid.uuid4()
    u_beta_1 = uuid.uuid4()
    u_unattributed = uuid.uuid4()

    async def seed_data() -> None:
        async with db_session_factory() as session:
            session.add_all(
                [
                    User(
                        id=founder_id,
                        email="founder@youandinotai.com",
                        password_hash=hash_password("password123"),
                        display_name="Josh Operator",
                        date_of_birth=date(1985, 1, 1),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=True,
                        member_badge=None,
                    ),
                    # creator-alpha: 3 sign-ups, 2 passed $1 check
                    User(
                        id=u_alpha_1,
                        email="alpha1@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Alpha One",
                        date_of_birth=date(1990, 1, 1),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=True,
                        referral_code="creator-alpha",
                    ),
                    User(
                        id=u_alpha_2,
                        email="alpha2@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Alpha Two",
                        date_of_birth=date(1991, 2, 2),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=True,
                        referral_code="creator-alpha",
                    ),
                    User(
                        id=u_alpha_3,
                        email="alpha3@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Alpha Three",
                        date_of_birth=date(1993, 3, 3),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=False,
                        referral_code="creator-alpha",
                    ),
                    # creator-beta: 1 sign-up, 0 passed $1 check, 0 payments
                    User(
                        id=u_beta_1,
                        email="beta1@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Beta One",
                        date_of_birth=date(1994, 4, 4),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=False,
                        referral_code="creator-beta",
                    ),
                    # unattributed member with payment
                    User(
                        id=u_unattributed,
                        email="direct@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Direct User",
                        date_of_birth=date(1995, 5, 5),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=True,
                        referral_code=None,
                    ),
                ]
            )
            await session.flush()

            session.add_all(
                [
                    # Collected payment 1 for u_alpha_1 ($1.00 = 100c, 'reserved' set by reserve_revenue_allocation on COMPLETED webhook)
                    RevenueAllocation(
                        user_id=u_alpha_1,
                        source_event_id="evt_alpha_1_check",
                        square_payment_id="pay_alpha_1_check",
                        payment_tier="bot_shield",
                        gross_amount_cents=100,
                        reserve_amount_cents=0,
                        operating_amount_cents=100,
                        status="reserved",
                        payer_type="customer",
                    ),
                    # Collected payment 2 for u_alpha_1 ($14.99 = 1499c, 'reserved' set by reserve_revenue_allocation on COMPLETED webhook)
                    RevenueAllocation(
                        user_id=u_alpha_1,
                        source_event_id="evt_alpha_1_sub",
                        square_payment_id="pay_alpha_1_sub",
                        payment_tier="founding_member",
                        gross_amount_cents=1499,
                        reserve_amount_cents=0,
                        operating_amount_cents=1499,
                        status="reserved",
                        payer_type="customer",
                    ),
                    # Manually marked 'refunded' row — must NOT be counted
                    RevenueAllocation(
                        user_id=u_alpha_1,
                        source_event_id="evt_alpha_1_refunded",
                        square_payment_id="pay_alpha_1_refunded",
                        payment_tier="founding_member",
                        gross_amount_cents=1499,
                        reserve_amount_cents=0,
                        operating_amount_cents=1499,
                        status="refunded",
                        payer_type="customer",
                    ),
                    # Founder-test payment row — must NOT be counted as customer revenue
                    RevenueAllocation(
                        user_id=u_alpha_1,
                        source_event_id="evt_alpha_1_founder_test",
                        square_payment_id="pay_alpha_1_founder_test",
                        payment_tier="bot_shield",
                        gross_amount_cents=100,
                        reserve_amount_cents=0,
                        operating_amount_cents=100,
                        status="reserved",
                        payer_type="founder_test",
                    ),
                    # Collected payment 3 for u_alpha_2 ($1.01 = 101c so total gross is 1700c -> owed 850c)
                    RevenueAllocation(
                        user_id=u_alpha_2,
                        source_event_id="evt_alpha_2_check",
                        square_payment_id="pay_alpha_2_check",
                        payment_tier="bot_shield",
                        gross_amount_cents=101,
                        reserve_amount_cents=0,
                        operating_amount_cents=101,
                        status="reserved",
                        payer_type="customer",
                    ),
                    # Unattributed user payment — must NOT appear in referral counts
                    RevenueAllocation(
                        user_id=u_unattributed,
                        source_event_id="evt_direct_1",
                        square_payment_id="pay_direct_1",
                        payment_tier="bot_shield",
                        gross_amount_cents=100,
                        reserve_amount_cents=0,
                        operating_amount_cents=100,
                        status="reserved",
                        payer_type="customer",
                    ),
                ]
            )
            await session.commit()

    asyncio.run(seed_data())

    try:
        founder_token = create_access_token(str(founder_id))
        headers = {"Authorization": f"Bearer {founder_token}"}

        resp = client.get("/api/v1/metrics/affiliates", headers=headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()

        by_code = {item["referral_code"]: item for item in data["items"]}
        assert set(by_code.keys()) == {"creator-alpha", "creator-beta"}

        alpha = by_code["creator-alpha"]
        assert alpha["signups_count"] == 3
        assert alpha["verified_count"] == 2
        assert alpha["payments_count"] == 3
        assert alpha["gross_cents"] == 1700
        assert alpha["owed_cents"] == 850

        beta = by_code["creator-beta"]
        assert beta["signups_count"] == 1
        assert beta["verified_count"] == 0
        assert beta["payments_count"] == 0
        assert beta["gross_cents"] == 0
        assert beta["owed_cents"] == 0

        assert data["totals"] == {
            "codes_count": 2,
            "signups_count": 4,
            "verified_count": 2,
            "payments_count": 3,
            "gross_cents": 1700,
            "owed_cents": 850,
        }

        # Querying a code with zero activity returns zeros, never invented numbers
        empty_resp = client.get(
            "/api/v1/metrics/affiliates?code=unused-creator", headers=headers
        )
        assert empty_resp.status_code == 200, empty_resp.text
        empty_data = empty_resp.json()
        assert empty_data["items"] == [
            {
                "referral_code": "unused-creator",
                "signups_count": 0,
                "verified_count": 0,
                "payments_count": 0,
                "gross_cents": 0,
                "owed_cents": 0,
            }
        ]
    finally:
        get_settings.cache_clear()


def test_square_refund_webhook_marks_allocation_refunded_and_excludes_from_affiliate_counts(
    client, db_session_factory, monkeypatch
):
    """Completed Square payment increments creator counts; subsequent Square refund.updated (COMPLETED)
    or payment.updated (REFUNDED / refunded_money) marks RevenueAllocation.status='refunded'
    and excludes it from /api/v1/metrics/affiliates.
    """
    import json

    from tests.conftest import generate_square_signature

    sig_key = "test-square-signature"
    notif_url = "http://testserver/api/v1/webhooks/square-payment"
    monkeypatch.setenv("SUPPORT_OPERATOR_EMAILS", "founder@youandinotai.com")
    monkeypatch.setenv("SQUARE_WEBHOOK_VERIFY_SIGNATURE", "true")
    monkeypatch.setenv("SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY", sig_key)
    monkeypatch.setenv("SQUARE_PAYMENT_WEBHOOK_NOTIFICATION_URL", notif_url)
    get_settings.cache_clear()

    founder_id = uuid.uuid4()
    referred_user_id = uuid.uuid4()

    async def seed_users() -> None:
        async with db_session_factory() as session:
            session.add_all(
                [
                    User(
                        id=founder_id,
                        email="founder@youandinotai.com",
                        password_hash=hash_password("password123"),
                        display_name="Josh Operator",
                        date_of_birth=date(1985, 1, 1),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=True,
                    ),
                    User(
                        id=referred_user_id,
                        email="buyer-refund@example.com",
                        password_hash=hash_password("password123"),
                        display_name="Refund Buyer",
                        date_of_birth=date(1992, 6, 15),
                        adult_verified_at=datetime.now(timezone.utc),
                        bot_shield_verified=True,
                        referral_code="creator-refund-test",
                    ),
                ]
            )
            await session.commit()

    asyncio.run(seed_users())

    def post_signed_webhook(payload: dict):
        raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        sig = generate_square_signature(raw, sig_key, notif_url)
        return client.post(
            "/api/v1/webhooks/square-payment",
            headers={
                "Content-Type": "application/json",
                "x-square-hmacsha256-signature": sig,
            },
            content=raw,
        )

    try:
        founder_token = create_access_token(str(founder_id))
        headers = {"Authorization": f"Bearer {founder_token}"}

        # 1. Completed Founding Member payment ($14.99 = 1499c) via signed webhook
        pay1_completed = {
            "event_id": "evt_ref_pay_1_completed",
            "type": "payment.updated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "data": {
                "object": {
                    "payment": {
                        "id": "pay_ref_customer_1",
                        "status": "COMPLETED",
                        "amount_money": {"amount": 1499, "currency": "USD"},
                        "buyer_email_address": "buyer-refund@example.com",
                        "note": "Founding Member subscription",
                    }
                }
            },
        }
        r1 = post_signed_webhook(pay1_completed)
        assert r1.status_code == 200, r1.text

        # Verify creator counts include the completed payment
        m1 = client.get(
            "/api/v1/metrics/affiliates?code=creator-refund-test", headers=headers
        )
        assert m1.status_code == 200, m1.text
        item1 = m1.json()["items"][0]
        assert item1["signups_count"] == 1
        assert item1["verified_count"] == 1
        assert item1["payments_count"] == 1
        assert item1["gross_cents"] == 1499
        assert item1["owed_cents"] == 749

        # 2. Pending refund.created should NOT exclude the payment yet
        refund1_pending = {
            "event_id": "evt_ref_refund_1_pending",
            "type": "refund.created",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "data": {
                "object": {
                    "refund": {
                        "id": "rfd_1",
                        "payment_id": "pay_ref_customer_1",
                        "status": "PENDING",
                        "amount_money": {"amount": 1499, "currency": "USD"},
                    }
                }
            },
        }
        r2 = post_signed_webhook(refund1_pending)
        assert r2.status_code == 200, r2.text

        m2 = client.get(
            "/api/v1/metrics/affiliates?code=creator-refund-test", headers=headers
        )
        assert m2.json()["items"][0]["payments_count"] == 1

        # 3. Completed refund.updated marks the allocation 'refunded' and excludes it
        refund1_completed = {
            "event_id": "evt_ref_refund_1_completed",
            "type": "refund.updated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "data": {
                "object": {
                    "refund": {
                        "id": "rfd_1",
                        "payment_id": "pay_ref_customer_1",
                        "status": "COMPLETED",
                        "amount_money": {"amount": 1499, "currency": "USD"},
                    }
                }
            },
        }
        r3 = post_signed_webhook(refund1_completed)
        assert r3.status_code == 200, r3.text

        m3 = client.get(
            "/api/v1/metrics/affiliates?code=creator-refund-test", headers=headers
        )
        assert m3.status_code == 200, m3.text
        item3 = m3.json()["items"][0]
        assert item3["payments_count"] == 0
        assert item3["gross_cents"] == 0
        assert item3["owed_cents"] == 0

        # 4. Second completed payment followed by payment.updated with refunded_money > 0
        pay2_completed = {
            "event_id": "evt_ref_pay_2_completed",
            "type": "payment.created",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "data": {
                "object": {
                    "payment": {
                        "id": "pay_ref_customer_2",
                        "status": "COMPLETED",
                        "amount_money": {"amount": 3999, "currency": "USD"},
                        "buyer_email_address": "buyer-refund@example.com",
                        "note": "3-Month Founder plan",
                    }
                }
            },
        }
        r4 = post_signed_webhook(pay2_completed)
        assert r4.status_code == 200, r4.text

        m4 = client.get(
            "/api/v1/metrics/affiliates?code=creator-refund-test", headers=headers
        )
        assert m4.json()["items"][0]["payments_count"] == 1
        assert m4.json()["items"][0]["gross_cents"] == 3999
        assert m4.json()["items"][0]["owed_cents"] == 1999

        pay2_refunded = {
            "event_id": "evt_ref_pay_2_refunded",
            "type": "payment.updated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "data": {
                "object": {
                    "payment": {
                        "id": "pay_ref_customer_2",
                        "status": "COMPLETED",
                        "amount_money": {"amount": 3999, "currency": "USD"},
                        "refunded_money": {"amount": 3999, "currency": "USD"},
                        "buyer_email_address": "buyer-refund@example.com",
                        "note": "3-Month Founder plan",
                    }
                }
            },
        }
        r5 = post_signed_webhook(pay2_refunded)
        assert r5.status_code == 200, r5.text

        m5 = client.get(
            "/api/v1/metrics/affiliates?code=creator-refund-test", headers=headers
        )
        item5 = m5.json()["items"][0]
        assert item5["payments_count"] == 0
        assert item5["gross_cents"] == 0
        assert item5["owed_cents"] == 0

        async def fetch_statuses() -> dict[str, str]:
            async with db_session_factory() as session:
                rows = (
                    await session.scalars(
                        select(RevenueAllocation).where(
                            RevenueAllocation.user_id == referred_user_id
                        )
                    )
                ).all()
                return {row.square_payment_id: row.status for row in rows}

        statuses = asyncio.run(fetch_statuses())
        assert statuses == {
            "pay_ref_customer_1": "refunded",
            "pay_ref_customer_2": "refunded",
        }
    finally:
        get_settings.cache_clear()
