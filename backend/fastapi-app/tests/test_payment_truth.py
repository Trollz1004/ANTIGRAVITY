"""Unit tests for payment_truth.py — no DB or fixtures required.

Covers:
- infer_payment_tier() for all 5 live products
- Catalog drift hints return None
- build_checkout_reference / parse_checkout_reference round-trip
- Tampered signature rejected
- Expired membership record rejected
- Malformed / empty membership record rejected
- extract_checkout_reference() from note text
- extract_payment_proof_label() for card, wallet, bank, cash, unknown
- proof_label_is_wallet() helper
"""

import time
import uuid

from app.payment_truth import (
    BOT_SHIELD_CENTS,
    FOUNDING_MEMBER_CENTS,
    ROYALTY_CARD_CENTS,
    THREE_MONTH_FOUNDER_CENTS,
    TWELVE_MONTH_FOUNDER_CENTS,
    build_checkout_reference,
    build_checkout_reference_note,
    extract_checkout_reference,
    extract_payment_proof_label,
    infer_payment_tier,
    parse_checkout_reference,
    proof_label_is_wallet,
)

SECRET = "test-secret-at-least-32-chars-long"


# ── infer_payment_tier ──────────────────────────────────────────────────────


def test_infer_tier_bot_shield():
    assert (
        infer_payment_tier(
            amount_cents=BOT_SHIELD_CENTS, text_hints=["Bot-Shield Verification"]
        )
        == "bot_shield"
    )


def test_infer_tier_founding_member():
    assert (
        infer_payment_tier(
            amount_cents=FOUNDING_MEMBER_CENTS, text_hints=["founding member"]
        )
        == "founding_member"
    )


def test_infer_tier_3_month():
    assert (
        infer_payment_tier(
            amount_cents=THREE_MONTH_FOUNDER_CENTS, text_hints=["3-month founder"]
        )
        == "3_month"
    )


def test_infer_tier_12_month():
    assert (
        infer_payment_tier(
            amount_cents=TWELVE_MONTH_FOUNDER_CENTS, text_hints=["12 month founder"]
        )
        == "12_month"
    )


def test_infer_tier_royalty():
    assert (
        infer_payment_tier(amount_cents=ROYALTY_CARD_CENTS, text_hints=["royalty card"])
        == "royalty"
    )


def test_infer_tier_amount_alone_no_hints():
    # Amount match with empty hint list should still classify by amount
    assert (
        infer_payment_tier(amount_cents=BOT_SHIELD_CENTS, text_hints=[]) == "bot_shield"
    )


def test_infer_tier_catalog_drift_hint_blocks_classification():
    """Old alternate processor-era product names must not be classified."""
    assert (
        infer_payment_tier(
            amount_cents=FOUNDING_MEMBER_CENTS,
            text_hints=["basic monthly subscription"],
        )
        is None
    )


def test_infer_tier_unknown_amount():
    assert (
        infer_payment_tier(amount_cents=9999999, text_hints=["founding member"]) is None
    )


def test_infer_tier_none_amount():
    assert infer_payment_tier(amount_cents=None, text_hints=["bot shield"]) is None


def test_infer_tier_drift_hint_cic2fnig():
    assert (
        infer_payment_tier(amount_cents=FOUNDING_MEMBER_CENTS, text_hints=["cic2fnig"])
        is None
    )


# ── build / parse checkout reference round-trip ─────────────────────────────


def _build_and_parse(tier: str = "bot_shield", max_age: int = 172_800) -> dict:
    user_id = uuid.uuid4()
    event_id = uuid.uuid4()
    membership_record = build_checkout_reference(
        user_id=user_id, event_id=event_id, tier=tier, secret=SECRET
    )
    result = parse_checkout_reference(
        membership_record, secret=SECRET, max_age_seconds=max_age
    )
    assert result is not None
    assert result["user_id"] == user_id
    assert result["event_id"] == event_id
    assert result["tier"] == tier
    return result


def test_round_trip_bot_shield():
    _build_and_parse("bot_shield")


def test_round_trip_founding_member():
    _build_and_parse("founding_member")


def test_round_trip_royalty():
    _build_and_parse("royalty")


def test_tampered_signature_rejected():
    membership_record = build_checkout_reference(
        user_id=uuid.uuid4(), event_id=uuid.uuid4(), tier="bot_shield", secret=SECRET
    )
    version, payload, sig = membership_record.split(".", 2)
    # Flip one character in the signature
    bad_sig = sig[:-1] + ("A" if sig[-1] != "A" else "B")
    bad_token = f"{version}.{payload}.{bad_sig}"
    assert parse_checkout_reference(bad_token, secret=SECRET) is None


def test_wrong_secret_rejected():
    membership_record = build_checkout_reference(
        user_id=uuid.uuid4(), event_id=uuid.uuid4(), tier="bot_shield", secret=SECRET
    )
    assert (
        parse_checkout_reference(
            membership_record, secret="wrong-secret-here-totally-different"
        )
        is None
    )


def test_expired_token_rejected():
    issued_at = int(time.time()) - 200_000  # well past 48h
    membership_record = build_checkout_reference(
        user_id=uuid.uuid4(),
        event_id=uuid.uuid4(),
        tier="bot_shield",
        secret=SECRET,
        issued_at=issued_at,
    )
    assert (
        parse_checkout_reference(
            membership_record, secret=SECRET, max_age_seconds=172_800
        )
        is None
    )


def test_max_age_zero_skips_expiry_check():
    issued_at = int(time.time()) - 999_999
    membership_record = build_checkout_reference(
        user_id=uuid.uuid4(),
        event_id=uuid.uuid4(),
        tier="bot_shield",
        secret=SECRET,
        issued_at=issued_at,
    )
    result = parse_checkout_reference(
        membership_record, secret=SECRET, max_age_seconds=0
    )
    assert result is not None


def test_none_token_returns_none():
    assert parse_checkout_reference(None, secret=SECRET) is None


def test_empty_string_token_returns_none():
    assert parse_checkout_reference("", secret=SECRET) is None


def test_malformed_token_returns_none():
    assert parse_checkout_reference("notavalidtoken", secret=SECRET) is None


def test_wrong_version_returns_none():
    membership_record = build_checkout_reference(
        user_id=uuid.uuid4(), event_id=uuid.uuid4(), tier="bot_shield", secret=SECRET
    )
    bad = "v99" + membership_record[2:]
    assert parse_checkout_reference(bad, secret=SECRET) is None


# ── extract_checkout_reference ───────────────────────────────────────────────


def test_extract_ref_from_note():
    membership_record = build_checkout_reference(
        user_id=uuid.uuid4(), event_id=uuid.uuid4(), tier="bot_shield", secret=SECRET
    )
    note = build_checkout_reference_note("bot_shield", membership_record)
    extracted = extract_checkout_reference(note)
    assert extracted == membership_record


def test_extract_ref_returns_none_when_absent():
    assert extract_checkout_reference("no reference here") is None


def test_extract_ref_multiple_args_first_wins():
    membership_record = build_checkout_reference(
        user_id=uuid.uuid4(), event_id=uuid.uuid4(), tier="bot_shield", secret=SECRET
    )
    note = build_checkout_reference_note("bot_shield", membership_record)
    extracted = extract_checkout_reference(None, "", note)
    assert extracted == membership_record


# ── extract_payment_proof_label ──────────────────────────────────────────────


def test_proof_label_cash():
    assert extract_payment_proof_label({"cash_details": {"amount": 100}}) == "cash"


def test_proof_label_bank_account():
    assert (
        extract_payment_proof_label({"bank_account_details": {"last_4": "1234"}})
        == "bank_account"
    )


def test_proof_label_card():
    payment = {
        "card_details": {
            "card": {"card_brand": "VISA"},
        }
    }
    assert extract_payment_proof_label(payment) == "card:VISA"


def test_proof_label_wallet():
    payment = {
        "card_details": {
            "wallet_details": {"status": "ON_FILE", "brand": "APPLE_PAY"},
        }
    }
    label = extract_payment_proof_label(payment)
    assert label == "wallet:APPLE_PAY"


def test_proof_label_wallet_no_brand_fallback():
    payment = {
        "card_details": {
            "wallet_details": {"status": "ON_FILE"},
        }
    }
    label = extract_payment_proof_label(payment)
    assert label.startswith("wallet:")


def test_proof_label_source_type_fallback():
    payment = {"source_type": "EXTERNAL"}
    assert extract_payment_proof_label(payment) == "external"


def test_proof_label_unknown():
    assert extract_payment_proof_label({}) == "unknown"


# ── proof_label_is_wallet ────────────────────────────────────────────────────


def test_is_wallet_true():
    assert proof_label_is_wallet("wallet:APPLE_PAY") is True


def test_is_wallet_false_for_card():
    assert proof_label_is_wallet("card:VISA") is False


def test_is_wallet_false_for_none():
    assert proof_label_is_wallet(None) is False
